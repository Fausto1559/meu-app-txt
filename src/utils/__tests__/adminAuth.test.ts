import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAdminSupabase } = vi.hoisted(() => ({
  mockGetAdminSupabase: vi.fn(),
}));

vi.mock('../../../api/_lib/adminSupabase', () => ({
  getAdminSupabase: mockGetAdminSupabase,
}));

import { requireAdmin } from '../../../api/_lib/adminAuth';

function setupSupabase({
  userId = 'user-uuid-123',
  authError = null as null | { status?: number; message?: string },
  membership = { role: 'admin', is_active: true } as null | { role: string; is_active: boolean },
  membershipError = null as null | { message: string },
} = {}) {
  const getUser = vi.fn().mockResolvedValue({
    data: { user: userId ? { id: userId } : null },
    error: authError,
  });
  const maybeSingle = vi.fn().mockResolvedValue({
    data: membership,
    error: membershipError,
  });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  mockGetAdminSupabase.mockReturnValue({
    auth: { getUser },
    from,
  });

  return { getUser, from, select, eq, maybeSingle };
}

describe('requireAdmin — autorização administrativa no servidor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nega requisição sem token Bearer antes de acessar o Supabase', async () => {
    const result = await requireAdmin({ headers: {} } as any);

    expect(result).toEqual({
      ok: false,
      status: 401,
      error: 'Autenticação necessária.',
    });
    expect(mockGetAdminSupabase).not.toHaveBeenCalled();
  });

  it('nega token inválido ou expirado', async () => {
    setupSupabase({ authError: { status: 401 } });

    const result = await requireAdmin({
      headers: { authorization: 'Bearer token-invalido' },
    } as any);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });

  it('classifica uma chave API do servidor recusada como indisponibilidade, não como sessão expirada', async () => {
    const { from } = setupSupabase({
      authError: { status: 401, message: 'Invalid API key' },
    });

    const result = await requireAdmin({
      headers: { authorization: 'Bearer token-valido' },
    } as any);

    expect(result).toEqual({
      ok: false,
      status: 503,
      error: 'Não foi possível validar a sessão.',
    });
    // Não tenta gravar auditoria usando a mesma chave de servidor que foi recusada.
    expect(from).not.toHaveBeenCalled();
  });

  it('nega usuário autenticado sem membership administrativa', async () => {
    setupSupabase({ membership: null });

    const result = await requireAdmin({
      headers: { authorization: 'Bearer token-valido' },
    } as any);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });

  it('nega membership desativada', async () => {
    setupSupabase({ membership: { role: 'admin', is_active: false } });

    const result = await requireAdmin({
      headers: { authorization: 'Bearer token-valido' },
    } as any);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });

  it('nega falha ao consultar a tabela de autorizações sem liberar acesso', async () => {
    setupSupabase({ membershipError: { message: 'database unavailable' } });

    const result = await requireAdmin({
      headers: { authorization: 'Bearer token-valido' },
    } as any);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(503);
  });

  it('autoriza somente membership ativa com papel reconhecido', async () => {
    const { getUser, from, eq } = setupSupabase({
      membership: { role: 'admin', is_active: true },
    });

    const result = await requireAdmin({
      headers: { authorization: 'Bearer token-valido' },
    } as any);

    expect(result).toEqual({
      ok: true,
      userId: 'user-uuid-123',
      role: 'admin',
    });
    expect(getUser).toHaveBeenCalledWith('token-valido');
    expect(from).toHaveBeenCalledWith('admin_memberships');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-uuid-123');
  });

  it('respeita a lista de papéis permitidos pelo endpoint', async () => {
    setupSupabase({ membership: { role: 'support', is_active: true } });

    const result = await requireAdmin(
      { headers: { authorization: 'Bearer token-valido' } } as any,
      ['owner', 'admin'],
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });
});
