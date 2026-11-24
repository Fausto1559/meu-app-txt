import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/adminAuth.js';
import { getAdminSupabase } from '../_lib/adminSupabase.js';
import { asaasRequest } from '../_lib/asaas.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const authorization = await requireAdmin(req, ['owner']);
  if (!authorization.ok) {
    return res.status(authorization.status).json({ ok: false, error: authorization.error });
  }

  const checks: Record<string, { ok: boolean; detail: string }> = {};

  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    checks.supabase = error
      ? { ok: false, detail: 'A credencial privilegiada não foi aceita pelo projeto configurado.' }
      : { ok: true, detail: 'Credencial privilegiada aceita pelo projeto de homologação.' };
  } catch {
    checks.supabase = { ok: false, detail: 'Configuração privilegiada do Supabase inválida ou indisponível.' };
  }

  try {
    const account = await asaasRequest<{ id?: string; general?: string }>('/myAccount/status/');
    checks.asaasSandbox = {
      ok: Boolean(account && account.id),
      detail: account?.id
        ? 'Chave aceita pela API Sandbox do Asaas.'
        : 'API respondeu, mas não retornou identificador de conta.',
    };
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status?: number }).status)
      : 0;
    checks.asaasSandbox = {
      ok: false,
      detail: status === 401
        ? 'Chave recusada pelo Sandbox. Verifique se a credencial é de homologação.'
        : 'Não foi possível validar a credencial Sandbox do Asaas.',
    };
  }

  return res.status(200).json({
    ok: Object.values(checks).every((check) => check.ok),
    environment: 'preview-sandbox',
    checks,
  });
}
