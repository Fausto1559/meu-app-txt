import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

function safeTokenEquals(received: unknown, expected: string): boolean {
  if (typeof received !== 'string') return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

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
      : req.body || {};
    const eventId = typeof body.id === 'string' ? body.id.trim() : '';
    const eventType = typeof body.event === 'string' ? body.event.trim() : '';
    const paymentId = typeof body.payment?.id === 'string' ? body.payment.id.trim() : '';

    if (!eventId || !eventType || !paymentId) {
      return res.status(400).json({ ok: false, error: 'Payload Asaas inválido.' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabase.from('webhook_events').insert({
      provider: 'asaas',
      provider_event_id: eventId,
      event_type: eventType,
      provider_payment_id: paymentId,
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

    return res.status(200).json({ ok: true, received: true, persisted: true, id: eventId });
  } catch (error: any) {
    console.error('Erro no recebimento do webhook Asaas:', error?.message || error);
    return res.status(400).json({ ok: false, error: 'Requisição inválida.' });
  }
}
