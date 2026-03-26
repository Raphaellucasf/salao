'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AdminSidebarNew from '@/components/layout/AdminSidebarNew';
import QuickActions from '@/components/layout/QuickActions';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import dynamic from 'next/dynamic';
import { Toaster } from 'sonner';
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

  // Redireciona sem spinner bloqueante — evita desmontar filhos durante re-checks de auth
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  // Não renderiza nada apenas se definitivamente não autenticado (sem loading)
  if (!loading && !user) return null;

  return (
    <>
      <div className="min-h-screen bg-neutral-50">
        {/* Sidebar */}
        <AdminSidebarNew />

        {/* Main Content */}
        <main className="ml-64 transition-all duration-300">
          <div className="min-h-screen">
            {children}
          </div>
        </main>

        {/* Quick Actions FAB */}
        <QuickActions />
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