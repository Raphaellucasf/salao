'use client';

import { useAdminOnly } from '@/hooks/useAdminOnly';

/**
 * HOC que bloqueia renderização e redireciona para /admin/agenda
 * se o usuário não for administrador.
 *
 * Uso:
 *   export default withAdminOnly(function MinhaPage() { ... });
 */
export function withAdminOnly<P extends object>(
  Component: React.ComponentType<P>
) {
  function AdminProtected(props: P) {
    const { isAdmin, loading } = useAdminOnly();
    // Não desmonta durante loading — evita perda de estado da página
    if (!loading && !isAdmin) return null;
    return <Component {...props} />;
  }
  AdminProtected.displayName = `AdminOnly(${Component.displayName || Component.name})`;
  return AdminProtected;
}
