'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Package,
  Scissors,
  Settings,
  Shield,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissoes } from '@/hooks/usePermissoes';
import { useCadastrosPendentes } from '@/hooks/useCadastrosPendentes';
import { BrandMark } from '@/components/ui';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const sections: Array<{ label: string; items: SidebarItem[] }> = [
  {
    label: 'Rotina',
    items: [
      { name: 'Visão geral', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Agenda', href: '/admin/agenda', icon: Calendar },
      { name: 'Clientes', href: '/admin/clientes', icon: Users },
      { name: 'Comandas', href: '/admin/comandas', icon: ClipboardList },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { name: 'Profissionais', href: '/admin/profissionais', icon: Scissors, adminOnly: true },
      { name: 'Produtos', href: '/admin/produtos', icon: ShoppingBag, adminOnly: true },
      { name: 'Serviços', href: '/admin/servicos-new', icon: Scissors, adminOnly: true },
      { name: 'Financeiro', href: '/admin/financeiro', icon: DollarSign, adminOnly: true },
      { name: 'Estoque', href: '/admin/estoque', icon: Package, adminOnly: true },
      { name: 'Relatórios', href: '/admin/relatorios', icon: BarChart3, adminOnly: true },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { name: 'Usuários', href: '/admin/usuarios', icon: Shield, adminOnly: true },
      { name: 'Configurações', href: '/admin/configuracoes', icon: Settings, adminOnly: true },
    ],
  },
];

export default function AdminSidebarNew({ isCollapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, signOut, isAdmin } = useAuth();
  const { nomeRole } = usePermissoes();
  const { count: pendentesCount } = useCadastrosPendentes();

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-primary-900 bg-primary-950 text-white shadow-soft transition-[width] duration-300 lg:flex ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex h-20 shrink-0 items-center border-b border-white/8 ${isCollapsed ? 'justify-center px-3' : 'justify-between px-4'}`}>
        <BrandMark compact={isCollapsed} inverse size="sm" />
        <button
          type="button"
          onClick={onToggle}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/55 transition-colors hover:bg-white/8 hover:text-white ${isCollapsed ? 'absolute -right-4 top-5 border border-primary-800 bg-primary-950 shadow-card' : ''}`}
          aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
        {sections.map((section) => {
          const visibleItems = section.items.filter((item) => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.label} className="mb-5 last:mb-0">
              {!isCollapsed && <p className="mb-2 px-3 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/30">{section.label}</p>}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative flex min-h-10 items-center rounded-xl transition-colors ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${isActive ? 'bg-white text-primary-950 shadow-card' : 'text-white/62 hover:bg-white/8 hover:text-white'}`}
                    >
                      <Icon className="h-[1.1rem] w-[1.1rem] shrink-0" aria-hidden="true" />
                      {!isCollapsed && <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span>}
                      {item.href === '/admin/agenda' && pendentesCount > 0 && (
                        <span className={isCollapsed ? 'absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary-950 bg-accent-500' : 'min-w-5 rounded-full bg-accent-600 px-1.5 text-center text-[0.65rem] font-bold leading-5 text-white'}>
                          {!isCollapsed && (pendentesCount > 99 ? '99+' : pendentesCount)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/8 p-3">
        {!isCollapsed && (
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-sm font-semibold text-white">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'D'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.full_name || 'Usuário'}</p>
              <p className="truncate text-xs text-white/40">{nomeRole || (isAdmin ? 'Administrador' : 'Equipe')}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => signOut()}
          className={`flex min-h-10 w-full items-center rounded-xl text-white/55 transition-colors hover:bg-red-400/10 hover:text-red-200 ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'}`}
          title={isCollapsed ? 'Sair' : undefined}
        >
          <LogOut className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
          {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
