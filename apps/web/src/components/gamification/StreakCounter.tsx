'use client';

import { Flame } from 'lucide-react';

interface StreakCounterProps {
  streak: number;
  compact?: boolean;
}

export function StreakCounter({ streak, compact = false }: StreakCounterProps) {
  const isActive = streak > 0;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1 ${isActive ? 'text-xp-DEFAULT' : 'text-slate-600'}`}
        title={`Racha: ${streak} días`}
      >
        <Flame className={`w-4 h-4 ${streak >= 7 ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-bold">{streak}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <Flame
        className={`w-6 h-6 ${
          streak >= 7
            ? 'text-xp-DEFAULT animate-pulse'
            : streak >= 3
            ? 'text-xp-DEFAULT'
            : streak > 0
            ? 'text-xp-DEFAULT/60'
            : 'text-slate-600'
        }`}
      />
      <span className={`text-xl font-bold ${isActive ? 'text-xp-DEFAULT' : 'text-slate-600'}`}>
        {streak}
      </span>
      <span className="text-xs text-slate-500">
        {streak === 1 ? 'día' : 'días'} seguidos
      </span>
    </div>
  );
}
