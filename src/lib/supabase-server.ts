import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Cliente Supabase para uso em API Routes (server-side).
 * Usa a service_role key → bypassa RLS automaticamente.
 * Nunca exponha esta chave no browser.
 */
export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias nas API Routes.'
    );
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
