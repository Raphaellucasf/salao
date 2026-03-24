import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// Singleton instance para browser
let browserClient: ReturnType<typeof createSSRBrowserClient<Database>> | null = null;

// Client-side Supabase client usando @supabase/ssr para armazenar tokens em cookies
// (necessário para que o middleware server-side consiga ler a sessão)
export function createBrowserClient() {
  if (typeof window === 'undefined') {
    // Server-side: cria nova instância (sem singleton)
    return createSSRBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // Browser-side: reutiliza instância existente (singleton)
  if (!browserClient) {
    browserClient = createSSRBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return browserClient;
}

// Export do cliente singleton
export const supabase = createBrowserClient();
