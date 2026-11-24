import { getAdminSupabase } from './adminSupabase.js';

type AsaasEvent = {
  id: string;
  event: string;
  dateCreated?: string;
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
  if (event === 'PAYMENT_CHARGEBACK_REQUESTED' || event === 'PAYMENT_CHARGEBACK_DISPUTE' || event === 'PAYMENT_RECEIVED_IN_CASH_UNDONE') return 'chargeback';
  if (event === 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED' || event === 'PAYMENT_REPROVED_BY_RISK_ANALYSIS') return 'failed';
  return null;
}

function addOneCalendarMonth(value: Date): Date {
  const result = new Date(value);
  const originalDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(originalDay, lastDay));
  return result;
}

function subscriptionStatus(event: string, current: string): string | null {
  if (event === 'SUBSCRIPTION_INACTIVATED' || event === 'SUBSCRIPTION_DELETED') return 'canceled';
  if (event === 'SUBSCRIPTION_CREATED' || event === 'SUBSCRIPTION_UPDATED') {
    if (['canceled', 'suspended', 'expired'].includes(current)) return current;
    return current === 'active' ? 'active' : 'pending';
  }
  return null;
}

export async function processAsaasEvent(input: unknown): Promise<void> {
  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input) ||
    typeof (input as Record<string, unknown>).id !== 'string' ||
    typeof (input as Record<string, unknown>).event !== 'string'
  ) {
    throw new Error('Payload Asaas inválido para processamento.');
  }

  const event = input as AsaasEvent;
  if (!event.id.trim() || !event.event.trim()) {
    throw new Error('Identificador ou tipo do evento Asaas inválido.');
  }
  if (!event.dateCreated || !Number.isFinite(Date.parse(event.dateCreated))) {
    throw new Error('Data de criação do evento Asaas ausente ou inválida.');
  }
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
  const expectedAmount = allowedValues[localSubscription.plan_key];
  if (!expectedAmount || Math.abs(amount - expectedAmount) > 0.001) {
    throw new Error('Valor recebido não corresponde ao plano contratado.');
  }

  const mappedStatus = paymentStatus(eventName);
  if (!mappedStatus) return;

  const paymentDate = payment.clientPaymentDate || payment.paymentDate || payment.confirmedDate || null;
  if (paymentDate && !Number.isFinite(Date.parse(paymentDate))) {
    throw new Error('Data do pagamento inválida.');
  }

  const { data: previousPayment, error: previousPaymentError } = await supabase
    .from('payments')
    .select('status,metadata')
    .eq('provider', 'asaas')
    .eq('provider_payment_id', paymentId)
    .maybeSingle();
  if (previousPaymentError) throw new Error('Falha ao consultar estado anterior do pagamento: ' + previousPaymentError.message);

  const incomingEventTime = Date.parse(event.dateCreated);
  const previousEventTime = previousPayment?.metadata?.lastEventDate
    ? Date.parse(previousPayment.metadata.lastEventDate)
    : Number.NaN;
  if (Number.isFinite(incomingEventTime) && Number.isFinite(previousEventTime) &&
      incomingEventTime < previousEventTime) {
    return;
  }

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
    metadata: { lastEvent: eventName, lastEventDate: event.dateCreated || null, asaasEventId: event.id },
    updated_at: new Date().toISOString(),
  };

  const { error: paymentError } = await supabase
    .from('payments')
    .upsert(paymentRecord, { onConflict: 'provider,provider_payment_id' });
  if (paymentError) throw new Error('Falha ao persistir pagamento: ' + paymentError.message);

  if (mappedStatus === 'confirmed' || mappedStatus === 'received') {
    const periodStart = paymentDate && Number.isFinite(Date.parse(paymentDate))
      ? new Date(paymentDate)
      : new Date();
    const periodEnd = addOneCalendarMonth(periodStart);
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
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
