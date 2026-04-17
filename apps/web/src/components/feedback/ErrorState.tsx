'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

interface ErrorStateProps {
  title: string;
  description: string;
  reset: () => void;
  homeHref?: string;
  digest?: string;
}

export function ErrorState({
  title,
  description,
  reset,
  homeHref = '/courses',
  digest,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[60vh]',
        'px-6 text-center gap-4',
      )}
    >
      <AlertTriangle className="w-12 h-12 text-red-400" />
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-slate-400 text-sm mt-1">{description}</p>
        {digest && (
          <p className="text-xs text-slate-600 mt-2 font-mono">ID: {digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-sm font-medium text-white transition-colors"
        >
          Reintentar
        </button>
        <Link
          href={homeHref}
          className="px-4 py-2 bg-surface-700 hover:bg-surface-600 rounded-lg text-sm font-medium text-white transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
