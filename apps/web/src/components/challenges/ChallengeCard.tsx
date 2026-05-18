import Link from 'next/link';
import { Lock, Zap } from 'lucide-react';
import type { ChallengeListItem } from '@senatic/shared';
import { DifficultyBadge } from './DifficultyBadge';
import { SolvedBadge } from './SolvedBadge';

export function ChallengeCard({ item }: { item: ChallengeListItem }) {
  const content = (
    <div className={`card flex flex-col gap-3 h-full transition-colors ${
      item.isUnlocked
        ? 'hover:border-primary-500/50 group'
        : 'opacity-60 cursor-not-allowed'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={item.difficulty} />
          <SolvedBadge solved={item.isSolved} />
        </div>
        {!item.isUnlocked && <Lock className="w-4 h-4 text-slate-600 shrink-0" />}
      </div>

      <h3 className={`font-semibold text-sm leading-snug ${
        item.isUnlocked ? 'text-white group-hover:text-primary-400 transition-colors' : 'text-slate-500'
      }`}>
        {item.title}
      </h3>

      <div className="mt-auto flex items-center gap-1 text-xs text-primary-400 font-medium">
        <Zap className="w-3.5 h-3.5" />
        {item.xpReward} XP
      </div>
    </div>
  );

  if (!item.isUnlocked) {
    return <div>{content}</div>;
  }

  return (
    <Link href={`/retos/${item.slug}`} className="block h-full">
      {content}
    </Link>
  );
}
