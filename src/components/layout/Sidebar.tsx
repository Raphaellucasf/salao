'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Calendar, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Package, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  userRole?: 'admin' | 'professional' | 'client';
}

const menuItems = {
  admin: [
    { icon: BarChart3, label: 'Dashboard', href: '/admin' },
    { icon: Calendar, label: 'Agenda', href: '/admin/agenda' },
    { icon: Users, label: 'Clientes', href: '/admin/clientes' },
    { icon: Users, label: 'Profissionais', href: '/admin/profissionais' },
    { icon: ShoppingBag, label: 'Vendas', href: '/admin/vendas' },
    { icon: Package, label: 'Estoque', href: '/admin/estoque' },
    { icon: Settings, label: 'Configurações', href: '/admin/configuracoes' },
  ],
  professional: [
    { icon: Calendar, label: 'Minha Agenda', href: '/profissionais' },
    { icon: ShoppingBag, label: 'Vendas', href: '/profissionais/vendas' },
    { icon: BarChart3, label: 'Comissões', href: '/profissionais/comissoes' },
    { icon: Users, label: 'Meus Clientes', href: '/profissionais/clientes' },
  ],
};

export default function Sidebar({ userRole = 'admin' }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const items = menuItems[userRole] || menuItems.admin;

  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-screen bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out z-40 flex-col ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header com Logo */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-neutral-900 font-semibold text-sm">Dimas Dona</h1>
                <p className="text-neutral-500 text-xs">Concept</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-neutral-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-neutral-600" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                  isActive
                    ? 'bg-accent-50 text-accent-700 shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-accent-600' : 'text-neutral-500 group-hover:text-neutral-700'
                  }`}
                />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t border-neutral-200 ${isCollapsed ? 'px-2' : ''}`}>
          <div
            className={`flex items-center gap-3 p-3 rounded-lg bg-neutral-50 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-sm font-medium">
              D
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">Dimas</p>
                <p className="text-xs text-neutral-500 truncate">
                  {userRole === 'admin' ? 'Administrador' : 'Profissional'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Spacer for content */}
      <div className={`hidden lg:block ${isCollapsed ? 'w-20' : 'w-64'}`} />
    </>
  );
}
