import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAdminSupabase } = vi.hoisted(() => ({
  mockGetAdminSupabase: vi.fn(),
}));

vi.mock('./adminSupabase.js', () => ({
  getAdminSupabase: mockGetAdminSupabase,
}));

import { getAuthenticatedUser, SupabaseServerConfigurationError } from './userAuth';

describe('getAuthenticatedUser — server and user credential handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('does not access the server client when the bearer header is missing', async () => {
    const result = await getAuthenticatedUser({ headers: {} });

    expect(result).toBeNull();
    expect(mockGetAdminSupabase).not.toHaveBeenCalled();
  });

  it('rejects malformed bearer headers without calling Supabase', async () => {
    const result = await getAuthenticatedUser({
      headers: { authorization: 'Bearer token with spaces' },
    });

    expect(result).toBeNull();
    expect(mockGetAdminSupabase).not.toHaveBeenCalled();
  });

  it('returns the authenticated user after Supabase verifies the bearer token', async () => {
    const user = { id: 'user-uuid-123', email: 'test@example.com' };
    const supabase = { auth: { getUser: vi.fn(async () => ({ data: { user }, error: null })) } };
    mockGetAdminSupabase.mockReturnValue(supabase);

    const result = await getAuthenticatedUser({
      headers: { authorization: 'Bearer valid-user-access-token' },
    });

    expect(result).toEqual({ supabase, user });
    expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-user-access-token');
  });

  it('returns null for an invalid user JWT instead of classifying it as a server outage', async () => {
    const supabase = {
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: null },
          error: { status: 401, message: 'Invalid JWT' },
        })),
      },
    };
    mockGetAdminSupabase.mockReturnValue(supabase);

    const result = await getAuthenticatedUser({
      headers: { authorization: 'Bearer expired-user-token' },
    });

    expect(result).toBeNull();
  });

  it('returns a server-side 503 for an invalid Supabase API key', async () => {
    const supabase = {
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: null },
          error: { status: 401, message: 'Invalid API key' },
        })),
      },
    };
    mockGetAdminSupabase.mockReturnValue(supabase);

    await expect(getAuthenticatedUser({
      headers: { authorization: 'Bearer valid-user-token' },
    })).rejects.toBeInstanceOf(SupabaseServerConfigurationError);

    await expect(getAuthenticatedUser({
      headers: { authorization: 'Bearer valid-user-token' },
    })).rejects.toMatchObject({ status: 503 });
  });

  it('returns a server-side 503 when the privileged client cannot be configured', async () => {
    mockGetAdminSupabase.mockImplementation(() => {
      throw new Error('missing server key');
    });

    await expect(getAuthenticatedUser({
      headers: { authorization: 'Bearer valid-user-token' },
    })).rejects.toMatchObject({ status: 503 });
  });
});
