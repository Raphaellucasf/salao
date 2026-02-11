'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, ShoppingBag, Users, Menu } from 'lucide-react';

interface BottomNavProps {
  userRole?: 'admin' | 'professional' | 'client';
}

const navItems = {
  admin: [
    { icon: Calendar, label: 'Agenda', href: '/admin/agenda' },
    { icon: ShoppingBag, label: 'Vendas', href: '/admin/vendas' },
    { icon: Users, label: 'Clientes', href: '/admin/clientes' },
    { icon: Menu, label: 'Menu', href: '/admin' },
  ],
  professional: [
    { icon: Calendar, label: 'Agenda', href: '/profissionais' },
    { icon: ShoppingBag, label: 'Vendas', href: '/profissionais/vendas' },
    { icon: Users, label: 'Clientes', href: '/profissionais/clientes' },
    { icon: Menu, label: 'Menu', href: '/profissionais/menu' },
  ],
};

export default function BottomNav({ userRole = 'professional' }: BottomNavProps) {
  const pathname = usePathname();
  const items = (navItems as any)[userRole] || navItems.professional;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item: any) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all min-w-[70px] ${
                isActive
                  ? 'text-accent-600'
                  : 'text-neutral-500 active:bg-neutral-100'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-accent-600' : 'text-neutral-500'}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-accent-700' : 'text-neutral-600'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
