'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, Activity, BookOpen, Dumbbell, Filter, Map } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin/analytics',           label: 'Resumen',    icon: BarChart2 },
  { href: '/admin/analytics/retention', label: 'Retención',  icon: Activity },
  { href: '/admin/analytics/lessons',   label: 'Lecciones',  icon: BookOpen },
  { href: '/admin/analytics/exercises', label: 'Ejercicios', icon: Dumbbell },
  { href: '/admin/analytics/funnel',    label: 'Embudo',     icon: Filter },
  { href: '/admin/analytics/heatmap',   label: 'Heatmap',    icon: Map },
];

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-full bg-surface-900 rounded-xl p-6 space-y-6">
      <nav className="flex flex-wrap gap-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-800 text-slate-400 hover:text-slate-200 border border-transparent hover:border-primary-500/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
