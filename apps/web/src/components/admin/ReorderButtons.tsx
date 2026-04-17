'use client';

import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

interface ReorderButtonsProps {
  id: string;
  isFirst: boolean;
  isLast: boolean;
  onReorder: (direction: 'up' | 'down') => void;
  pending: boolean;
}

export function ReorderButtons({ id: _id, isFirst, isLast, onReorder, pending }: ReorderButtonsProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => onReorder('up')}
        disabled={isFirst || pending}
        aria-label="Mover arriba"
        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5" />
        )}
      </button>
      <button
        type="button"
        onClick={() => onReorder('down')}
        disabled={isLast || pending}
        aria-label="Mover abajo"
        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
