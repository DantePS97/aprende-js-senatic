'use client';

import { useEffect } from 'react';
import type { ChallengeListItem } from '@senatic/shared';
import { useChallengesStore } from '@/store/challengesStore';
import { ChallengeFilterBar } from './ChallengeFilterBar';
import { ChallengeCard } from './ChallengeCard';

function SkeletonCard() {
  return (
    <div className="card animate-pulse h-32">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 bg-slate-700 rounded-full" />
      </div>
      <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
      <div className="h-4 bg-slate-700 rounded w-1/2" />
    </div>
  );
}

export function ChallengeGrid({ items }: { items: ChallengeListItem[] }) {
  const { difficultyFilter, statusFilter, solvedChallengeIds, setItems } = useChallengesStore();

  useEffect(() => {
    setItems(items);
  }, [items, setItems]);

  const filtered = items.filter((item) => {
    if (difficultyFilter !== 'todos' && item.difficulty !== difficultyFilter) return false;
    if (statusFilter === 'resueltos' && !solvedChallengeIds.has(item._id)) return false;
    if (statusFilter === 'pendientes' && solvedChallengeIds.has(item._id)) return false;
    return true;
  });

  if (items.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-500">No hay retos publicados aún.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ChallengeFilterBar />

      {filtered.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-slate-500">No hay retos con esos filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <ChallengeCard key={item._id} item={{ ...item, isSolved: solvedChallengeIds.has(item._id) }} />
          ))}
        </div>
      )}
    </div>
  );
}

export { SkeletonCard };
