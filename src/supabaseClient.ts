import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Blindagem: se as env vars estiverem ausentes ou inválidas (ex.: o placeholder
// "[SENSITIVE]" gravado pelo `vercel env pull` em variáveis marcadas como
// Sensitive no painel), o app NÃO pode deixar de montar por causa disso.
let client: SupabaseClient;
try {
  client = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error(
    'Supabase: configuração inválida (VITE_SUPABASE_URL/ANON_KEY). ' +
      'Usando cliente placeholder — os dados do Supabase ficarão indisponíveis até corrigir as env vars.',
    error
  );
  client = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export const supabase = client;
