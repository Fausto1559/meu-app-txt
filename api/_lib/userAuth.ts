import type { VercelRequest } from '@vercel/node';
import { getAdminSupabase } from './adminSupabase.js';

export async function getAuthenticatedUser(req: Pick<VercelRequest, 'headers'>) {
  const authorization = req.headers?.authorization;
  if (typeof authorization !== 'string') return null;

  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization.trim());
  if (!match?.[1]) return null;

  const supabase = getAdminSupabase();
  const { data, error } = await supabase.auth.getUser(match[1]);
  if (error || !data.user?.id) return null;

  return { supabase, user: data.user };
}
