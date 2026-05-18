'use client';

import { useEffect, useState } from 'react';
import { Swords } from 'lucide-react';
import { challengesService } from '@/services/challengesService';
import { UnlockGate } from '@/components/challenges/UnlockGate';
import { ChallengeGrid, SkeletonCard } from '@/components/challenges/ChallengeGrid';
import type { ChallengeListItem, UnlockStatus } from '@senatic/shared';

export default function RetosPage() {
  const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    challengesService
      .list()
      .then(({ challenges: items, unlockStatus: status }) => {
        setChallenges(items);
        setUnlockStatus(status);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Swords className="w-6 h-6 text-primary-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Retos</h1>
          <p className="text-slate-400 text-sm">Problemas de la vida real para aplicar lo aprendido</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : unlockStatus ? (
        <UnlockGate unlocked={unlockStatus.unlocked}>
          <ChallengeGrid items={challenges} />
        </UnlockGate>
      ) : null}
    </div>
  );
}
