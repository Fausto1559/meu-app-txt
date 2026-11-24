import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthenticatedUser } from '../_lib/userAuth.js';
import { asaasRequest, getAsaasEnvironment, isValidCpfCnpj } from '../_lib/asaas.js';

const PLANS = {
  essencial: { name: 'Essencial Básico', value: 19.90 },
  profissional: { name: 'Copiloto Intermediário', value: 29.90 },
  pro: { name: 'Copiloto PRO', value: 39.90 },
} as const;

type PlanKey = keyof typeof PLANS;
type BillingType = 'PIX' | 'BOLETO';

function sendError(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ ok: false, error });
}

function parseBody(body: unknown): Record<string, any> | null {
  try {
    const value = typeof body === 'string' ? JSON.parse(body || '{}') : body;
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, any> : null;
  } catch {
    return null;
  }
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'Method Not Allowed');
  }

  try {
    const context = await getAuthenticatedUser(req);
    if (!context) return sendError(res, 401, 'Sessão inválida ou expirada.');

    const body = parseBody(req.body);
    if (!body) return sendError(res, 400, 'Dados de contratação inválidos.');

    const planKey = String(body.planKey || '') as PlanKey;
    const plan = PLANS[planKey];
    if (!plan) return sendError(res, 400, 'Plano selecionado inválido.');

    const billingType = String(body.billingType || '') as BillingType;
    if (billingType !== 'PIX' && billingType !== 'BOLETO') {
      return sendError(res, 400, 'Forma de pagamento inválida. Escolha Pix ou boleto.');
    }

    const customerName = String(body.customerName || '').trim().slice(0, 120);
    const cpfCnpj = String(body.cpfCnpj || '').replace(/\D/g, '');
    if (customerName.length < 3 || !isValidCpfCnpj(cpfCnpj)) {
      return sendError(res, 400, 'Informe nome e CPF/CNPJ válidos para o cadastro de cobrança.');
    }

    const { supabase, user } = context;
    const email = user.email;
    if (!email) return sendError(res, 400, 'A conta autenticada não possui e-mail confirmado.');

    const signupDate = typeof user.created_at === 'string' && Number.isFinite(Date.parse(user.created_at))
      ? new Date(user.created_at)
      : new Date();
    const trialStartedAt = signupDate.toISOString();
    const trialEndsAt = new Date(signupDate.getTime() + 30 * 86400000).toISOString();

    const { error: accountCreateError } = await supabase
      .from('billing_accounts')
      .upsert({
        user_id: user.id,
        trial_started_at: trialStartedAt,
        trial_ends_at: trialEndsAt,
      }, { onConflict: 'user_id', ignoreDuplicates: true });
    if (accountCreateError) {
      console.error('Falha ao inicializar conta de cobrança:', accountCreateError.message);
      return sendError(res, 503, 'Não foi possível inicializar a conta de cobrança.');
    }

    const { data: account, error: accountError } = await supabase
      .from('billing_accounts')
      .select('trial_ends_at, access_status, current_subscription_id')
      .eq('user_id', user.id)
      .single();
    if (accountError || !account) return sendError(res, 503, 'Não foi possível consultar o período de avaliação.');

    const { data: existingSubscription, error: existingSubscriptionError } = await supabase
      .from('subscriptions')
      .select('id, provider_subscription_id, status, plan_key')
      .eq('user_id', user.id)
      .in('status', ['pending', 'active', 'overdue'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSubscriptionError) {
      console.error('Falha ao verificar assinatura existente:', existingSubscriptionError.message);
      return sendError(res, 503, 'Não foi possível verificar uma assinatura anterior.');
    }

    if (existingSubscription) {
      return res.status(409).json({
        ok: false,
        error: 'Já existe uma assinatura em aberto para esta conta.',
        subscriptionId: existingSubscription.provider_subscription_id,
        status: existingSubscription.status,
      });
    }

    let customerId: string | null = null;
    const { data: storedCustomer, error: storedCustomerError } = await supabase
      .from('billing_customers')
      .select('provider_customer_id')
      .eq('user_id', user.id)
      .eq('provider', 'asaas')
      .maybeSingle();
    if (storedCustomerError) {
      console.error('Falha ao consultar cliente Asaas:', storedCustomerError.message);
      return sendError(res, 503, 'Não foi possível consultar o cadastro de cobrança.');
    }
    customerId = storedCustomer?.provider_customer_id ?? null;

    if (!customerId) {
      const createdCustomer = await asaasRequest<{ id?: string }>('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: customerName,
          cpfCnpj,
          email,
          externalReference: user.id,
          notificationDisabled: false,
        }),
      });
      if (!createdCustomer?.id) return sendError(res, 502, 'O Asaas não retornou o identificador do cliente.');

      customerId = createdCustomer.id;
      const { error: customerSaveError } = await supabase
        .from('billing_customers')
        .insert({
          user_id: user.id,
          provider: 'asaas',
          provider_customer_id: customerId,
          customer_name: customerName,
          customer_email: email,
          updated_at: new Date().toISOString(),
        });
      if (customerSaveError) {
        console.error('Falha ao salvar vínculo de cliente Asaas:', customerSaveError.message);
        return sendError(res, 503, 'Cliente foi criado no gateway, mas não foi possível salvar o vínculo local. Contate o suporte antes de tentar novamente.');
      }
    }

    const today = new Date();
    const trialEnd = new Date(account.trial_ends_at);
    const dueDate = trialEnd.getTime() > today.getTime()
      ? trialEnd
      : new Date(today.getTime() + 86400000);

    const externalReference = `copiloto:${user.id}:${planKey}`;
    // Reserve the user's single open subscription slot before creating anything
    // at Asaas. The partial unique index makes concurrent requests mutually exclusive.
    const { data: reservation, error: reservationError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        provider: 'asaas',
        provider_customer_id: customerId,
        plan_key: planKey,
        status: 'pending',
        billing_type: billingType,
        value: plan.value,
        next_due_date: dateOnly(dueDate),
        metadata: { externalReference, checkoutReservation: true },
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (reservationError || !reservation) {
      if (reservationError?.code === '23505') {
        return sendError(res, 409, 'Já existe uma contratação em andamento para esta conta.');
      }
      console.error('Falha ao reservar contratação:', reservationError?.message);
      return sendError(res, 503, 'Não foi possível reservar a contratação.');
    }

    let createdSubscription: {
      id?: string;
      status?: string;
      nextDueDate?: string;
      value?: number;
      billingType?: string;
    };
    try {
      createdSubscription = await asaasRequest('/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          customer: customerId,
          billingType,
          value: plan.value,
          nextDueDate: dateOnly(dueDate),
          cycle: 'MONTHLY',
          description: `Copiloto Financeiro - Plano ${plan.name}`,
          externalReference,
        }),
      });
    } catch (gatewayError) {
      const { error: cleanupError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', reservation.id)
        .eq('user_id', user.id);
      if (cleanupError) {
        console.error('Falha ao liberar reserva após erro do Asaas:', cleanupError.message);
      }
      throw gatewayError;
    }

    if (!createdSubscription?.id) {
      const { error: cleanupError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', reservation.id)
        .eq('user_id', user.id);
      if (cleanupError) console.error('Falha ao liberar reserva sem ID do Asaas:', cleanupError.message);
      return sendError(res, 502, 'O Asaas não retornou o identificador da assinatura.');
    }

    const { data: localSubscription, error: subscriptionSaveError } = await supabase
      .from('subscriptions')
      .update({
        provider_subscription_id: createdSubscription.id,
        provider_customer_id: customerId,
        next_due_date: createdSubscription.nextDueDate || dateOnly(dueDate),
        metadata: { externalReference, checkoutReservation: false },
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservation.id)
      .eq('user_id', user.id)
      .select('id')
      .single();

    if (subscriptionSaveError || !localSubscription) {
      console.error('Falha ao vincular assinatura Asaas à reserva:', subscriptionSaveError?.message);
      try {
        await asaasRequest(`/subscriptions/${encodeURIComponent(createdSubscription.id)}`, { method: 'DELETE' });
        await supabase.from('subscriptions').delete().eq('id', reservation.id).eq('user_id', user.id);
      } catch (cancelError) {
        console.error('Falha ao cancelar assinatura sem vínculo local:', cancelError instanceof Error ? cancelError.message : 'erro desconhecido');
      }
      return sendError(res, 503, 'A assinatura foi criada no gateway, mas não foi possível concluir o vínculo local. O sistema tentou cancelar a assinatura para evitar cobrança sem vínculo.');
    }

    const { error: accountUpdateError } = await supabase
      .from('billing_accounts')
      .update({
        current_subscription_id: localSubscription.id,
        current_plan_key: planKey,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (accountUpdateError) {
      console.error('Falha ao vincular assinatura à conta:', accountUpdateError.message);
      return sendError(res, 503, 'Assinatura salva, mas falta concluir o vínculo da conta. Contate o suporte.');
    }

    const asaasEnvironment = getAsaasEnvironment();
    return res.status(201).json({
      ok: true,
      subscriptionId: createdSubscription.id,
      planKey,
      planName: plan.name,
      monthlyValue: plan.value,
      billingType,
      nextDueDate: createdSubscription.nextDueDate || dateOnly(dueDate),
      accessStatus: account.access_status,
      message: `Assinatura criada no Asaas ${asaasEnvironment === 'sandbox' ? 'Sandbox' : 'de Produção'}. O plano só será ativado após confirmação de pagamento pelo webhook.`,
    });
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status?: number }).status) || 502
      : 502;
    console.error('Erro ao criar assinatura:', error instanceof Error ? error.message : 'erro desconhecido');
    return sendError(res, status >= 400 && status < 600 ? status : 502, error instanceof Error ? error.message : 'Não foi possível criar a assinatura.');
  }
}
