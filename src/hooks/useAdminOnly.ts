import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Redireciona para /admin/agenda se o usuário não for administrador.
 * Use no topo de páginas restritas a admins.
 */
export function useAdminOnly() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/admin/agenda');
    }
  }, [isAdmin, loading, router]);

  return { isAdmin, loading };
}
