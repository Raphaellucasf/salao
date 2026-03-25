import { createClient } from '@supabase/supabase-js';

/**
 * Client com service_role para uso EXCLUSIVO em API Routes (server-side).
 * Nunca importe este arquivo em código client-side.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export { supabaseAdmin };
