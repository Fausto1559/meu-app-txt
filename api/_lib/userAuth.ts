import type { VercelRequest } from '@vercel/node';
import { getAdminSupabase } from './adminSupabase.js';

export class SupabaseServerConfigurationError extends Error {
  readonly status = 503;

  constructor() {
    super('Serviço de autenticação temporariamente indisponível.');
    this.name = 'SupabaseServerConfigurationError';
  }
}

function isInvalidServerApiKey(error: unknown): boolean {
  return typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    /invalid api key/i.test(error.message);
}

export async function getAuthenticatedUser(req: Pick<VercelRequest, 'headers'>) {
  const authorization = req.headers?.authorization;
  if (typeof authorization !== 'string') return null;

  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization.trim());
  if (!match?.[1]) return null;

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch (error) {
    console.error(
      'Configuração do cliente privilegiado Supabase indisponível:',
      error instanceof Error ? error.message : 'erro desconhecido',
    );
    throw new SupabaseServerConfigurationError();
  }

  let result;
  try {
    result = await supabase.auth.getUser(match[1]);
  } catch (error) {
    if (isInvalidServerApiKey(error)) {
      console.error('Supabase rejeitou a chave de API do servidor.');
      throw new SupabaseServerConfigurationError();
    }
    throw error;
  }

  if (result.error) {
    if (isInvalidServerApiKey(result.error)) {
      console.error('Supabase rejeitou a chave de API do servidor.');
      throw new SupabaseServerConfigurationError();
    }
    return null;
  }

  if (!result.data.user?.id) return null;
  return { supabase, user: result.data.user };
}
