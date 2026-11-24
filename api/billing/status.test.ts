import { describe, expect, it, vi } from 'vitest';
import handler from './status';

function createResponse() {
  const response: any = {
    statusCode: 0,
    body: null,
    setHeader: vi.fn(),
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

describe('GET /api/billing/status', () => {
  it('rejects requests without a bearer session before accessing privileged Supabase config', async () => {
    const req = { method: 'GET', headers: {} } as any;
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ ok: false, error: 'Sessão inválida ou expirada.' });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store, max-age=0');
  });

  it('rejects methods other than GET', async () => {
    const req = { method: 'POST', headers: {} } as any;
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ ok: false, error: 'Method Not Allowed' });
  });
});
