'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  FileStack,
  FlaskConical,
  MessageSquare,
  Package as PackageIcon,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ConsumoInternoModal from '@/components/modals/ConsumoInternoModal';
import VendaRapidaModal from '@/components/modals/VendaRapidaModal';
import VendaPacoteClienteModal from '@/components/modals/VendaPacoteClienteModal';

interface QuickActionsProps {
  onOpenSearch: () => void;
  onOpenMessage: () => void;
}

interface QuickAction {
  id: string;
  name: string;
  icon: React.ElementType;
  shortcut?: string;
  onClick: () => void;
}

export default function QuickActions({ onOpenSearch, onOpenMessage }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [consumoInternoOpen, setConsumoInternoOpen] = useState(false);
  const [vendaRapidaOpen, setVendaRapidaOpen] = useState(false);
  const [vendaPacoteOpen, setVendaPacoteOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  const actions: QuickAction[] = [
    { id: 'new-appointment', name: 'Abrir agenda', icon: Calendar, shortcut: 'F2', onClick: () => router.push('/admin/agenda') },
    { id: 'search-agenda', name: 'Buscar na agenda', icon: Search, shortcut: 'Ctrl+B', onClick: onOpenSearch },
    { id: 'new-comanda', name: 'Fechar comanda', icon: Receipt, shortcut: 'F8', onClick: () => router.push('/admin/comandas') },
    { id: 'sell-package', name: 'Vender pacote', icon: PackageIcon, shortcut: 'F4', onClick: () => setVendaPacoteOpen(true) },
    { id: 'send-message', name: 'Mensagem de aviso', icon: MessageSquare, shortcut: 'Ctrl+M', onClick: onOpenMessage },
    { id: 'anamnese', name: 'Anamnese', icon: FileStack, onClick: () => router.push('/admin/anamnese') },
    { id: 'quick-sale', name: 'Venda rápida', icon: ShoppingBag, onClick: () => setVendaRapidaOpen(true) },
    { id: 'consumo-interno', name: 'Consumo interno', icon: FlaskConical, onClick: () => setConsumoInternoOpen(true) },
  ];

  return (
    <>
      {isOpen && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default bg-primary-950/25 backdrop-blur-[2px]" onClick={() => setIsOpen(false)} aria-label="Fechar ações rápidas" />
          <div className="fixed bottom-44 right-4 z-50 flex max-h-[calc(100vh-12rem)] flex-col gap-2 overflow-y-auto pr-1 lg:bottom-24 lg:right-6" role="menu" aria-label="Ações rápidas">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  role="menuitem"
                  onClick={() => { action.onClick(); setIsOpen(false); }}
                  className="group flex min-h-12 items-center justify-end gap-3 rounded-2xl border border-white/70 bg-white/95 p-2 pl-4 text-left shadow-soft backdrop-blur-sm transition-transform hover:-translate-x-1"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-semibold text-neutral-800">{action.name}</span>
                    {action.shortcut && <kbd className="hidden rounded-md bg-neutral-100 px-1.5 py-1 font-mono text-[0.6rem] text-neutral-500 sm:inline">{action.shortcut}</kbd>}
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 transition-colors group-hover:bg-primary-800 group-hover:text-white">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-600 text-white shadow-luxury transition-[transform,background-color] hover:-translate-y-1 hover:bg-accent-700 active:translate-y-0 lg:bottom-6 lg:right-6 ${isOpen ? 'rotate-45' : ''}`}
        aria-label={isOpen ? 'Fechar ações rápidas' : 'Abrir ações rápidas'}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>

      <ConsumoInternoModal isOpen={consumoInternoOpen} onClose={() => setConsumoInternoOpen(false)} />
      <VendaRapidaModal isOpen={vendaRapidaOpen} onClose={() => setVendaRapidaOpen(false)} />
      <VendaPacoteClienteModal isOpen={vendaPacoteOpen} onClose={() => setVendaPacoteOpen(false)} />
    </>
  );
}
