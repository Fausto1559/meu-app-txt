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

async function claimEvent(
  supabase: ReturnType<typeof getAdminSupabase>,
  eventId: string,
  allowedStatuses: string[],
  attempts: number,
  expectedProcessingStartedAt?: string | null,
) {
  let query = supabase
    .from('webhook_events')
    .update({
      processing_status: 'processing',
      processing_started_at: new Date().toISOString(),
      attempts,
      last_error: null,
    })
    .eq('provider', 'asaas')
    .eq('provider_event_id', eventId)
    .in('processing_status', allowedStatuses);

  if (expectedProcessingStartedAt === null) {
    query = query.is('processing_started_at', null);
  } else if (typeof expectedProcessingStartedAt === 'string') {
    query = query.eq('processing_started_at', expectedProcessingStartedAt);
  }

  const { data, error } = await query.select('id').maybeSingle();
  if (error) throw new Error('Não foi possível reservar o evento para processamento: ' + error.message);
  return Boolean(data?.id);
}
async function processClaimedEvent(
  supabase: ReturnType<typeof getAdminSupabase>,
  eventId: string,
  payload: Record<string, any>,
  attempts: number,
  duplicate: boolean,
  res: any,
) {
  try {
    await processAsaasEvent(payload);
    const { error } = await supabase
      .from('webhook_events')
      .update({
        processing_status: 'processed',
        processing_started_at: null,
        processed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('provider', 'asaas')
      .eq('provider_event_id', eventId)
      .eq('processing_status', 'processing');

    if (error) throw new Error('Evento aplicado, mas não foi possível registrar a conclusão: ' + error.message);

    return res.status(200).json({
      ok: true,
      received: !duplicate,
      duplicate,
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
        processing_started_at: null,
        attempts,
        last_error: message.slice(0, 2000),
      })
      .eq('provider', 'asaas')
      .eq('provider_event_id', eventId)
      .eq('processing_status', 'processing');

    console.error('Falha ao processar evento Asaas:', message);
    return res.status(500).json({
      ok: false,
      received: !duplicate,
      duplicate,
      persisted: true,
      processed: false,
      retryable: true,
      id: eventId,
    });
  }
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
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
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

    const { error: insertError } = await supabase.from('webhook_events').insert({
      provider: 'asaas',
      provider_event_id: eventId,
      event_type: eventType,
      provider_payment_id: paymentId,
      provider_subscription_id: subscriptionId,
      payload: body,
      processing_status: 'received',
      attempts: 1,
    });

    let duplicate = false;
    let attempts = 1;
    if (insertError?.code === '23505') {
      duplicate = true;
      const { data: existing, error: existingError } = await supabase
        .from('webhook_events')
        .select('payload,processing_status,attempts,processing_started_at,received_at')
        .eq('provider', 'asaas')
        .eq('provider_event_id', eventId)
        .maybeSingle();

      if (existingError || !existing) {
        return res.status(500).json({ ok: false, error: 'Não foi possível consultar o evento duplicado.' });
      }
      if (existing.processing_status === 'processed') {
        return res.status(200).json({ ok: true, duplicate: true, processed: true, id: eventId });
      }
      let expectedProcessingStartedAt: string | null | undefined;
      if (existing.processing_status === 'processing') {
        expectedProcessingStartedAt = existing.processing_started_at || null;
        const leaseOrigin = existing.processing_started_at || existing.received_at;
        const leaseAge = Date.now() - Date.parse(leaseOrigin);
        if (!Number.isFinite(leaseAge) || leaseAge < 5 * 60 * 1000) {
          return res.status(202).json({ ok: true, duplicate: true, processing: true, id: eventId });
        }
      } else if (!['received', 'failed'].includes(existing.processing_status)) {
        return res.status(409).json({ ok: false, duplicate: true, error: 'Estado do evento não permite reprocessamento automático.' });
      }

      attempts = Number(existing.attempts || 0) + 1;
      const claimed = await claimEvent(
        supabase,
        eventId,
        [existing.processing_status],
        attempts,
        expectedProcessingStartedAt,
      );
      if (!claimed) {
        return res.status(202).json({ ok: true, duplicate: true, processing: true, id: eventId });
      }
      return processClaimedEvent(supabase, eventId, existing.payload, attempts, true, res);
    }

    if (insertError) {
      console.error('Falha ao persistir evento Asaas:', insertError.message);
      return res.status(500).json({ ok: false, error: 'Falha ao persistir evento.' });
    }

    const claimed = await claimEvent(supabase, eventId, ['received'], attempts);
    if (!claimed) {
      return res.status(409).json({ ok: false, persisted: true, error: 'Evento persistido, mas não foi possível reservar o processamento.' });
    }

    return processClaimedEvent(supabase, eventId, body, attempts, false, res);
  } catch (error: any) {
    console.error('Erro no recebimento do webhook Asaas:', error?.message || error);
    return res.status(400).json({ ok: false, error: 'Requisição inválida.' });
  }
}
