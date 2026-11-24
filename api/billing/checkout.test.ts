import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAuthenticatedUser, mockAsaasRequest, mockGetAsaasEnvironment, mockIsValidCpfCnpj } = vi.hoisted(() => ({
  mockGetAuthenticatedUser: vi.fn(),
  mockAsaasRequest: vi.fn(),
  mockGetAsaasEnvironment: vi.fn(() => 'sandbox'),
  mockIsValidCpfCnpj: vi.fn(() => true),
}));

vi.mock('../_lib/userAuth.js', () => ({
  getAuthenticatedUser: mockGetAuthenticatedUser,
}));
vi.mock('../_lib/asaas.js', () => ({
  asaasRequest: mockAsaasRequest,
  getAsaasEnvironment: mockGetAsaasEnvironment,
  isValidCpfCnpj: mockIsValidCpfCnpj,
}));

import handler from './checkout';

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
});
