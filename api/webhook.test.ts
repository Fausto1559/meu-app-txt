import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAdminSupabase, mockProcessAsaasEvent } = vi.hoisted(() => ({
  mockGetAdminSupabase: vi.fn(),
  mockProcessAsaasEvent: vi.fn(),
}));

vi.mock('./_lib/adminSupabase.js', () => ({
  getAdminSupabase: mockGetAdminSupabase,
}));

vi.mock('./_lib/processAsaasEvent.js', () => ({
  processAsaasEvent: mockProcessAsaasEvent,
}));

import handler from './webhook';

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

describe('POST /api/webhook', () => {
  beforeEach(() => {
    vi.stubEnv('ASAAS_WEBHOOK_TOKEN', '0123456789abcdef0123456789abcdef');
    vi.stubEnv('SUPABASE_URL', 'https://eerqeimqzkgdpvutjfhm.supabase.co');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_test_only_not_a_real_key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    mockGetAdminSupabase.mockReset();
    mockProcessAsaasEvent.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects methods other than POST', async () => {
    const req = { method: 'GET', headers: {} } as any;
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('POST');
    expect(mockGetAdminSupabase).not.toHaveBeenCalled();
  });

  it('fails closed when the server-side webhook configuration is absent', async () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');

    const req = { method: 'POST', headers: {} } as any;
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({
      ok: false,
      error: 'Webhook Asaas ainda não configurado no servidor.',
    });
    expect(mockGetAdminSupabase).not.toHaveBeenCalled();
  });

  it('rejects an invalid Asaas access token before accessing the database', async () => {
    const req = {
      method: 'POST',
      headers: { 'asaas-access-token': 'wrong-token' },
      body: { id: 'evt-1', event: 'PAYMENT_CONFIRMED', payment: { id: 'pay-1' } },
    } as any;
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ ok: false, error: 'Unauthorized' });
    expect(mockGetAdminSupabase).not.toHaveBeenCalled();
  });

  it('rejects malformed payloads before writing an event', async () => {
    const supabase = { from: vi.fn() };
    mockGetAdminSupabase.mockReturnValue(supabase);

    const req = {
      method: 'POST',
      headers: { 'asaas-access-token': '0123456789abcdef0123456789abcdef' },
      body: [],
    } as any;
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ ok: false, error: 'Payload Asaas inválido.' });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('rejects unknown event families without persisting them', async () => {
    const supabase = { from: vi.fn() };
    mockGetAdminSupabase.mockReturnValue(supabase);

    const req = {
      method: 'POST',
      headers: { 'asaas-access-token': '0123456789abcdef0123456789abcdef' },
      body: { id: 'evt-1', event: 'CUSTOMER_UPDATED', subscription: { id: 'sub-1' } },
    } as any;
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: 'Tipo de evento não compatível com o recurso recebido.',
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
