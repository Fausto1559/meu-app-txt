export default async function handler(_req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');

  // Endpoint legado: não processa nem confirma pagamentos.
  // O único receptor autorizado é /api/webhook, com token Asaas e persistência server-side.
  return res.status(410).json({
    ok: false,
    error: 'Endpoint legado desativado. Utilize /api/webhook.',
  });
}
