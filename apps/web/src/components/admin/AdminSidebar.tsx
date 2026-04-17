'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, BookOpen, Users, ClipboardList, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard, exact: true },
  { href: '/admin/courses', label: 'Cursos', Icon: BookOpen, exact: false },
  { href: '/admin/users', label: 'Usuarios', Icon: Users, exact: false },
  { href: '/admin/audit', label: 'Auditoría', Icon: ClipboardList, exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-900 flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-gray-700">
        <span className="text-white font-bold text-lg tracking-tight">
          Admin <span className="text-primary-400">Panel</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Navegación de administración">
        {navItems.map(({ href, label, Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer: user info + logout */}
      <div className="px-3 py-4 border-t border-gray-700 space-y-3">
        {user && (
          <div className="px-3 py-2">
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            <p className="text-xs text-gray-400 font-medium truncate">{user.displayName}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium
                     text-gray-400 hover:bg-gray-800 hover:text-white transition-colors min-h-[44px]"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
