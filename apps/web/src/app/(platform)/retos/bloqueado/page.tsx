'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { challengesService } from '@/services/challengesService';
import { LockedChallengesView } from '@/components/challenges/LockedChallengesView';
import type { UnlockStatus } from '@senatic/shared';

export default function RetosBlockedPage() {
  const router = useRouter();
  const [status, setStatus] = useState<UnlockStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    challengesService
      .unlockStatus()
      .then((s) => {
        if (s.unlocked) {
          router.replace('/retos');
          return;
        }
        setStatus(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-4 animate-pulse">
        <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto" />
        <div className="h-6 bg-slate-700 rounded w-1/2 mx-auto" />
        <div className="card h-24" />
      </div>
    );
  }

  if (!status) return null;

  return <LockedChallengesView status={status} />;
}
