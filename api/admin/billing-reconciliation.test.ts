import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAdmin, mockGetAdminSupabase, mockAsaasRequest } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockGetAdminSupabase: vi.fn(),
  mockAsaasRequest: vi.fn(),
}));

vi.mock('../_lib/adminAuth.js', () => ({ requireAdmin: mockRequireAdmin }));
vi.mock('../_lib/adminSupabase.js', () => ({ getAdminSupabase: mockGetAdminSupabase }));
vi.mock('../_lib/asaas.js', () => ({ asaasRequest: mockAsaasRequest }));

import handler from './billing-reconciliation';

const reservation = {
  id: 'reservation-1',
  user_id: 'user-1',
  provider_customer_id: null,
  provider_subscription_id: null,
  plan_key: 'essencial',
  status: 'pending',
  value: 19.9,
  billing_type: 'PIX',
  metadata: { checkoutReservation: true },
};

function createResponse() {
  return {
    statusCode: 0,
    headers: {} as Record<string, unknown>,
    body: null as any,
    setHeader(name: string, value: unknown) { this.headers[name] = value; },
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
}

function createSupabase() {
  const writes: string[] = [];
  const supabase = {
    from(table: string) {
      const query: any = {
        select() { return query; },
        eq() { return query; },
        order() { return query; },
        limit() { return query; },
        update() { writes.push(table + '.update'); return query; },
        upsert() { writes.push(table + '.upsert'); return query; },
        maybeSingle: vi.fn(async () => ({ data: reservation, error: null })),
        then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) {
          return Promise.resolve({ data: [], error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  return { supabase, writes };
}

describe('POST /api/admin/billing-reconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ user: { id: 'owner-1' }, role: 'owner' });
    const { supabase } = createSupabase();
    mockGetAdminSupabase.mockReturnValue(supabase);
  });

  it('rejects methods other than GET and POST', async () => {
    const res = createResponse();
    await handler({ method: 'DELETE', headers: {} } as any, res as any);
    expect(res.statusCode).toBe(405);
    expect(mockAsaasRequest).not.toHaveBeenCalled();
  });

  it('rejects malformed reservation IDs before querying Asaas', async () => {
    const res = createResponse();
    await handler({
      method: 'POST',
      headers: {},
      body: { reservationId: '' },
    } as any, res as any);
    expect(res.statusCode).toBe(400);
    expect(mockAsaasRequest).not.toHaveBeenCalled();
  });

  it('does not choose automatically when multiple exact Asaas customers match', async () => {
    const { supabase, writes } = createSupabase();
    mockGetAdminSupabase.mockReturnValue(supabase);
    mockAsaasRequest.mockResolvedValue({
      data: [
        { id: 'cus-1', externalReference: 'user-1', name: 'Cliente Um', email: 'um@example.com' },
        { id: 'cus-2', externalReference: 'user-1', name: 'Cliente Dois', email: 'dois@example.com' },
      ],
    });

    const res = createResponse();
    await handler({
      method: 'POST',
      headers: {},
      body: { reservationId: 'reservation-1' },
    } as any, res as any);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      reconciled: false,
      reason: 'multiple_customers_found',
      matches: 2,
    });
    expect(mockAsaasRequest).toHaveBeenCalledTimes(1);
    expect(writes).toEqual([]);
  });

  it('preserves the reservation when no exact Asaas customer is found', async () => {
    mockAsaasRequest.mockResolvedValue({ data: [] });

    const res = createResponse();
    await handler({
      method: 'POST',
      headers: {},
      body: { reservationId: 'reservation-1' },
    } as any, res as any);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      reconciled: false,
      reason: 'customer_not_found',
      matches: 0,
    });
    expect(mockAsaasRequest).toHaveBeenCalledTimes(1);
  });

  it('links an ACTIVE Asaas subscription without activating paid access before payment confirmation', async () => {
    const { supabase, writes } = createSupabase();
    mockGetAdminSupabase.mockReturnValue(supabase);
    mockAsaasRequest
      .mockResolvedValueOnce({
        data: [{ id: 'cus-1', externalReference: 'user-1', name: 'Synthetic Test', email: 'synthetic@example.invalid' }],
      })
      .mockResolvedValueOnce({
        data: [{
          id: 'sub-1',
          customer: 'cus-1',
          externalReference: 'copiloto:user-1:essencial',
          status: 'ACTIVE',
          value: 19.9,
          billingType: 'PIX',
          nextDueDate: '2026-12-24',
        }],
      });

    const res = createResponse();
    await handler({
      method: 'POST',
      headers: {},
      body: { reservationId: 'reservation-1' },
    } as any, res as any);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      reconciled: true,
      subscriptionLinked: true,
      subscriptionStatus: 'pending',
      accessActivated: false,
    });
    expect(writes.some((write) => write.startsWith('subscriptions.update'))).toBe(true);
    expect(writes.some((write) => write.startsWith('billing_accounts.update'))).toBe(true);
  });
});
