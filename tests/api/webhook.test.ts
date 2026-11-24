import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAdminSupabase, mockProcessAsaasEvent } = vi.hoisted(() => ({
  mockGetAdminSupabase: vi.fn(),
  mockProcessAsaasEvent: vi.fn(),
}));

vi.mock('../../api/_lib/adminSupabase.js', () => ({
  getAdminSupabase: mockGetAdminSupabase,
}));

vi.mock('../../api/_lib/processAsaasEvent.js', () => ({
  processAsaasEvent: mockProcessAsaasEvent,
}));

import handler from '../../api/webhook';

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


function createWebhookDatabaseMock(finalizationLost = false) {
  let maybeSingleCalls = 0;
  const operations: Array<{
    table: string;
    operation: string;
    payload?: Record<string, unknown>;
    filters: Array<[string, unknown]>;
  }> = [];

  const client = {
    from(table: string) {
      let operation = 'select';
      let payload: Record<string, unknown> | undefined;
      const filters: Array<[string, unknown]> = [];
      const query: any = {
        insert(value: Record<string, unknown>) {
          operation = 'insert';
          payload = value;
          return query;
        },
        update(value: Record<string, unknown>) {
          operation = 'update';
          payload = value;
          return query;
        },
        eq(column: string, value: unknown) {
          filters.push([column, value]);
          return query;
        },
        in(column: string, value: unknown) {
          filters.push([column, value]);
          return query;
        },
        is(column: string, value: unknown) {
          filters.push([column, value]);
          return query;
        },
        select() {
          return query;
        },
        maybeSingle: vi.fn(async () => {
          maybeSingleCalls += 1;
          operations.push({ table, operation, payload, filters: [...filters] });
          if (finalizationLost && maybeSingleCalls === 2) {
            return { data: null, error: null };
          }
          return { data: { id: 'webhook-row-1' }, error: null };
        }),
        then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) {
          operations.push({ table, operation, payload, filters: [...filters] });
          return Promise.resolve({ error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  return { client, operations };
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

  it('finalizes only the processing lease acquired by this delivery', async () => {
    const { client, operations } = createWebhookDatabaseMock();
    mockGetAdminSupabase.mockReturnValue(client);
    mockProcessAsaasEvent.mockResolvedValue(undefined);

    const res = createResponse();
    await handler({
      method: 'POST',
      headers: { 'asaas-access-token': '0123456789abcdef0123456789abcdef' },
      body: {
        id: 'evt-lease-success',
        event: 'PAYMENT_CREATED',
        payment: { id: 'pay-lease-success' },
        dateCreated: '2026-11-24T12:00:00.000Z',
      },
    } as any, res);

    expect(res.statusCode).toBe(200);
    const updates = operations.filter((operation) => operation.operation === 'update');
    expect(updates).toHaveLength(2);
    const leaseTimestamp = updates[0].payload?.processing_started_at;
    expect(typeof leaseTimestamp).toBe('string');
    expect(updates[1].filters).toContainEqual(['processing_started_at', leaseTimestamp]);
  });

  it('releases a failed processing lease only when this delivery still owns it', async () => {
    const { client, operations } = createWebhookDatabaseMock();
    mockGetAdminSupabase.mockReturnValue(client);
    mockProcessAsaasEvent.mockRejectedValue(new Error('simulated processing failure'));

    const res = createResponse();
    await handler({
      method: 'POST',
      headers: { 'asaas-access-token': '0123456789abcdef0123456789abcdef' },
      body: {
        id: 'evt-lease-failure',
        event: 'PAYMENT_CREATED',
        payment: { id: 'pay-lease-failure' },
        dateCreated: '2026-11-24T12:00:00.000Z',
      },
    } as any, res);

    expect(res.statusCode).toBe(500);
    const updates = operations.filter((operation) => operation.operation === 'update');
    expect(updates).toHaveLength(2);
    const leaseTimestamp = updates[0].payload?.processing_started_at;
    expect(typeof leaseTimestamp).toBe('string');
    expect(updates[1].filters).toContainEqual(['processing_started_at', leaseTimestamp]);
  });


  it('does not report success when a newer execution owns the processing lease', async () => {
    const { client, operations } = createWebhookDatabaseMock(true);
    mockGetAdminSupabase.mockReturnValue(client);
    mockProcessAsaasEvent.mockResolvedValue(undefined);

    const res = createResponse();
    await handler({
      method: 'POST',
      headers: { 'asaas-access-token': '0123456789abcdef0123456789abcdef' },
      body: {
        id: 'evt-lease-lost',
        event: 'PAYMENT_CREATED',
        payment: { id: 'pay-lease-lost' },
        dateCreated: '2026-11-24T12:00:00.000Z',
      },
    } as any, res);

    expect(res.statusCode).toBe(202);
    expect(res.body).toMatchObject({
      ok: true,
      persisted: true,
      processed: false,
      processing: true,
    });
    const updates = operations.filter((operation) => operation.operation === 'update');
    expect(updates[1].filters).toContainEqual([
      'processing_started_at',
      updates[0].payload?.processing_started_at,
    ]);
  });

});
