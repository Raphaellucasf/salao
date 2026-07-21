'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  Menu,
  Package,
  Scissors,
  Settings,
  Shield,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react';
import { useCadastrosPendentes } from '@/hooks/useCadastrosPendentes';
import { useAuth } from '@/contexts/AuthContext';
import { BrandMark } from '@/components/ui';

const mainItems = [
  { name: 'Início', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Agenda', href: '/admin/agenda', icon: Calendar },
  { name: 'Comandas', href: '/admin/comandas', icon: ClipboardList },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
];

const secondaryItems = [
  { name: 'Profissionais', href: '/admin/profissionais', icon: Scissors },
  { name: 'Produtos', href: '/admin/produtos', icon: ShoppingBag },
  { name: 'Serviços', href: '/admin/servicos-new', icon: Scissors },
  { name: 'Financeiro', href: '/admin/financeiro', icon: DollarSign },
  { name: 'Estoque', href: '/admin/estoque', icon: Package },
  { name: 'Relatórios', href: '/admin/relatorios', icon: BarChart3 },
  { name: 'Usuários', href: '/admin/usuarios', icon: Shield },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { count: pendentesCount } = useCadastrosPendentes();
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-primary-950/45 backdrop-blur-sm" onClick={() => setIsOpen(false)} aria-label="Fechar menu" />
          <div className="absolute inset-x-3 bottom-24 max-h-[70vh] overflow-y-auto rounded-3xl border border-white/70 bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between px-1">
              <BrandMark size="sm" />
              <button type="button" onClick={() => setIsOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100" aria-label="Fechar mais opções"><X className="h-5 w-5" /></button>
            </div>
            {isAdmin ? (
              <div className="grid grid-cols-2 gap-2">
                {secondaryItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} aria-current={active ? 'page' : undefined} className={`flex min-h-12 items-center gap-3 rounded-2xl border px-3 text-sm font-semibold ${active ? 'border-primary-200 bg-primary-50 text-primary-800' : 'border-neutral-100 bg-neutral-50 text-neutral-700'}`}>
                      <Icon className="h-4 w-4" /> {item.name}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-2xl bg-neutral-50 p-4 text-sm leading-6 text-neutral-600">As demais áreas aparecem de acordo com as permissões do seu perfil.</p>
            )}
          </div>
        </div>
      )}

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 flex min-h-18 items-stretch border-t border-neutral-200/80 bg-white/92 px-1 shadow-[0_-8px_30px_rgb(50_35_31/0.08)] backdrop-blur-xl lg:hidden" aria-label="Navegação móvel">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[0.65rem] font-semibold transition-colors ${active ? 'text-primary-800' : 'text-neutral-400 hover:text-neutral-700'}`}>
              <span className={`relative flex h-8 w-10 items-center justify-center rounded-xl ${active ? 'bg-primary-50' : ''}`}>
                <Icon className="h-5 w-5" />
                {item.href === '/admin/agenda' && pendentesCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-accent-600 px-0.5 text-[0.55rem] text-white">{pendentesCount > 9 ? '9+' : pendentesCount}</span>}
              </span>
              {item.name}
            </Link>
          );
        })}
        <button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[0.65rem] font-semibold ${isOpen ? 'text-primary-800' : 'text-neutral-400'}`}>
          <span className={`flex h-8 w-10 items-center justify-center rounded-xl ${isOpen ? 'bg-primary-50' : ''}`}>{isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</span>
          Mais
        </button>
      </nav>
    </>
  );
}
