import { getAdminSupabase } from './_lib/adminSupabase.js';
import { processAsaasEvent } from './_lib/processAsaasEvent.js';
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
  if (!webhookToken || webhookToken.length < 32 ||
      !process.env.SUPABASE_URL || !(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    return res.status(503).json({
      ok: false,
      error: 'Webhook Asaas ainda não configurado no servidor.',
    });
  }

  if (!safeTokenEquals(req.headers?.['asaas-access-token'], webhookToken)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch {
    return res.status(503).json({ ok: false, error: 'Configuração do banco do webhook indisponível.' });
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
      : isObject(body.payment) && typeof body.payment.subscription === 'string'
        ? body.payment.subscription.trim()
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
      const { data: existing, error: existingError } = await supabase
        .from('webhook_events')
        .select('payload,processing_status')
        .eq('provider', 'asaas')
        .eq('provider_event_id', eventId)
        .maybeSingle();

      if (existingError || !existing) {
        return res.status(500).json({ ok: false, error: 'Não foi possível consultar o evento duplicado.' });
      }
      if (existing.processing_status === 'processed') {
        return res.status(200).json({ ok: true, duplicate: true, processed: true, id: eventId });
      }

      try {
        await processAsaasEvent(existing.payload);
        const { error: retryMarkError } = await supabase
          .from('webhook_events')
          .update({ processing_status: 'processed', processed_at: new Date().toISOString(), last_error: null })
          .eq('provider', 'asaas')
          .eq('provider_event_id', eventId);
        if (retryMarkError) throw new Error(retryMarkError.message);
        return res.status(200).json({ ok: true, duplicate: true, processed: true, retried: true, id: eventId });
      } catch (retryError) {
        const message = retryError instanceof Error ? retryError.message : 'Falha desconhecida';
        await supabase
          .from('webhook_events')
          .update({ processing_status: 'failed', attempts: 2, last_error: message.slice(0, 2000) })
          .eq('provider', 'asaas')
          .eq('provider_event_id', eventId);
        return res.status(500).json({ ok: false, duplicate: true, processed: false, retryable: true, id: eventId });
      }
    }
    if (error) {
      console.error('Falha ao persistir evento Asaas:', error.message);
      return res.status(500).json({ ok: false, error: 'Falha ao persistir evento.' });
    }

    try {
      await processAsaasEvent(body);
      const { error: markProcessedError } = await supabase
        .from('webhook_events')
        .update({
          processing_status: 'processed',
          processed_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('provider', 'asaas')
        .eq('provider_event_id', eventId);

      if (markProcessedError) {
        throw new Error('Evento aplicado, mas não foi possível registrar a conclusão: ' + markProcessedError.message);
      }

      return res.status(200).json({
        ok: true,
        received: true,
        persisted: true,
        processed: true,
        id: eventId,
      });
    } catch (processingError) {
      const message = processingError instanceof Error ? processingError.message : 'Falha desconhecida no processamento.';
      await supabase
        .from('webhook_events')
        .update({
          processing_status: 'failed',
          attempts: 2,
          last_error: message.slice(0, 2000),
        })
        .eq('provider', 'asaas')
        .eq('provider_event_id', eventId);

      console.error('Falha ao processar evento Asaas:', message);
      return res.status(500).json({
        ok: false,
        received: true,
        persisted: true,
        processed: false,
        retryable: true,
        id: eventId,
      });
    }
  } catch (error: any) {
    console.error('Erro no recebimento do webhook Asaas:', error?.message || error);
    return res.status(400).json({ ok: false, error: 'Requisição inválida.' });
  }
}
