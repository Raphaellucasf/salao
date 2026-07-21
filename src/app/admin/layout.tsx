'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AdminSidebarNew from '@/components/layout/AdminSidebarNew';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import QuickActions from '@/components/layout/QuickActions';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import dynamic from 'next/dynamic';
import { Toaster } from 'sonner';
import { BrandMark } from '@/components/ui';
const MensagemAvisoModal = dynamic(() => import('@/components/modals/MensagemAvisoModal'), { ssr: false });
const BuscarAgendaModal = dynamic(() => import('@/components/modals/BuscarAgendaModal'), { ssr: false });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mensagemModalOpen, setMensagemModalOpen] = useState(false);
  const [buscarAgendaModalOpen, setBuscarAgendaModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Atalhos globais do sistema
  useKeyboardShortcuts([
    {
      key: 'F2',
      callback: () => router.push('/admin/agenda'),
      description: 'Abrir Agenda',
    },
    {
      key: 'F3',
      callback: () => router.push('/admin/clientes'),
      description: 'Cadastrar Cliente',
    },
    {
      key: 'F4',
      callback: () => router.push('/admin/pacotes'),
      description: 'Venda de Pacotes',
    },
    {
      key: 'F8',
      callback: () => router.push('/admin/comandas'),
      description: 'Fechamento de Comanda',
    },
    {
      key: 'm',
      ctrl: true,
      callback: () => setMensagemModalOpen(true),
      description: 'Mensagem de Aviso',
    },
    {
      key: 'b',
      ctrl: true,
      callback: () => setBuscarAgendaModalOpen(true),
      description: 'Buscar na Agenda',
    },
  ]);

  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-5">
          <BrandMark />
          <div className="h-1 w-28 overflow-hidden rounded-full bg-primary-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-accent-500" />
          </div>
          <p className="text-sm font-medium text-neutral-500">Preparando seu espaço…</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <>
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        {/* Sidebar Desktop */}
        <AdminSidebarNew isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)} />

        {/* Sidebar Mobile (Bottom Nav) */}
        <MobileBottomNav />

        {/* Main Content */}
        <main className={`ml-0 transition-[margin] duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <div className="min-h-screen">
            {children}
          </div>
        </main>

        {/* Quick Actions FAB */}
        <QuickActions
          onOpenSearch={() => setBuscarAgendaModalOpen(true)}
          onOpenMessage={() => setMensagemModalOpen(true)}
        />
      </div>

      {/* Toast notifications (realtime) */}
      <Toaster position="top-right" richColors closeButton />

      {/* Modais Globais */}
      <MensagemAvisoModal
        isOpen={mensagemModalOpen}
        onClose={() => setMensagemModalOpen(false)}
        onSave={() => {}}
      />
      <BuscarAgendaModal
        isOpen={buscarAgendaModalOpen}
        onClose={() => setBuscarAgendaModalOpen(false)}
      />
    </>
  );
}
