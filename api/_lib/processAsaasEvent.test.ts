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

function createSupabaseMock() {
  const calls: Array<{ table: string; method: string; value?: unknown }> = [];
  const client = {
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
          if (table === 'subscriptions') return { data: localSubscription, error: null };
          return { data: null, error: null };
        }),
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

  it('persiste um pagamento válido com conflito idempotente por provedor e ID', async () => {
    const { client, calls } = createSupabaseMock();
    mockGetAdminSupabase.mockReturnValue(client);

    await processAsaasEvent(paymentEvent());

    const upsert = calls.find((call) => call.method === 'upsert');
    expect(upsert).toBeDefined();
    expect(upsert?.table).toBe('payments');
    expect(upsert?.value).toMatchObject({
      options: { onConflict: 'provider,provider_payment_id' },
      record: {
        provider: 'asaas',
        provider_payment_id: 'pay-1',
        user_id: 'user-1',
        subscription_id: 'local-sub-1',
        value: 19.9,
        status: 'pending',
      },
    });
  });
});
