'use client';

import { useMemo } from 'react';

interface XPBarProps {
  xp: number;
  level: number;
}

const LEVEL_THRESHOLDS = [0, 101, 301, 601, 1001];
const LEVEL_TITLES = ['Aprendiz', 'Explorador', 'Programador', 'Desarrollador', 'Experto'];

export function XPBar({ xp, level }: XPBarProps) {
  const { currentLevelXp, nextLevelXp, progress } = useMemo(() => {
    const currentMin = LEVEL_THRESHOLDS[level - 1] ?? 0;
    const nextMin = LEVEL_THRESHOLDS[level] ?? xp + 1;
    const range = nextMin - currentMin;
    const earned = xp - currentMin;
    return {
      currentLevelXp: earned,
      nextLevelXp: range,
      progress: Math.min(100, Math.round((earned / range) * 100)),
    };
  }, [xp, level]);

  const title = LEVEL_TITLES[level - 1] ?? 'Experto';
  const isMaxLevel = level >= 5;

  return (
    <div className="space-y-1">
      {/* Level + title */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-xp-DEFAULT font-bold">Nv. {level}</span>
          <span className="text-slate-500">{title}</span>
        </div>
        {!isMaxLevel && (
          <span className="text-slate-500">
            {currentLevelXp} / {nextLevelXp} XP
          </span>
        )}
        {isMaxLevel && <span className="text-xp-DEFAULT font-bold">{xp} XP total</span>}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        {!isMaxLevel && (
          <div
            className="h-full xp-gradient rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`XP: ${currentLevelXp} de ${nextLevelXp}`}
          />
        )}
        {isMaxLevel && (
          <div className="h-full xp-gradient rounded-full w-full" />
        )}
      </div>
    </div>
  );
}
