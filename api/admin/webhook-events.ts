import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/adminAuth.js';
import { getAdminSupabase } from '../_lib/adminSupabase.js';
import { processAsaasEvent } from '../_lib/processAsaasEvent.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const authorization = await requireAdmin(req, ['owner', 'admin']);
  if ('status' in authorization) {
    return res.status(authorization.status).json({ ok: false, error: authorization.error });
  }

  const supabase = getAdminSupabase();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('webhook_events')
      .select('id,provider,provider_event_id,event_type,provider_payment_id,provider_subscription_id,processing_status,attempts,last_error,received_at,processed_at')
      .eq('provider', 'asaas')
      .order('received_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Falha ao consultar eventos Asaas:', error.message);
      return res.status(503).json({ ok: false, error: 'Não foi possível consultar os eventos.' });
    }

    return res.status(200).json({ ok: true, events: data || [] });
  }

  if (req.method === 'POST') {
    let body: any;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
    } catch {
      return res.status(400).json({ ok: false, error: 'JSON inválido.' });
    }

    const ids = Array.isArray(body?.eventIds)
      ? [...new Set(body.eventIds.filter((id: unknown) => typeof id === 'string').slice(0, 50))]
      : [];

    if (!ids.length) {
      return res.status(400).json({ ok: false, error: 'Informe ao menos um ID de evento.' });
    }

    const { data: pending, error: lookupError } = await supabase
      .from('webhook_events')
      .select('id,provider_event_id,payload,processing_status,attempts,processing_started_at')
      .eq('provider', 'asaas')
      .in('id', ids)
      .or(`processing_status.in.(failed,received),and(processing_status.eq.processing,processing_started_at.is.null),and(processing_status.eq.processing,processing_started_at.lt.${new Date(Date.now()-15*60*1000).toISOString()})`);

    if (lookupError) {
      console.error('Falha ao localizar eventos para reprocessamento:', lookupError.message);
      return res.status(503).json({ ok: false, error: 'Não foi possível localizar os eventos.' });
    }

    const results: Array<{ id: string; processed: boolean; skipped?: boolean }> = [];
    for (const event of pending || []) {
      const attempts = Number(event.attempts || 0) + 1;
      const processingStartedAt = new Date().toISOString();
      const leaseCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: claimed, error: claimError } = await supabase
        .from('webhook_events')
        .update({
          processing_status: 'processing',
          processing_started_at: processingStartedAt,
          attempts,
          last_error: null,
        })
        .eq('id', event.id)
        .or(`processing_status.in.(failed,received),and(processing_status.eq.processing,processing_started_at.is.null),and(processing_status.eq.processing,processing_started_at.lt.${leaseCutoff})`)
        .select('id')
        .maybeSingle();

      if (claimError) {
        results.push({ id: event.id, processed: false });
        continue;
      }
      if (!claimed?.id) {
        results.push({ id: event.id, processed: false, skipped: true });
        continue;
      }

      try {
        await processAsaasEvent(event.payload);
        const { error } = await supabase
          .from('webhook_events')
          .update({
            processing_status: 'processed',
            processed_at: new Date().toISOString(),
            processing_started_at: null,
            last_error: null,
          })
          .eq('id', event.id)
          .eq('processing_status', 'processing')
          .eq('processing_started_at', processingStartedAt);
        if (error) throw new Error(error.message);
        results.push({ id: event.id, processed: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha desconhecida';
        await supabase
          .from('webhook_events')
          .update({
            processing_status: 'failed',
            processing_started_at: null,
            last_error: message.slice(0, 2000),
          })
          .eq('id', event.id)
          .eq('processing_status', 'processing')
          .eq('processing_started_at', processingStartedAt);
        results.push({ id: event.id, processed: false });
      }
    }

    return res.status(200).json({
      ok: true,
      requested: ids.length,
      processed: results.filter((item) => item.processed).length,
      failed: results.filter((item) => !item.processed && !item.skipped).length,
      skipped: results.filter((item) => item.skipped).length,
      results,
    });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
}
