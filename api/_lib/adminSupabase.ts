import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente privilegiado exclusivo do backend.
 * Nunca importar este módulo em código executado pelo navegador.
 */
let adminClient: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Configuração administrativa do Supabase ausente no servidor.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error('SUPABASE_URL inválida no servidor.');
  }

  const isLocalHttp =
    parsedUrl.protocol === 'http:' &&
    (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1');

  if (parsedUrl.protocol !== 'https:' && !isLocalHttp) {
    throw new Error('SUPABASE_URL deve utilizar HTTPS.');
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return adminClient;
}
