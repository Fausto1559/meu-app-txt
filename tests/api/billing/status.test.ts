import { describe, expect, it, vi } from 'vitest';

const { mockGetAuthenticatedUser } = vi.hoisted(() => {
  const account = {
    trial_started_at: '2026-11-24T00:00:00.000Z',
    trial_ends_at: '2026-12-24T00:00:00.000Z',
    access_status: 'trial',
    current_plan_key: null,
    current_subscription_id: null,
  };
  const query = {
    upsert: vi.fn(async () => ({ error: null })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(async () => ({ data: account, error: null })),
      })),
    })),
  };
  const supabase = { from: vi.fn(() => query) };
  return {
    mockGetAuthenticatedUser: vi.fn(async (req: any) =>
      req.headers?.authorization
        ? { supabase, user: { id: 'user-test-001', created_at: '2026-11-24T00:00:00.000Z' } }
        : null
    ),
  };
});

vi.mock('../../../api/_lib/userAuth.js', () => ({
  getAuthenticatedUser: mockGetAuthenticatedUser,
}));

import handler from '../../../api/billing/status';

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

  it('returns the authoritative trial status for an authenticated user', async () => {
    const req = { method: 'GET', headers: { authorization: 'Bearer valid-test-token' } } as any;
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.account.accessStatus).toBe('trial');
    expect(res.body.account.trialStartedAt).toBe('2026-11-24T00:00:00.000Z');
    expect(res.body.account.planName).toBeNull();
  });

  it('rejects methods other than GET', async () => {
    const req = { method: 'POST', headers: {} } as any;
    const res = createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ ok: false, error: 'Method Not Allowed' });
  });
});
