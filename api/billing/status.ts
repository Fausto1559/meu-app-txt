import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthenticatedUser } from '../_lib/userAuth.js';

function jsonError(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ ok: false, error });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return jsonError(res, 405, 'Method Not Allowed');
  }

  try {
    const context = await getAuthenticatedUser(req);
    if (!context) return jsonError(res, 401, 'Sessão inválida ou expirada.');

    const { supabase, user } = context;

    // The first authenticated request creates the authoritative trial window.
    const { error: createError } = await supabase
      .from('billing_accounts')
      .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });

    if (createError) {
      console.error('Falha ao inicializar conta de cobrança:', createError.message);
      return jsonError(res, 503, 'Não foi possível inicializar o período de avaliação.');
    }

    const { data: account, error: accountError } = await supabase
      .from('billing_accounts')
      .select('trial_started_at, trial_ends_at, access_status, current_plan_key, current_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      console.error('Falha ao consultar conta de cobrança:', accountError?.message);
      return jsonError(res, 503, 'Não foi possível consultar o status da assinatura.');
    }

    let accessStatus = account.access_status;
    const now = Date.now();
    const trialEndsAt = new Date(account.trial_ends_at).getTime();

    if (accessStatus === 'trial' && now >= trialEndsAt) {
      const { error: updateError } = await supabase
        .from('billing_accounts')
        .update({ access_status: 'expired', updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('access_status', 'trial');
      if (updateError) {
        console.error('Falha ao encerrar período gratuito:', updateError.message);
        return jsonError(res, 503, 'Não foi possível validar o encerramento da avaliação.');
      }
      accessStatus = 'expired';
    }

    let planName: string | null = null;
    if (account.current_plan_key) {
      planName = ({
        essencial: 'Essencial Básico',
        profissional: 'Copiloto Intermediário',
        pro: 'Copiloto PRO',
      } as Record<string, string>)[account.current_plan_key] || null;
    }

    return res.status(200).json({
      ok: true,
      account: {
        trialStartedAt: account.trial_started_at,
        trialEndsAt: account.trial_ends_at,
        accessStatus,
        planKey: account.current_plan_key,
        planName,
        currentSubscriptionId: account.current_subscription_id,
        remainingTrialDays: accessStatus === 'trial'
          ? Math.max(0, Math.ceil((trialEndsAt - now) / 86400000))
          : 0,
      },
    });
  } catch (error) {
    console.error('Erro ao consultar status de cobrança:', error instanceof Error ? error.message : 'erro desconhecido');
    return jsonError(res, 503, 'Serviço de cobrança temporariamente indisponível.');
  }
}
