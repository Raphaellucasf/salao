'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  ClipboardList,
  Menu
} from 'lucide-react';
import { useState } from 'react';
import { useCadastrosPendentes } from '@/hooks/useCadastrosPendentes';

const mainItems = [
  { name: 'Início', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Agenda', href: '/admin/agenda', icon: Calendar },
  { name: 'Comandas', href: '/admin/comandas', icon: ClipboardList },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { count: pendentesCount } = useCadastrosPendentes();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex items-center justify-around z-50 safe-bottom">
      {mainItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              relative flex flex-col items-center justify-center w-full py-3 
              transition-colors duration-200
              ${isActive ? 'text-accent-600' : 'text-neutral-500 hover:text-neutral-900'}
            `}
          >
            <div className="relative">
              <Icon className="w-6 h-6 mb-1" />
              {item.href === '/admin/agenda' && pendentesCount > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {pendentesCount > 9 ? '9+' : pendentesCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
