'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Scissors, 
  DollarSign, 
  Package, 
  Settings,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ShoppingBag,
  Shield,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissoes } from '@/hooks/usePermissoes';
import { useState } from 'react';
import { useCadastrosPendentes } from '@/hooks/useCadastrosPendentes';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard',     href: '/admin/dashboard',    icon: LayoutDashboard },
  { name: 'Agenda',        href: '/admin/agenda',        icon: Calendar },
  { name: 'Clientes',      href: '/admin/clientes',      icon: Users },
  { name: 'Comandas',      href: '/admin/comandas',      icon: ClipboardList },
  { name: 'Profissionais', href: '/admin/profissionais', icon: Scissors,    adminOnly: true },
  { name: 'Produtos',      href: '/admin/produtos',      icon: ShoppingBag, adminOnly: true },
  { name: 'Serviços',      href: '/admin/servicos-new',  icon: Scissors,    adminOnly: true },
  { name: 'Financeiro',    href: '/admin/financeiro',    icon: DollarSign,  adminOnly: true },
  { name: 'Estoque',       href: '/admin/estoque',       icon: Package,     adminOnly: true },
  { name: 'Relatórios',    href: '/admin/relatorios',    icon: BarChart3,   adminOnly: true },
  { name: 'Usuários',      href: '/admin/usuarios',      icon: Shield,      adminOnly: true },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings,    adminOnly: true },
];

export default function AdminSidebarNew() {
  const pathname = usePathname();
  const { user, signOut, isAdmin } = useAuth();
  const { nomeRole } = usePermissoes();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { count: pendentesCount } = useCadastrosPendentes();

  const visibleItems = sidebarItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside 
      className={`
        hidden lg:flex flex-col
        fixed left-0 top-0 h-screen bg-white border-r border-neutral-200
        transition-all duration-300 ease-in-out z-40 shadow-sm
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-linear-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-neutral-900">Dimas Dona</h1>
              <p className="text-xs text-neutral-500">Concept</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-neutral-700" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-neutral-700" />
          )}
        </button>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-linear-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-neutral-900">
                {user?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {nomeRole || (isAdmin ? 'Administrador' : 'Usuário')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center px-3 py-2.5 rounded-lg relative
                transition-all duration-200
                ${isActive 
                  ? 'bg-accent-500 text-neutral-900 font-medium shadow-md' 
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                }
                ${isCollapsed ? 'justify-center' : 'space-x-3'}
              `}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} shrink-0`} />
              {!isCollapsed && <span className="text-sm flex-1">{item.name}</span>}
              {!isCollapsed && item.href === '/admin/agenda' && pendentesCount > 0 && (
                <span className="text-xs font-bold bg-amber-500 text-white rounded-full px-1.5 min-w-5 text-center leading-5">
                  {pendentesCount}
                </span>
              )}
              {isCollapsed && item.href === '/admin/agenda' && pendentesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-neutral-200">
        <button
          onClick={() => signOut()}
          className={`
            w-full flex items-center px-3 py-2.5 rounded-lg
            text-neutral-700 hover:bg-red-50 hover:text-red-600
            transition-colors
            ${isCollapsed ? 'justify-center' : 'space-x-3'}
          `}
          title={isCollapsed ? 'Sair' : undefined}
        >
          <LogOut className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
          {!isCollapsed && <span className="text-sm">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
