'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Calendar, Users, DollarSign, Package, 
  Menu, Bell, LogOut, Settings, Home,
  BarChart3, Receipt, Scissors, ShoppingBag, Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({ isOpen, onToggle }: SidebarProps) {
  const { user, role, signOut, isAdmin } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard', adminOnly: false },
    { href: '/admin/agenda', icon: Calendar, label: 'Agenda', adminOnly: false },
    { href: '/admin/clientes', icon: Users, label: 'Clientes', adminOnly: false },
    { href: '/admin/profissionais', icon: Receipt, label: 'Profissionais', adminOnly: false },
    { href: '/admin/produtos', icon: ShoppingBag, label: 'Produtos', adminOnly: false },
    { href: '/admin/servicos-new', icon: Scissors, label: 'Serviços', adminOnly: false },
    { href: '/admin/financeiro', icon: DollarSign, label: 'Financeiro', adminOnly: false },
    { href: '/admin/estoque', icon: Package, label: 'Estoque', adminOnly: false },
    { href: '/admin/relatorios', icon: BarChart3, label: 'Relatórios', adminOnly: false },
    { href: '/admin/usuarios', icon: Shield, label: 'Usuários', adminOnly: false },
    { href: '/admin/configuracoes', icon: Settings, label: 'Configurações', adminOnly: false },
  ];

  // REMOVER FILTRO - Mostrar TODOS os menus para TODOS os usuários (desenvolvimento)
  const visibleMenuItems = menuItems;
  
  console.log('🔍 Debug Sidebar:', { role, isAdmin, user, menuCount: visibleMenuItems.length });

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside 
      className={`bg-white border-r border-neutral-200 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">O</span>
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg truncate">Otimiza Beauty</h1>
              {role && (
                <span className="text-xs text-neutral-500 capitalize">
                  {role === 'admin' ? 'Administrador' : 'Profissional'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navegação */}
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  active
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span className="truncate">{item.label}</span>}
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Usuário e Logout */}
      <div className="p-4 border-t border-neutral-200">
        {isOpen ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 px-2">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {user?.full_name || 'Usuário'}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600 hover:bg-red-50"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        ) : (
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
