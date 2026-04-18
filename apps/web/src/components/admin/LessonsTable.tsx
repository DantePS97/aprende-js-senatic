'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { AnalyticsLesson } from '@senatic/shared';

type SortKey = 'title' | 'completionRate' | 'totalAttempts' | 'avgTimeSeconds';
type SortDir = 'asc' | 'desc';

interface LessonsTableProps {
  data: AnalyticsLesson[];
  loading: boolean;
}

function rateClass(rate: number): string {
  if (rate >= 0.7) return 'text-green-400';
  if (rate >= 0.4) return 'text-yellow-400';
  return 'text-red-400';
}

function formatTime(s: number): string {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function LessonsTable({ data, loading }: LessonsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('completionRate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  const sorted = [...(data ?? [])].sort((a, b) => {
    const va = a[sortKey] as number | string;
    const vb = b[sortKey] as number | string;
    const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const headerCls = 'text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors';

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="ml-1 opacity-30">↕</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  if (loading) {
    return (
      <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-4 py-3 flex gap-4 border-b border-surface-700">
            <div className="h-4 bg-slate-700 rounded animate-pulse flex-1" />
            <div className="h-4 w-16 bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-16 bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-16 bg-slate-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-8 text-center text-slate-500 text-sm">
        Sin datos de lecciones para el rango seleccionado
      </div>
    );
  }

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-surface-700">
          <tr>
            <th className={headerCls} onClick={() => handleSort('title')}>
              Lección<SortIcon col="title" />
            </th>
            <th className={cn(headerCls, 'hidden md:table-cell')}>Curso</th>
            <th className={headerCls} onClick={() => handleSort('completionRate')}>
              Completación<SortIcon col="completionRate" />
            </th>
            <th className={headerCls} onClick={() => handleSort('totalAttempts')}>
              Intentos<SortIcon col="totalAttempts" />
            </th>
            <th className={cn(headerCls, 'hidden lg:table-cell')} onClick={() => handleSort('avgTimeSeconds')}>
              Tiempo prom.<SortIcon col="avgTimeSeconds" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-700">
          {sorted.map((lesson) => (
            <tr key={lesson.lessonId} className="hover:bg-surface-700 transition-colors">
              <td className="px-4 py-3 text-white font-medium max-w-xs truncate">{lesson.title}</td>
              <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{lesson.courseTitle}</td>
              <td className={cn('px-4 py-3 font-mono font-semibold', rateClass(lesson.completionRate))}>
                {Math.round(lesson.completionRate * 100)}%
              </td>
              <td className="px-4 py-3 text-slate-300">{lesson.totalAttempts}</td>
              <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                {lesson.avgTimeSeconds > 0 ? formatTime(lesson.avgTimeSeconds) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
