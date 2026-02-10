'use client';

import { useState } from 'react';
import { Calendar, ShoppingBag, DollarSign, Receipt, Plus, X, Package as PackageIcon, FileText, MessageSquare, Search, FileStack } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickAction {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  shortcut?: string;
  onClick: () => void;
}

export default function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      id: 'new-appointment',
      name: 'Agenda',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      shortcut: 'F2',
      onClick: () => router.push('/admin/agenda'),
    },
    {
      id: 'search-agenda',
      name: 'Buscar na Agenda',
      icon: Search,
      color: 'from-cyan-500 to-cyan-600',
      shortcut: 'Ctrl+B',
      onClick: () => {}, // Handled by global shortcut
    },
    {
      id: 'new-comanda',
      name: 'Fechamento de Comanda',
      icon: Receipt,
      color: 'from-green-500 to-green-600',
      shortcut: 'F8',
      onClick: () => router.push('/admin/comandas'),
    },
    {
      id: 'sell-package',
      name: 'Venda de Pacote',
      icon: PackageIcon,
      color: 'from-purple-500 to-purple-600',
      shortcut: 'F4',
      onClick: () => router.push('/admin/pacotes'),
    },
    {
      id: 'receive-payment',
      name: 'Recebimento de Débito',
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      shortcut: 'Ctrl+D',
      onClick: () => router.push('/admin/contas-receber'),
    },
    {
      id: 'send-message',
      name: 'Mensagem de Aviso',
      icon: MessageSquare,
      color: 'from-pink-500 to-pink-600',
      shortcut: 'Ctrl+M',
      onClick: () => {}, // Handled by global shortcut
    },
    {
      id: 'anamnese',
      name: 'Anamnese',
      icon: FileStack,
      color: 'from-indigo-500 to-indigo-600',
      onClick: () => router.push('/admin/anamnese'),
    },
    {
      id: 'quick-sale',
      name: 'Venda Rápida',
      icon: ShoppingBag,
      color: 'from-teal-500 to-teal-600',
      onClick: () => router.push('/admin/estoque'),
    },
  ];

  return (
    <>
      {/* FAB Principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full shadow-luxury-hover
          bg-gradient-to-br from-accent-500 to-accent-600
          text-neutral-900 font-bold
          flex items-center justify-center
          transition-transform duration-300
          hover:scale-110 active:scale-95
          ${isOpen ? 'rotate-45' : 'rotate-0'}
        `}
        aria-label="Ações rápidas"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>

      {/* Menu de Ações */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Action Buttons */}
          <div className="fixed bottom-24 right-6 z-50 flex flex-col space-y-3">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.id}
                  className="flex items-center justify-end space-x-3 animate-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Label */}
                  <div className="bg-neutral-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{action.name}</span>
                      {action.shortcut && (
                        <kbd className="px-2 py-0.5 bg-neutral-700 rounded text-xs">
                          {action.shortcut}
                        </kbd>
                      )}
                    </div>
                  </div>
                  
                  {/* Button */}
                  <button
                    onClick={() => {
                      action.onClick();
                      setIsOpen(false);
                    }}
                    className={`
                      w-12 h-12 rounded-full shadow-luxury
                      bg-gradient-to-br ${action.color}
                      text-white flex items-center justify-center
                      transition-transform hover:scale-110 active:scale-95
                    `}
                    aria-label={action.name}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
