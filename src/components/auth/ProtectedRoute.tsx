'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ 
  children,
  allowedRoles = ['admin', 'professional']
}: { 
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'professional' | 'client')[];
}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (role && !allowedRoles.includes(role)) {
        // Redirecionar baseado na role
        if (role === 'admin') {
          router.push('/admin');
        } else if (role === 'professional') {
          router.push('/profissionais');
        } else {
          router.push('/');
        }
      }
    }
  }, [user, role, loading, router, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || (role && !allowedRoles.includes(role))) {
    return null;
  }

  return <>{children}</>;
}
