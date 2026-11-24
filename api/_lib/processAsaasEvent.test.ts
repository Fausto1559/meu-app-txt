import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAdminSupabase } = vi.hoisted(() => ({
  mockGetAdminSupabase: vi.fn(),
}));

vi.mock('./adminSupabase.js', () => ({
  getAdminSupabase: mockGetAdminSupabase,
}));

import { processAsaasEvent } from './processAsaasEvent';

const localSubscription = {
  id: 'local-sub-1',
  user_id: 'user-1',
  plan_key: 'essencial',
  provider_customer_id: 'cus-1',
};

function createSupabaseMock(subscriptionData = localSubscription, paymentData: unknown = null, rpcResult: string = 'applied') {
  const calls: Array<{ table: string; method: string; value?: unknown }> = [];
  const client = {
    rpc: vi.fn(async (name: string, args: unknown) => {
      calls.push({ table: 'rpc', method: name, value: args });
      return { data: rpcResult, error: null };
    }),
    from(table: string) {
      const query: any = {
        select(columns: string) {
          calls.push({ table, method: 'select', value: columns });
          return query;
        },
        eq(column: string, value: unknown) {
          calls.push({ table, method: 'eq', value: { column, value } });
          return query;
        },
        maybeSingle: vi.fn(async () => {
          calls.push({ table, method: 'maybeSingle' });
          if (table === 'subscriptions') return { data: subscriptionData, error: null };
          if (table === 'payments') return { data: paymentData, error: null };
          return { data: null, error: null };
        }),
        update(value: unknown) {
          calls.push({ table, method: 'update', value });
          return query;
        },
        then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) {
          return Promise.resolve({ error: null }).then(resolve, reject);
        },
        upsert: vi.fn(async (record: unknown, options: unknown) => {
          calls.push({ table, method: 'upsert', value: { record, options } });
          return { error: null };
        }),
      };
      return query;
    },
  };
  return { client, calls };
}

function paymentEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt-1',
    event: 'PAYMENT_CREATED',
    dateCreated: '2026-11-24T12:00:00.000Z',
    payment: {
      id: 'pay-1',
      subscription: 'asaas-sub-1',
      customer: 'cus-1',
      value: 19.9,
      dueDate: '2026-12-01',
      ...overrides,
    },
  };
}

describe('processAsaasEvent — validação e persistência de pagamentos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejeita data de pagamento inválida antes de consultar ou gravar o pagamento', async () => {
    const { client, calls } = createSupabaseMock();
    mockGetAdminSupabase.mockReturnValue(client);

    await expect(
      processAsaasEvent(paymentEvent({ paymentDate: 'data-invalida' })),
    ).rejects.toThrow('Data do pagamento inválida.');

    expect(calls.some((call) => call.table === 'payments')).toBe(false);
  });

  it('rejeita evento sem data de criação válida antes de fazer upsert', async () => {
    const { client, calls } = createSupabaseMock();
    mockGetAdminSupabase.mockReturnValue(client);

    await expect(
      processAsaasEvent({ ...paymentEvent(), dateCreated: 'data-invalida' }),
    ).rejects.toThrow('Data de criação do evento Asaas ausente ou inválida.');

    expect(calls.some((call) => call.method === 'upsert')).toBe(false);
  });

  it('ignora evento de assinatura mais antigo que o último evento processado', async () => {
    const existingSubscription = {
      ...localSubscription,
      status: 'active',
      metadata: { lastEventDate: '2026-11-24T12:00:00.000Z' },
    };
    const { client, calls } = createSupabaseMock(existingSubscription);
    mockGetAdminSupabase.mockReturnValue(client);

    await processAsaasEvent({
      id: 'evt-old',
      event: 'SUBSCRIPTION_UPDATED',
      dateCreated: '2026-11-23T12:00:00.000Z',
      subscription: { id: 'asaas-sub-1', customer: 'cus-1', nextDueDate: '2026-12-01' },
    });

    expect(calls.some((call) => call.method === 'update')).toBe(false);
  });

  it('ignora evento de pagamento mais antigo que o último evento persistido', async () => {
    const previousPayment = {
      status: 'received',
      metadata: { lastEventDate: '2026-11-24T12:00:00.000Z' },
    };
    const { client, calls } = createSupabaseMock(localSubscription, previousPayment, 'ignored');
    mockGetAdminSupabase.mockReturnValue(client);

    await processAsaasEvent({
      ...paymentEvent(),
      id: 'evt-old-payment',
      event: 'PAYMENT_CREATED',
      dateCreated: '2026-11-23T12:00:00.000Z',
    });

    expect(calls.some((call) => call.table === 'rpc' && call.method === 'apply_asaas_payment_event')).toBe(true);
    expect(calls.some((call) => call.method === 'upsert')).toBe(false);
    expect(calls.some((call) => call.method === 'update')).toBe(false);
  });

  it('suspende assinatura e acesso quando recebe reembolso', async () => {
    const { client, calls } = createSupabaseMock();
    mockGetAdminSupabase.mockReturnValue(client);

    await processAsaasEvent({
      ...paymentEvent(),
      event: 'PAYMENT_REFUNDED',
    });

    const transaction = calls.find((call) => call.table === 'rpc');
    expect(transaction?.method).toBe('apply_asaas_payment_event');
    expect(transaction?.value).toMatchObject({
      p_payment_status: 'refunded',
      p_subscription_id: 'local-sub-1',
      p_user_id: 'user-1',
      p_event_id: 'evt-1',
      p_event_name: 'PAYMENT_REFUNDED',
    });
    expect(calls.some((call) => call.table === 'payments' && call.method === 'upsert')).toBe(false);
    expect(calls.some((call) => call.table === 'subscriptions' && call.method === 'update')).toBe(false);
    expect(calls.some((call) => call.table === 'billing_accounts' && call.method === 'update')).toBe(false);
  });

  it('persiste um pagamento válido com conflito idempotente por provedor e ID', async () => {
    const { client, calls } = createSupabaseMock();
    mockGetAdminSupabase.mockReturnValue(client);

    await processAsaasEvent(paymentEvent());

    const transaction = calls.find((call) => call.table === 'rpc');
    expect(transaction?.method).toBe('apply_asaas_payment_event');
    expect(transaction?.value).toMatchObject({
      p_payment: {
        provider: 'asaas',
        provider_payment_id: 'pay-1',
        user_id: 'user-1',
        subscription_id: 'local-sub-1',
        value: 19.9,
        status: 'pending',
      },
      p_payment_status: 'pending',
      p_event_id: 'evt-1',
    });
    expect(calls.some((call) => call.table === 'payments' && call.method === 'upsert')).toBe(false);
  });
});
