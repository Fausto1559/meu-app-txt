import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAdmin, mockGetAdminSupabase, mockProcessAsaasEvent } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockGetAdminSupabase: vi.fn(),
  mockProcessAsaasEvent: vi.fn(),
}));

vi.mock('../_lib/adminAuth.js', () => ({ requireAdmin: mockRequireAdmin }));
vi.mock('../_lib/adminSupabase.js', () => ({ getAdminSupabase: mockGetAdminSupabase }));
vi.mock('../_lib/processAsaasEvent.js', () => ({ processAsaasEvent: mockProcessAsaasEvent }));

import handler from './webhook-events';

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

function createSupabase(event: any) {
  const updates: any[] = [];
  const filters: any[] = [];
  const supabase = {
    from(table: string) {
      let updateValue: any = null;
      const query: any = {
        select() { return query; },
        eq(column: string, value: unknown) { filters.push({ column, value }); return query; },
        in() { return query; },
        or(value: string) { filters.push({ or: value }); return query; },
        order() { return query; },
        limit() { return query; },
        update(value: unknown) { updateValue = value; updates.push(value); return query; },
        maybeSingle: vi.fn(async () => ({ data: { id: event.id }, error: null })),
        then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) {
          if (updateValue) return Promise.resolve({ error: null }).then(resolve, reject);
          return Promise.resolve({ data: [event], error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  return { supabase, updates, filters };
}

describe('/api/admin/webhook-events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ user: { id: 'admin-1' }, role: 'owner' });
    mockProcessAsaasEvent.mockResolvedValue(undefined);
  });

  it('rejects an unauthenticated administrator before accessing webhook records', async () => {
    mockRequireAdmin.mockResolvedValue({ status: 403, error: 'Forbidden' });
    const from = vi.fn();
    mockGetAdminSupabase.mockReturnValue({ from });
    const res = createResponse();

    await handler({ method: 'POST', headers: {}, body: { eventIds: ['evt-1'] } } as any, res as any);

    expect(res.statusCode).toBe(403);
    expect(from).not.toHaveBeenCalled();
    expect(mockProcessAsaasEvent).not.toHaveBeenCalled();
  });

  it('claims a processing event with a lease and clears it after successful replay', async () => {
    const event = {
      id: 'evt-stale',
      provider_event_id: 'asaas-evt-stale',
      payload: { id: 'asaas-evt-stale', event: 'PAYMENT_CREATED' },
      processing_status: 'processing',
      processing_started_at: '2026-11-24T18:00:00.000Z',
      attempts: 2,
    };
    const { supabase, updates, filters } = createSupabase(event);
    mockGetAdminSupabase.mockReturnValue(supabase);
    const res = createResponse();

    await handler({
      method: 'POST',
      headers: {},
      body: { eventIds: ['evt-stale'] },
    } as any, res as any);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, requested: 1, processed: 1, failed: 0 });
    expect(mockProcessAsaasEvent).toHaveBeenCalledWith(event.payload);
    expect(updates[0]).toMatchObject({ processing_status: 'processing', attempts: 3 });
    expect(typeof updates[0].processing_started_at).toBe('string');
    expect(updates[1]).toMatchObject({ processing_status: 'processed', processing_started_at: null });
    expect(filters.some((filter) => filter.column === 'processing_started_at')).toBe(true);
  });

  it('marks a failed replay and releases its lease', async () => {
    const event = {
      id: 'evt-fail',
      provider_event_id: 'asaas-evt-fail',
      payload: { id: 'asaas-evt-fail', event: 'PAYMENT_CREATED' },
      processing_status: 'failed',
      processing_started_at: null,
      attempts: 0,
    };
    const { supabase, updates } = createSupabase(event);
    mockGetAdminSupabase.mockReturnValue(supabase);
    mockProcessAsaasEvent.mockRejectedValue(new Error('simulated processing failure'));
    const res = createResponse();

    await handler({
      method: 'POST',
      headers: {},
      body: { eventIds: ['evt-fail'] },
    } as any, res as any);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, requested: 1, processed: 0, failed: 1 });
    expect(updates[0]).toMatchObject({ processing_status: 'processing' });
    expect(updates[1]).toMatchObject({ processing_status: 'failed', processing_started_at: null });
    expect(updates[1].last_error).toContain('simulated processing failure');
  });
});
