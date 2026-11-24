import type { VercelRequest } from '@vercel/node';
import { getAdminSupabase } from './adminSupabase.js';

type AuditResult = 'success' | 'denied' | 'error';

function getRequestId(req: Pick<VercelRequest, 'headers'>): string | null {
  const value = req.headers?.['x-vercel-id'];
  const id = Array.isArray(value) ? value[0] : value;
  return typeof id === 'string' ? id.slice(0, 200) : null;
}

export async function writeAdminAuditLog(
  req: Pick<VercelRequest, 'headers'>,
  input: {
    adminUserId?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    result: AuditResult;
  },
): Promise<void> {
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from('admin_audit_logs').insert({
      admin_user_id: input.adminUserId ?? null,
      action: input.action,
      resource: input.resource,
      resource_id: input.resourceId ?? null,
      result: input.result,
      request_id: getRequestId(req),
    });
    if (error) {
      console.error('Falha ao registrar auditoria administrativa:', error.message);
    }
  } catch (error) {
    console.error(
      'Serviço de auditoria administrativa indisponível:',
      error instanceof Error ? error.message : 'erro desconhecido',
    );
  }
}
