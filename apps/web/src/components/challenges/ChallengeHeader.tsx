'use client';

import { Zap } from 'lucide-react';
import type { Difficulty } from '@senatic/shared';
import { DifficultyBadge } from './DifficultyBadge';
import { SolvedBadge } from './SolvedBadge';

interface ChallengeHeaderProps {
  title: string;
  difficulty: Difficulty;
  xpReward: number;
  solved: boolean;
}

export function ChallengeHeader({ title, difficulty, xpReward, solved }: ChallengeHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={difficulty} />
        <span className="flex items-center gap-1 text-xs font-medium text-primary-400">
          <Zap className="w-3.5 h-3.5" />
          {xpReward} XP
        </span>
        <SolvedBadge solved={solved} />
      </div>
      <h1 className="text-xl font-bold text-white">{title}</h1>
    </div>
  );
}
