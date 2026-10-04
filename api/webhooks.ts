const processedEvents = new Set<string>();
const SQLI_XSS_PATTERN = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|TRUNCATE)\b|--|;|<script|javascript:|onerror=|onload=)/i;

function sanitizeServerText(input: unknown, maxLength = 160): string {
  if (typeof input !== 'string') return '';
  const cleaned = input.replace(/[<>'"`;\\]/g, '').trim().slice(0, maxLength);
  if (SQLI_XSS_PATTERN.test(cleaned)) {
    throw new Error('Conteudo bloqueado pela camada Anti-SQL Injection / XSS');
  }
  return cleaned;
}

export default async function handler(req: any, res: any) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const signature = req.headers['x-webhook-signature'] || '';
    const expectedSecret = process.env.WEBHOOK_SECRET;
    if (expectedSecret && signature !== expectedSecret) {
      return res.status(401).json({ error: 'Assinatura invalida (Unauthorized).' });
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!payload || typeof payload !== 'object' || !payload.id || !payload.event) {
      return res.status(400).json({ error: 'Payload invalido.' });
    }

    const safeId = sanitizeServerText(String(payload.id), 80);
    const safeEvent = sanitizeServerText(String(payload.event), 80);
    const numericAmount = Number(payload?.data?.amount ?? 0);

    if (!Number.isFinite(numericAmount) || numericAmount < 0 || numericAmount > 10000000) {
      return res.status(400).json({ error: 'Valor numerico invalido.' });
    }

    if (processedEvents.has(safeId)) {
      return res.status(200).json({ received: true, duplicate: true, id: safeId });
    }
    processedEvents.add(safeId);

    return res.status(200).json({
      received: true,
      duplicate: false,
      id: safeId,
      event: safeEvent,
      amount: numericAmount,
      processedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Requisicao bloqueada.' });
  }
}