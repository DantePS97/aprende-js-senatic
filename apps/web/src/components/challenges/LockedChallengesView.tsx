'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import type { UnlockStatus } from '@senatic/shared';

export function LockedChallengesView({ status }: { status: UnlockStatus }) {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-slate-500" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">Desbloquea los Retos</h1>
        <p className="text-slate-400">
          Completa el curso <strong className="text-white">JavaScript Básico</strong> para acceder a esta sección.
        </p>
      </div>

      <div className="card space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Lecciones completadas</span>
          <span className="text-white font-medium">
            {status.completedLessons} / {status.totalLessons}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all"
            style={{ width: `${status.progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">{status.progressPercent}% completado</p>
      </div>

      <Link
        href="/courses/javascript-basico"
        className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary-600 text-white
                   font-medium rounded-xl hover:bg-primary-700 transition-colors"
      >
        Ir a JavaScript Básico →
      </Link>
    </div>
  );
}
