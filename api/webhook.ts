export interface StoredWebhookEvent {
  id: string;
  gateway: string;
  eventType: 'pagamento_aprovado' | 'pagamento_recusado' | 'pagamento_estornado';
  customerEmail: string;
  amount: number;
  status: 'processado' | 'falha';
  httpStatus: 200 | 500;
  attempts: number;
  createdAt: string;
  processedAt?: string;
  errorMessage?: string;
}

const webhookEventsStore: StoredWebhookEvent[] = [];

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      endpoint: '/api/webhook',
      events: webhookEventsStore,
    });
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

      if (body.action === 'reprocess' && body.eventId) {
        const existing = webhookEventsStore.find((e) => e.id === body.eventId);
        if (existing) {
          existing.status = 'processado';
          existing.httpStatus = 200;
          existing.attempts += 1;
          existing.processedAt = new Date().toISOString();
          existing.errorMessage = undefined;
          return res.status(200).json({ ok: true, httpStatus: 200, event: existing });
        }
      }

      const eventId = body.id || `evt_${Date.now()}`;
      const simulateFailure = Boolean(body.simulateFailure);

      const savedEvent: StoredWebhookEvent = {
        id: eventId,
        gateway: body.gateway || 'Asaas / Stripe / Mercado Pago',
        eventType: body.eventType || 'pagamento_aprovado',
        customerEmail: body.customerEmail || 'cliente@empresa.com.br',
        amount: Number(body.amount ?? 197.0),
        status: simulateFailure ? 'falha' : 'processado',
        httpStatus: simulateFailure ? 500 : 200,
        attempts: 1,
        createdAt: new Date().toISOString(),
        processedAt: simulateFailure ? undefined : new Date().toISOString(),
        errorMessage: simulateFailure ? 'Falha salva no banco aguardando reprocessamento.' : undefined,
      };

      webhookEventsStore.unshift(savedEvent);

      if (simulateFailure) {
        return res.status(500).json({ ok: false, httpStatus: 500, event: savedEvent });
      }

      return res.status(200).json({ ok: true, httpStatus: 200, event: savedEvent });
    } catch (err: any) {
      return res.status(500).json({ ok: false, httpStatus: 500, message: err?.message });
    }
  }

  return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
}