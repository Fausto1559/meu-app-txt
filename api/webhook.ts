import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

function safeTokenEquals(received: unknown, expected: string): boolean {
  if (typeof received !== 'string') return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer);
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookToken || webhookToken.length < 32 || !supabaseUrl || !serviceRoleKey) {
    return res.status(503).json({
      ok: false,
      error: 'Webhook Asaas ainda não configurado no servidor.',
    });
  }

  if (!safeTokenEquals(req.headers?.['asaas-access-token'], webhookToken)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : req.body;

    if (!isObject(body)) {
      return res.status(400).json({ ok: false, error: 'Payload Asaas inválido.' });
    }

    const eventId = typeof body.id === 'string' ? body.id.trim() : '';
    const eventType = typeof body.event === 'string' ? body.event.trim() : '';
    const paymentId = isObject(body.payment) && typeof body.payment.id === 'string'
      ? body.payment.id.trim()
      : null;
    const subscriptionId = isObject(body.subscription) && typeof body.subscription.id === 'string'
      ? body.subscription.id.trim()
      : null;

    if (!eventId || !eventType || (!paymentId && !subscriptionId)) {
      return res.status(400).json({ ok: false, error: 'Payload Asaas inválido.' });
    }

    if (eventId.length > 200 || eventType.length > 120 ||
        (paymentId && paymentId.length > 200) ||
        (subscriptionId && subscriptionId.length > 200)) {
      return res.status(400).json({ ok: false, error: 'Identificadores Asaas inválidos.' });
    }

    const isPaymentEvent = eventType.startsWith('PAYMENT_');
    const isSubscriptionEvent = eventType.startsWith('SUBSCRIPTION_');
    if ((isPaymentEvent && !paymentId) ||
        (isSubscriptionEvent && !subscriptionId) ||
        (!isPaymentEvent && !isSubscriptionEvent)) {
      return res.status(400).json({ ok: false, error: 'Tipo de evento não compatível com o recurso recebido.' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabase.from('webhook_events').insert({
      provider: 'asaas',
      provider_event_id: eventId,
      event_type: eventType,
      provider_payment_id: paymentId,
      provider_subscription_id: subscriptionId,
      payload: body,
      processing_status: 'received',
      attempts: 1,
    });

    if (error?.code === '23505') {
      return res.status(200).json({ ok: true, duplicate: true, id: eventId });
    }
    if (error) {
      console.error('Falha ao persistir evento Asaas:', error.message);
      return res.status(500).json({ ok: false, error: 'Falha ao persistir evento.' });
    }

    // O evento foi persistido, mas a ativação/alteração da assinatura depende
    // do processador financeiro server-side, que ainda não está habilitado.
    return res.status(200).json({
      ok: true,
      received: true,
      persisted: true,
      processed: false,
      id: eventId,
    });
  } catch (error: any) {
    console.error('Erro no recebimento do webhook Asaas:', error?.message || error);
    return res.status(400).json({ ok: false, error: 'Requisição inválida.' });
  }
}
