'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminSidebarNew from '@/components/layout/AdminSidebarNew';
import QuickActions from '@/components/layout/QuickActions';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import MensagemAvisoModal from '@/components/modals/MensagemAvisoModal';
import BuscarAgendaModal from '@/components/modals/BuscarAgendaModal';

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
      key: 'd',
      ctrl: true,
      callback: () => router.push('/admin/contas-receber'),
      description: 'Recebimento de Débito',
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

  // PROTEÇÃO DESATIVADA TEMPORARIAMENTE PARA TESTES
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
  
  /* CÓDIGO ORIGINAL COM PROTEÇÃO
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-neutral-50">
        <AdminSidebarNew />
        <main className="ml-64 transition-all duration-300">
          <div className="min-h-screen">
            {children}
          </div>
        </main>
        <QuickActions />
      </div>
    </ProtectedRoute>
  );
  */
}
