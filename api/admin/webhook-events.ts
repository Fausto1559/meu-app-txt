import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/adminAuth.js';
import { getAdminSupabase } from '../_lib/adminSupabase.js';
import { processAsaasEvent } from '../_lib/processAsaasEvent.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const authorization = await requireAdmin(req, ['owner', 'admin']);
  if (!authorization.ok) {
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
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
    const ids = Array.isArray(body?.eventIds)
      ? body.eventIds.filter((id: unknown) => typeof id === 'string').slice(0, 50)
      : [];

    if (!ids.length) {
      return res.status(400).json({ ok: false, error: 'Informe ao menos um ID de evento.' });
    }

    const { data: pending, error: lookupError } = await supabase
      .from('webhook_events')
      .select('id,provider_event_id,payload,processing_status')
      .eq('provider', 'asaas')
      .in('id', ids)
      .eq('processing_status', 'failed');

    if (lookupError) {
      console.error('Falha ao localizar eventos para reprocessamento:', lookupError.message);
      return res.status(503).json({ ok: false, error: 'Não foi possível localizar os eventos.' });
    }

    const results: Array<{ id: string; processed: boolean }> = [];
    for (const event of pending || []) {
      try {
        await processAsaasEvent(event.payload);
        const { error } = await supabase
          .from('webhook_events')
          .update({
            processing_status: 'processed',
            processed_at: new Date().toISOString(),
            last_error: null,
            attempts: 2,
          })
          .eq('id', event.id);
        if (error) throw new Error(error.message);
        results.push({ id: event.id, processed: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha desconhecida';
        await supabase
          .from('webhook_events')
          .update({ attempts: 3, last_error: message.slice(0, 2000) })
          .eq('id', event.id);
        results.push({ id: event.id, processed: false });
      }
    }

    return res.status(200).json({
      ok: true,
      requested: ids.length,
      processed: results.filter((item) => item.processed).length,
      failed: results.filter((item) => !item.processed).length,
      results,
    });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
}
