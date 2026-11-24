import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente privilegiado exclusivo do backend.
 * Nunca importar este módulo em código executado pelo navegador.
 */
let adminClient: SupabaseClient | null = null;

function getProjectRefFromUrl(value: string): string {
  const parsed = new URL(value);
  const isLocalHttp =
    parsed.protocol === 'http:' &&
    (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');

  if (parsed.protocol !== 'https:' && !isLocalHttp) {
    throw new Error('SUPABASE_URL deve utilizar HTTPS.');
  }

  const match = /^([a-z0-9]{20})\.supabase\.co$/i.exec(parsed.hostname);
  if (!match) {
    throw new Error('SUPABASE_URL não identifica um projeto Supabase válido.');
  }
  return match[1];
}

function assertServerKeyMatchesProject(serverKey: string, expectedRef: string): void {
  // Supabase secret API keys (sb_secret_...) are opaque and replace the legacy JWT service_role key.
  // Their project binding is verified by the Supabase API when the client makes its first request.
  if (serverKey.startsWith('sb_secret_')) return;

  // Backward compatibility for legacy service_role JWT keys.
  const parts = serverKey.split('.');
  if (parts.length !== 3) {
    throw new Error('SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY deve ser uma chave secreta de servidor válida.');
  }

  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    throw new Error('Chave privilegiada do Supabase inválida.');
  }

  if (claims.role !== 'service_role' || claims.ref !== expectedRef) {
    throw new Error('A chave privilegiada do Supabase não corresponde ao projeto configurado.');
  }
}

export function getAdminSupabase(): SupabaseClient {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serverKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serverKey) {
    throw new Error('Configuração administrativa do Supabase ausente no servidor.');
  }

  let projectRef: string;
  try {
    projectRef = getProjectRefFromUrl(supabaseUrl);
  } catch (error) {
    throw error instanceof Error ? error : new Error('SUPABASE_URL inválida no servidor.');
  }

  assertServerKeyMatchesProject(serverKey, projectRef);

  adminClient = createClient(supabaseUrl, serverKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return adminClient;
}
