import type { VercelRequest } from '@vercel/node';
import { getAdminSupabase } from './adminSupabase.js';
import { writeAdminAuditLog } from './adminAudit.js';

export const ADMIN_ROLES = ['owner', 'admin', 'support', 'analyst'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminAuthResult =
  | { ok: true; userId: string; role: AdminRole }
  | { ok: false; status: 401 | 403 | 503; error: string };

function getBearerToken(req: Pick<VercelRequest, 'headers'>): string | null {
  const authorization = req.headers?.authorization;

  // Rejeita cabeçalhos ambíguos ou malformados.
  if (typeof authorization !== 'string') return null;

  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization.trim());
  return match?.[1] ?? null;
}

/**
 * Valida a sessão no Supabase Auth e consulta a autorização pelo UUID.
 * Nenhuma permissão é derivada de e-mail, URL, localStorage ou frontend.
 */
export async function requireAdmin(
  req: Pick<VercelRequest, 'headers'>,
  allowedRoles?: readonly AdminRole[],
): Promise<AdminAuthResult> {
  const accessToken = getBearerToken(req);

  if (!accessToken) {
    return { ok: false, status: 401, error: 'Autenticação necessária.' };
  }

  try {
    const supabase = getAdminSupabase();
    const { data: authData, error: authError } =
      await supabase.auth.getUser(accessToken);

    if (authError || !authData.user?.id) {
      await writeAdminAuditLog(req, { action: 'admin_authentication', resource: 'admin_memberships', result: 'denied' });
      const status = authError && [401, 403].includes(authError.status ?? 0)
        ? 401
        : authError
          ? 503
          : 401;

      return {
        ok: false,
        status,
        error: status === 401
          ? 'Sessão inválida ou expirada.'
          : 'Não foi possível validar a sessão.',
      };
    }

    const { data: membership, error: membershipError } = await supabase
      .from('admin_memberships')
      .select('role, is_active')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (membershipError) {
      await writeAdminAuditLog(req, { adminUserId: authData.user.id, action: 'admin_authorization_lookup', resource: 'admin_memberships', result: 'error' });
      return {
        ok: false,
        status: 503,
        error: 'Não foi possível verificar a autorização administrativa.',
      };
    }

    if (!membership || membership.is_active !== true) {
      await writeAdminAuditLog(req, { adminUserId: authData.user.id, action: 'admin_authorization', resource: 'admin_memberships', resourceId: authData.user.id, result: 'denied' });
      return {
        ok: false,
        status: 403,
        error: 'Acesso administrativo não autorizado.',
      };
    }

    if (
      !ADMIN_ROLES.includes(membership.role as AdminRole) ||
      (allowedRoles && !allowedRoles.includes(membership.role as AdminRole))
    ) {
      await writeAdminAuditLog(req, { adminUserId: authData.user.id, action: 'admin_role_check', resource: 'admin_memberships', resourceId: authData.user.id, result: 'denied' });
      return {
        ok: false,
        status: 403,
        error: 'Acesso administrativo não autorizado.',
      };
    }

    await writeAdminAuditLog(req, { adminUserId: authData.user.id, action: 'admin_access_granted', resource: 'admin_memberships', resourceId: authData.user.id, result: 'success' });
    return {
      ok: true,
      userId: authData.user.id,
      role: membership.role as AdminRole,
    };
  } catch {
    return {
      ok: false,
      status: 503,
      error: 'Serviço de autorização temporariamente indisponível.',
    };
  }
}
