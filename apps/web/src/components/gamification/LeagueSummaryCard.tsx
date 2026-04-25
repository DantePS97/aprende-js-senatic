import { Star } from 'lucide-react';
import { TierBadge } from './TierBadge';
import type { UserLeagueStatus } from '@senatic/shared';

interface LeagueSummaryCardProps {
  status: UserLeagueStatus | null;
  loading: boolean;
}

export function LeagueSummaryCard({ status, loading }: LeagueSummaryCardProps) {
  if (loading) {
    return (
      <div className="card animate-pulse flex items-center gap-4 py-4">
        <div className="w-16 h-6 bg-slate-700 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-slate-700 rounded w-24" />
          <div className="h-3 bg-slate-700 rounded w-16" />
        </div>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="card flex items-center gap-4 py-4">
      {/* Tier badge or no-tier placeholder */}
      {status.tier ? (
        <TierBadge tier={status.tier} size="md" />
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
          Sin liga esta semana
        </span>
      )}

      {/* XP detail */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-sm font-semibold text-white">
          <Star className="w-3.5 h-3.5 text-xp-DEFAULT shrink-0" />
          <span>{status.weeklyXp} XP esta semana</span>
        </div>
        {!status.tier && (
          <p className="text-xs text-slate-500 mt-0.5">
            Completa lecciones para entrar en una liga
          </p>
        )}
      </div>
    </div>
  );
}
