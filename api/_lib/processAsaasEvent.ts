import { getAdminSupabase } from './adminSupabase.js';

type AsaasEvent = {
  id: string;
  event: string;
  payment?: Record<string, any>;
  subscription?: Record<string, any>;
};

function paymentStatus(event: string): string | null {
  if (event === 'PAYMENT_CREATED') return 'pending';
  if (event === 'PAYMENT_CONFIRMED') return 'confirmed';
  if (event === 'PAYMENT_RECEIVED') return 'received';
  if (event === 'PAYMENT_OVERDUE') return 'overdue';
  if (event === 'PAYMENT_DELETED') return 'canceled';
  if (event === 'PAYMENT_REFUNDED') return 'refunded';
  if (event === 'PAYMENT_PARTIALLY_REFUNDED') return 'partially_refunded';
  if (event === 'PAYMENT_CHARGEBACK_REQUESTED' || event === 'PAYMENT_CHARGEBACK_DISPUTE') return 'chargeback';
  if (event === 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED' || event === 'PAYMENT_REPROVED_BY_RISK_ANALYSIS') return 'failed';
  return null;
}

function subscriptionStatus(event: string, current: string): string | null {
  if (event === 'SUBSCRIPTION_INACTIVATED' || event === 'SUBSCRIPTION_DELETED') return 'canceled';
  if (event === 'SUBSCRIPTION_CREATED' || event === 'SUBSCRIPTION_UPDATED') return current === 'active' ? 'active' : 'pending';
  return null;
}

export async function processAsaasEvent(event: AsaasEvent): Promise<void> {
  const supabase = getAdminSupabase();
  const eventName = event.event;
  const payment = event.payment;
  const subscription = event.subscription;
  const paymentId = typeof payment?.id === 'string' ? payment.id : null;
  const subscriptionId =
    typeof subscription?.id === 'string'
      ? subscription.id
      : typeof payment?.subscription === 'string'
        ? payment.subscription
        : null;

  if (eventName.startsWith('SUBSCRIPTION_')) {
    if (!subscriptionId) throw new Error('Evento de assinatura sem identificador.');
    const { data: local, error: lookupError } = await supabase
      .from('subscriptions')
      .select('id,user_id,status,provider_customer_id')
      .eq('provider', 'asaas')
      .eq('provider_subscription_id', subscriptionId)
      .maybeSingle();
    if (lookupError) throw new Error('Falha ao localizar assinatura: ' + lookupError.message);
    if (!local) throw new Error('Assinatura ainda não vinculada no sistema.');

    if (subscription?.customer && local.provider_customer_id &&
        subscription.customer !== local.provider_customer_id) {
      throw new Error('Cliente do evento não corresponde à assinatura cadastrada.');
    }

    const nextStatus = subscriptionStatus(eventName, local.status);
    if (nextStatus) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: nextStatus,
          next_due_date: subscription?.nextDueDate || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', local.id);
      if (updateError) throw new Error('Falha ao atualizar assinatura: ' + updateError.message);

      if (nextStatus === 'canceled') {
        const { error: accountError } = await supabase
          .from('billing_accounts')
          .update({ access_status: 'suspended', updated_at: new Date().toISOString() })
          .eq('user_id', local.user_id)
          .eq('current_subscription_id', local.id);
        if (accountError) throw new Error('Falha ao suspender acesso: ' + accountError.message);
      }
    }
    return;
  }

  if (!paymentId || !payment) throw new Error('Evento de pagamento sem identificador.');
  const { data: localSubscription, error: subscriptionLookupError } = subscriptionId
    ? await supabase
        .from('subscriptions')
        .select('id,user_id,plan_key,provider_customer_id')
        .eq('provider', 'asaas')
        .eq('provider_subscription_id', subscriptionId)
        .maybeSingle()
    : { data: null, error: null };

  if (subscriptionLookupError) throw new Error('Falha ao localizar assinatura do pagamento: ' + subscriptionLookupError.message);
  if (!localSubscription) throw new Error('Pagamento não está vinculado a uma assinatura local.');

  if (payment.customer && localSubscription.provider_customer_id &&
      payment.customer !== localSubscription.provider_customer_id) {
    throw new Error('Cliente do pagamento não corresponde à assinatura cadastrada.');
  }

  const amount = Number(payment.value);
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Valor do pagamento inválido.');
  const allowedValues: Record<string, number> = { essencial: 19.90, profissional: 29.90, pro: 39.90 };
  if (Math.abs(amount - allowedValues[localSubscription.plan_key]) > 0.001) {
    throw new Error('Valor recebido não corresponde ao plano contratado.');
  }

  const mappedStatus = paymentStatus(eventName);
  if (!mappedStatus) return;

  const paymentDate = payment.clientPaymentDate || payment.paymentDate || payment.confirmedDate || null;
  const paymentRecord = {
    user_id: localSubscription.user_id,
    subscription_id: localSubscription.id,
    provider: 'asaas',
    provider_payment_id: paymentId,
    provider_subscription_id: subscriptionId,
    provider_customer_id: payment.customer || localSubscription.provider_customer_id,
    external_reference: payment.externalReference || null,
    status: mappedStatus,
    billing_type: payment.billingType || null,
    value: amount,
    net_value: Number.isFinite(Number(payment.netValue)) ? Number(payment.netValue) : null,
    due_date: payment.dueDate || null,
    payment_date: paymentDate ? new Date(paymentDate).toISOString() : null,
    invoice_url: payment.invoiceUrl || null,
    metadata: { lastEvent: eventName, asaasEventId: event.id },
    updated_at: new Date().toISOString(),
  };

  const { error: paymentError } = await supabase
    .from('payments')
    .upsert(paymentRecord, { onConflict: 'provider,provider_payment_id' });
  if (paymentError) throw new Error('Falha ao persistir pagamento: ' + paymentError.message);

  if (mappedStatus === 'confirmed' || mappedStatus === 'received') {
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', localSubscription.id);
    if (subError) throw new Error('Falha ao ativar assinatura: ' + subError.message);

    const { error: accountError } = await supabase
      .from('billing_accounts')
      .update({
        access_status: 'active',
        current_plan_key: localSubscription.plan_key,
        current_subscription_id: localSubscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', localSubscription.user_id);
    if (accountError) throw new Error('Falha ao liberar acesso após pagamento: ' + accountError.message);
  } else if (mappedStatus === 'overdue') {
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({ status: 'overdue', updated_at: new Date().toISOString() })
      .eq('id', localSubscription.id);
    if (subError) throw new Error('Falha ao marcar assinatura vencida: ' + subError.message);

    const { error: accountError } = await supabase
      .from('billing_accounts')
      .update({ access_status: 'past_due', updated_at: new Date().toISOString() })
      .eq('user_id', localSubscription.user_id);
    if (accountError) throw new Error('Falha ao marcar conta em atraso: ' + accountError.message);
  } else if (['refunded', 'partially_refunded', 'chargeback', 'failed', 'canceled'].includes(mappedStatus)) {
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({ status: mappedStatus === 'canceled' ? 'canceled' : 'suspended', updated_at: new Date().toISOString() })
      .eq('id', localSubscription.id);
    if (subError) throw new Error('Falha ao suspender assinatura: ' + subError.message);

    const { error: accountError } = await supabase
      .from('billing_accounts')
      .update({ access_status: 'suspended', updated_at: new Date().toISOString() })
      .eq('user_id', localSubscription.user_id)
      .eq('current_subscription_id', localSubscription.id);
    if (accountError) throw new Error('Falha ao suspender acesso: ' + accountError.message);
  }
}
