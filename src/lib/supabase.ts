import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton instance para browser
let browserClient: ReturnType<typeof createClient<Database>> | null = null;

// Client-side Supabase client (singleton)
export function createBrowserClient() {
  if (typeof window === 'undefined') {
    // Server-side: cria nova instância
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  // Browser-side: reutiliza instância existente
  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'otimiza-beauty-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  }

  return browserClient;
}

// Export do cliente singleton
export const supabase = createBrowserClient();
