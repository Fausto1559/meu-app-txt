import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/adminAuth.js';
import { getAdminSupabase } from '../_lib/adminSupabase.js';
import { asaasRequest } from '../_lib/asaas.js';

type AsaasList<T> = { data?: T[]; totalCount?: number };
type AsaasCustomer = { id?: string; externalReference?: string; name?: string; email?: string };
type AsaasSubscription = {
  id?: string;
  customer?: string;
  externalReference?: string;
  status?: string;
  nextDueDate?: string;
  value?: number;
  billingType?: string;
};

const PLAN_VALUES: Record<string, number> = {
  essencial: 19.90,
  profissional: 29.90,
  pro: 39.90,
};

function jsonError(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ ok: false, error });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return jsonError(res, 405, 'Method Not Allowed');
  }

  const authorization = await requireAdmin(req, ['owner']);
  if ('status' in authorization) {
    return jsonError(res, authorization.status, authorization.error);
  }

  const supabase = getAdminSupabase();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id,user_id,provider_customer_id,provider_subscription_id,plan_key,status,value,billing_type,created_at,metadata')
      .eq('provider', 'asaas')
      .eq('status', 'pending')
      .eq('metadata->>checkoutReservation', 'true')
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Falha ao consultar reservas de checkout:', error.message);
      return jsonError(res, 503, 'Não foi possível consultar as reservas pendentes.');
    }

    return res.status(200).json({
      ok: true,
      reservations: (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        planKey: item.plan_key,
        value: item.value,
        billingType: item.billing_type,
        providerCustomerLinked: Boolean(item.provider_customer_id),
        providerSubscriptionLinked: Boolean(item.provider_subscription_id),
        result: item.metadata?.checkoutResult || 'awaiting_reconciliation',
        attemptAt: item.metadata?.checkoutAttemptAt || null,
        createdAt: item.created_at,
      })),
    });
  }

  let body: any;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  } catch {
    return jsonError(res, 400, 'JSON inválido.');
  }

  const reservationId = typeof body?.reservationId === 'string' ? body.reservationId.trim() : '';
  if (!reservationId || reservationId.length > 100) {
    return jsonError(res, 400, 'Informe um ID de reserva válido.');
  }

  const { data: reservation, error: reservationError } = await supabase
    .from('subscriptions')
    .select('id,user_id,provider_customer_id,provider_subscription_id,plan_key,status,value,billing_type,metadata')
    .eq('id', reservationId)
    .eq('provider', 'asaas')
    .eq('status', 'pending')
    .eq('metadata->>checkoutReservation', 'true')
    .maybeSingle();

  if (reservationError) {
    console.error('Falha ao consultar reserva para conciliação:', reservationError.message);
    return jsonError(res, 503, 'Não foi possível consultar a reserva.');
  }
  if (!reservation) return jsonError(res, 404, 'Reserva pendente não encontrada ou já conciliada.');

  const expectedValue = PLAN_VALUES[reservation.plan_key];
  if (!expectedValue || Math.abs(Number(reservation.value) - expectedValue) > 0.001) {
    return jsonError(res, 409, 'Plano ou valor da reserva não corresponde à tabela oficial. Nenhuma alteração foi feita.');
  }

  const externalReference = `copiloto:${reservation.user_id}:${reservation.plan_key}`;
  const customerReference = encodeURIComponent(reservation.user_id);
  const subscriptionReference = encodeURIComponent(externalReference);

  try {
    const customerResult = await asaasRequest<AsaasList<AsaasCustomer>>(
      `/customers?externalReference=${customerReference}&limit=100&offset=0`,
    );
    const customers = (customerResult?.data || []).filter(
      (item) => item.id && item.externalReference === reservation.user_id,
    );

    if (customers.length !== 1) {
      return res.status(200).json({
        ok: true,
        reconciled: false,
        reason: customers.length === 0 ? 'customer_not_found' : 'multiple_customers_found',
        matches: customers.length,
        message: customers.length === 0
          ? 'Nenhum cliente com a referência exata foi encontrado. A reserva foi preservada; não será criado outro cliente automaticamente.'
          : 'Mais de um cliente corresponde à referência. A reserva foi preservada para análise manual.',
      });
    }

    const customerId = customers[0].id as string;
    if (reservation.provider_customer_id && reservation.provider_customer_id !== customerId) {
      return jsonError(res, 409, 'O cliente encontrado diverge do vínculo já salvo. Nenhuma alteração foi feita.');
    }

    const subscriptionResult = await asaasRequest<AsaasList<AsaasSubscription>>(
      `/subscriptions?externalReference=${subscriptionReference}&limit=100&offset=0&includeDeleted=true`,
    );
    const subscriptions = (subscriptionResult?.data || []).filter(
      (item) => item.id && item.externalReference === externalReference,
    );

    if (subscriptions.length > 1) {
      return res.status(200).json({
        ok: true,
        reconciled: false,
        reason: 'multiple_subscriptions_found',
        matches: subscriptions.length,
        message: 'Mais de uma assinatura corresponde à referência. Nenhuma assinatura foi vinculada automaticamente.',
      });
    }

    if (!customers[0].name || !customers[0].email) {
      return jsonError(res, 409, 'O Asaas não retornou nome e e-mail do cliente. Nenhuma alteração foi feita.');
    }

    const saveCustomerLink = async () => supabase
      .from('billing_customers')
      .upsert({
        user_id: reservation.user_id,
        provider: 'asaas',
        provider_customer_id: customerId,
        customer_name: customers[0].name,
        customer_email: customers[0].email,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (subscriptions.length === 0) {
      const { error: customerSaveError } = await saveCustomerLink();
      if (customerSaveError) {
        console.error('Falha ao salvar cliente conciliado:', customerSaveError.message);
        return jsonError(res, 503, 'Cliente encontrado no Asaas, mas não foi possível salvar o vínculo local.');
      }
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          provider_customer_id: customerId,
          metadata: { ...reservation.metadata, checkoutResult: 'customer_reconciled_subscription_not_found', reconciledAt: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservation.id)
        .eq('status', 'pending');

      if (updateError) {
        console.error('Falha ao atualizar reserva conciliada:', updateError.message);
        return jsonError(res, 503, 'Cliente conciliado, mas não foi possível atualizar a reserva.');
      }

      return res.status(200).json({
        ok: true,
        reconciled: true,
        customerLinked: true,
        subscriptionLinked: false,
        message: 'Cliente Asaas vinculado. Nenhuma assinatura foi encontrada; a reserva continua bloqueando nova contratação para evitar cobrança duplicada.',
      });
    }

    const remoteSubscription = subscriptions[0];
    if (remoteSubscription.customer !== customerId) {
      return jsonError(res, 409, 'A assinatura encontrada pertence a outro cliente Asaas. Nenhuma alteração foi feita.');
    }
    if (typeof remoteSubscription.value !== 'number' || Math.abs(remoteSubscription.value - expectedValue) > 0.001) {
      return jsonError(res, 409, 'O valor da assinatura encontrada diverge do plano reservado. Nenhuma alteração foi feita.');
    }

    const remoteStatus = remoteSubscription.status === 'ACTIVE'
      ? 'pending'
      : remoteSubscription.status === 'EXPIRED'
        ? 'expired'
        : remoteSubscription.status === 'INACTIVE'
          ? 'canceled'
          : null;
    if (!remoteStatus) {
      return jsonError(res, 409, 'Status remoto não reconhecido. A reserva foi preservada sem vincular a assinatura.');
    }

    // An ACTIVE Asaas subscription is not proof of a paid invoice.
    // Entitlement is activated only by apply_asaas_payment_event after
    // PAYMENT_CONFIRMED or PAYMENT_RECEIVED.
    const { error: customerSaveError } = await saveCustomerLink();
    if (customerSaveError) {
      console.error('Falha ao salvar cliente conciliado:', customerSaveError.message);
      return jsonError(res, 503, 'Cliente encontrado no Asaas, mas não foi possível salvar o vínculo local.');
    }

    const { data: linked, error: linkError } = await supabase
      .from('subscriptions')
      .update({
        provider_customer_id: customerId,
        provider_subscription_id: remoteSubscription.id,
        status: remoteStatus,
        next_due_date: remoteSubscription.nextDueDate || null,
        metadata: { ...reservation.metadata, checkoutReservation: false, checkoutResult: 'reconciled', reconciledAt: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservation.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (linkError || !linked) {
      console.error('Falha ao vincular assinatura conciliada:', linkError?.message);
      return jsonError(res, 503, 'Assinatura encontrada, mas não foi possível concluir o vínculo local.');
    }

    const { data: account, error: accountError } = await supabase
      .from('billing_accounts')
      .update({
        current_subscription_id: reservation.id,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', reservation.user_id)
      .select('user_id')
      .maybeSingle();

    if (accountError || !account) {
      console.error('Falha ao atualizar conta após conciliação:', accountError?.message);
      return jsonError(res, 503, 'Assinatura conciliada, mas falta atualizar o vínculo da conta.');
    }

    return res.status(200).json({
      ok: true,
      reconciled: true,
      customerLinked: true,
      subscriptionLinked: true,
      subscriptionStatus: remoteStatus,
      accessActivated: false,
      message: 'Cliente e assinatura foram vinculados. O acesso pago continuará bloqueado até a confirmação do pagamento pelo webhook.',
    });
  } catch (error) {
    console.error('Falha na conciliação Asaas:', error instanceof Error ? error.message : 'erro desconhecido');
    return jsonError(res, 502, 'Não foi possível consultar o Asaas. A reserva foi preservada sem alterações destrutivas.');
  }
}
