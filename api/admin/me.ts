import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/adminAuth.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      ok: false,
      error: 'Method Not Allowed',
    });
  }

  const authorization = await requireAdmin(req);

  if (!authorization.ok) {
    return res.status(authorization.status).json({
      ok: false,
      error: authorization.error,
    });
  }

  return res.status(200).json({
    ok: true,
    admin: {
      userId: authorization.userId,
      role: authorization.role,
    },
  });
}
