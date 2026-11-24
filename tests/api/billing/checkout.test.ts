import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAuthenticatedUser, mockAsaasRequest, mockGetAsaasEnvironment, mockIsValidCpfCnpj } = vi.hoisted(() => ({
  mockGetAuthenticatedUser: vi.fn(),
  mockAsaasRequest: vi.fn(),
  mockGetAsaasEnvironment: vi.fn(() => 'sandbox'),
  mockIsValidCpfCnpj: vi.fn(() => true),
}));

vi.mock('../../../api/_lib/userAuth.js', () => ({
  getAuthenticatedUser: mockGetAuthenticatedUser,
}));
vi.mock('../../../api/_lib/asaas.js', () => ({
  asaasRequest: mockAsaasRequest,
  getAsaasEnvironment: mockGetAsaasEnvironment,
  isValidCpfCnpj: mockIsValidCpfCnpj,
}));

import handler from '../../../api/billing/checkout';

function createResponse() {
  const response: any = {
    statusCode: 0,
    headers: {} as Record<string, unknown>,
    body: null as unknown,
    setHeader(name: string, value: unknown) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return response;
}


function createConcurrentCheckoutSupabase() {
  let existingLookups = 0;
  let releaseExistingLookups!: () => void;
  const existingLookupsBarrier = new Promise<void>((resolve) => {
    releaseExistingLookups = resolve;
  });
  let reservationCreated = false;
  const calls: Array<{ table: string; operation: string }> = [];

  const supabase = {
    from(table: string) {
      let operation = 'select';
      const query: any = {
        select() { calls.push({ table, operation: 'select' }); return query; },
        eq() { return query; },
        in() { return query; },
        order() { return query; },
        limit() { return query; },
        insert() { operation = 'insert'; calls.push({ table, operation }); return query; },
        update() { operation = 'update'; calls.push({ table, operation }); return query; },
        upsert() { operation = 'upsert'; calls.push({ table, operation }); return query; },
        single: vi.fn(async () => {
          if (table === 'billing_accounts' && operation === 'select') {
            return { data: { trial_ends_at: '2026-12-24T00:00:00.000Z', access_status: 'trial', current_subscription_id: null }, error: null };
          }
          if (table === 'subscriptions' && operation === 'insert') {
            if (reservationCreated) return { data: null, error: { code: '23505', message: 'unique reservation conflict' } };
            reservationCreated = true;
            return { data: { id: 'reservation-1' }, error: null };
          }
          if (table === 'subscriptions' && operation === 'update') {
            return { data: { id: 'reservation-1' }, error: null };
          }
          return { data: null, error: null };
        }),
        maybeSingle: vi.fn(async () => {
          if (table === 'subscriptions' && operation === 'select') {
            existingLookups += 1;
            if (existingLookups === 2) releaseExistingLookups();
            await existingLookupsBarrier;
            return { data: null, error: null };
          }
          if (table === 'billing_customers' && operation === 'select') {
            return { data: { provider_customer_id: 'cus-existing' }, error: null };
          }
          return { data: null, error: null };
        }),
        then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) {
          return Promise.resolve({ error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  return { supabase, calls };
}

describe('POST /api/billing/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedUser.mockResolvedValue(null);
    mockIsValidCpfCnpj.mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects methods other than POST before authenticating', async () => {
    const req = { method: 'GET', headers: {} } as any;
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('POST');
    expect(mockGetAuthenticatedUser).not.toHaveBeenCalled();
  });

  it('rejects a missing authenticated session before any billing access', async () => {
    const req = { method: 'POST', headers: {}, body: {} } as any;
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ ok: false, error: 'Sessão inválida ou expirada.' });
    expect(mockAsaasRequest).not.toHaveBeenCalled();
  });

  it('rejects an unknown plan before querying billing tables or calling Asaas', async () => {
    const from = vi.fn();
    mockGetAuthenticatedUser.mockResolvedValue({
      supabase: { from },
      user: {
        id: 'user-test-001',
        email: 'test@example.com',
        created_at: '2026-11-24T00:00:00.000Z',
      },
    });

    const req = {
      method: 'POST',
      headers: {},
      body: { planKey: 'unknown', billingType: 'PIX' },
    } as any;
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ ok: false, error: 'Plano selecionado inválido.' });
    expect(from).not.toHaveBeenCalled();
    expect(mockAsaasRequest).not.toHaveBeenCalled();
  });

  it('rejects unsupported billing methods before querying billing tables or calling Asaas', async () => {
    const from = vi.fn();
    mockGetAuthenticatedUser.mockResolvedValue({
      supabase: { from },
      user: {
        id: 'user-test-001',
        email: 'test@example.com',
        created_at: '2026-11-24T00:00:00.000Z',
      },
    });

    const req = {
      method: 'POST',
      headers: {},
      body: { planKey: 'essencial', billingType: 'CREDIT_CARD', customerName: 'Cliente Teste', cpfCnpj: '52998224725' },
    } as any;
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: 'Forma de pagamento inválida. Escolha Pix ou boleto.',
    });
    expect(from).not.toHaveBeenCalled();
    expect(mockAsaasRequest).not.toHaveBeenCalled();
  });

  it('rejects invalid customer documents before querying billing tables or calling Asaas', async () => {
    const from = vi.fn();
    mockGetAuthenticatedUser.mockResolvedValue({
      supabase: { from },
      user: {
        id: 'user-test-001',
        email: 'test@example.com',
        created_at: '2026-11-24T00:00:00.000Z',
      },
    });
    mockIsValidCpfCnpj.mockReturnValue(false);

    const req = {
      method: 'POST',
      headers: {},
      body: { planKey: 'essencial', billingType: 'PIX', customerName: 'Cliente Teste', cpfCnpj: '12345678900' },
    } as any;
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: 'Informe nome e CPF/CNPJ válidos para o cadastro de cobrança.',
    });
    expect(from).not.toHaveBeenCalled();
    expect(mockAsaasRequest).not.toHaveBeenCalled();
  });

  it('serializes simultaneous checkouts before calling Asaas', async () => {
    const { supabase } = createConcurrentCheckoutSupabase();
    mockGetAuthenticatedUser.mockResolvedValue({
      supabase,
      user: {
        id: 'user-concurrent-001',
        email: 'concurrent@example.com',
        created_at: '2026-11-24T00:00:00.000Z',
      },
    });
    mockAsaasRequest.mockResolvedValue({
      id: 'asaas-subscription-1',
      status: 'PENDING',
      nextDueDate: '2026-12-24',
    });

    const makeRequest = () => ({
      method: 'POST',
      headers: {},
      body: {
        planKey: 'essencial',
        billingType: 'PIX',
        customerName: 'Cliente Concorrente',
        cpfCnpj: '52998224725',
      },
    } as any);

    const firstResponse = createResponse();
    const secondResponse = createResponse();
    await Promise.all([
      handler(makeRequest(), firstResponse),
      handler(makeRequest(), secondResponse),
    ]);

    expect([firstResponse.statusCode, secondResponse.statusCode].sort()).toEqual([201, 409]);
    expect(mockAsaasRequest).toHaveBeenCalledTimes(1);
    expect(mockAsaasRequest).toHaveBeenCalledWith('/subscriptions', expect.objectContaining({ method: 'POST' }));
    expect(mockAsaasRequest).not.toHaveBeenCalledWith('/customers', expect.anything());
  });
});
