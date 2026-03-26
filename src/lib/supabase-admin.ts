import { createClient } from '@supabase/supabase-js';

/**
 * Client com service_role para uso EXCLUSIVO em API Routes (server-side).
 * Nunca importe este arquivo em código client-side.
 * Lazy initialization para não quebrar o build quando a env var não está disponível.
 */
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    }
    _supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

// Proxy para manter a API de uso igual: supabaseAdmin.from(...), supabaseAdmin.auth.admin...
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop];
  },
});
