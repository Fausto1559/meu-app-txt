import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/adminAuth.js';
import { getAdminSupabase } from '../_lib/adminSupabase.js';
import { asaasRequest, getAsaasEnvironment } from '../_lib/asaas.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const authorization = await requireAdmin(req, ['owner']);
  if ('status' in authorization) {
    return res.status(authorization.status).json({ ok: false, error: authorization.error });
  }

  const checks: Record<string, { ok: boolean; detail: string }> = {};
  const configuredAsaasEnvironment = process.env.ASAAS_ENVIRONMENT || 'not-set';
  const vercelEnvironment = process.env.VERCEL_ENV || 'unknown';

  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    checks.supabase = error
      ? { ok: false, detail: 'A credencial privilegiada não foi aceita pelo projeto configurado.' }
      : { ok: true, detail: 'Credencial privilegiada aceita pelo projeto configurado no servidor.' };
  } catch {
    checks.supabase = { ok: false, detail: 'Configuração privilegiada do Supabase inválida ou indisponível.' };
  }

  try {
    const asaasEnvironment = getAsaasEnvironment();
    const account = await asaasRequest<{ id?: string; general?: string }>('/myAccount/status/');
    checks.asaas = {
      ok: Boolean(account && account.id),
      detail: account?.id
        ? `Chave aceita pela API ${asaasEnvironment === 'sandbox' ? 'Sandbox' : 'de Produção'} do Asaas.`
        : 'API respondeu, mas não retornou identificador de conta.',
    };
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status?: number }).status)
      : 0;
    checks.asaas = {
      ok: false,
      detail: status === 401
        ? 'Chave recusada pelo ambiente Asaas configurado. Verifique se a credencial corresponde ao ambiente selecionado.'
        : 'Não foi possível validar a credencial do Asaas ou o ambiente não foi configurado corretamente.',
    };
  }

  return res.status(200).json({
    ok: Object.values(checks).every((check) => check.ok),
    environment: `${vercelEnvironment}-asaas-${configuredAsaasEnvironment}`,
    checks,
  });
}
