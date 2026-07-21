'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ProfissionaisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['professional', 'admin']}>
      {children}
    </ProtectedRoute>
  );
}
