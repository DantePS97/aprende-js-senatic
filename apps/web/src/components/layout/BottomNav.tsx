'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, MessageSquare, User } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Inicio', Icon: Home },
  { href: '/courses', label: 'Cursos', Icon: BookOpen },
  { href: '/forum', label: 'Foro', Icon: MessageSquare },
  { href: '/profile', label: 'Perfil', Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-surface-800 border-t border-slate-700 z-40 md:hidden"
      aria-label="Navegación principal"
    >
      <div className="flex">
        {navItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors
                min-h-[56px] ${
                  isActive
                    ? 'text-primary-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
