import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { getSupabasePublicConfig } from '@/lib/supabase-config';

// Singleton instance para browser
let browserClient: ReturnType<typeof createSSRBrowserClient<Database>> | null = null;

// Client-side Supabase client usando @supabase/ssr para armazenar tokens em cookies
// (necessário para que o middleware server-side consiga ler a sessão)
export function createBrowserClient() {
  const { url, publishableKey } = getSupabasePublicConfig();
  if (typeof window === 'undefined') {
    // Server-side: cria nova instância (sem singleton)
    return createSSRBrowserClient<Database>(
      url,
      publishableKey
    );
  }

  // Browser-side: reutiliza instância existente (singleton)
  if (!browserClient) {
    browserClient = createSSRBrowserClient<Database>(
      url,
      publishableKey
    );
  }

  return browserClient;
}

// Export do cliente singleton
export const supabase = createBrowserClient();
