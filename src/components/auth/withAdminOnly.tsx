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
    useAdminOnly(); // apenas dispara redirect por side-effect, nunca desmonta o componente filho
    return <Component {...props} />;
  }
  AdminProtected.displayName = `AdminOnly(${Component.displayName || Component.name})`;
  return AdminProtected;
}
