'use client';

import { useEffect, useState } from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { TierBadge } from '@/components/gamification/TierBadge';
import { LeagueSummaryCard } from '@/components/gamification/LeagueSummaryCard';
import type { WeeklyLeagueEntry, WeeklyLeagueResponse, UserLeagueStatus, Tier } from '@senatic/shared';

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center
                    text-xs font-bold text-primary-400 shrink-0">
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

// ─── EntryRow ─────────────────────────────────────────────────────────────────

function EntryRow({ entry, isCurrentUser }: { entry: WeeklyLeagueEntry; isCurrentUser: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        isCurrentUser
          ? 'bg-primary-500/10 border border-primary-500/30'
          : 'bg-slate-800/50'
      }`}
    >
      {/* Rank */}
      <div className="w-7 text-center shrink-0">
        <span className="text-sm font-bold text-slate-500">#{entry.rank}</span>
      </div>

      <Avatar name={entry.displayName} />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isCurrentUser ? 'text-primary-300' : 'text-white'}`}>
          {entry.displayName}
          {isCurrentUser && (
            <span className="ml-1.5 text-xs font-normal text-primary-500">tú</span>
          )}
        </p>
        <p className="text-xs text-slate-500">Nv. {entry.level}</p>
      </div>

      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${isCurrentUser ? 'text-primary-400' : 'text-xp-DEFAULT'}`}>
          {entry.weeklyXp} XP
        </p>
      </div>
    </div>
  );
}

// ─── TierSection ──────────────────────────────────────────────────────────────

const TIER_LABELS: Record<Tier, string> = {
  gold:   'Liga Oro',
  silver: 'Liga Plata',
  bronze: 'Liga Bronce',
};

function TierSection({
  tier,
  entries,
  currentUserId,
}: {
  tier: Tier;
  entries: WeeklyLeagueEntry[];
  currentUserId?: string;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="flex items-center gap-2 px-1">
        <TierBadge tier={tier} size="sm" />
        <span className="text-xs text-slate-500">{entries.length} participante{entries.length !== 1 ? 's' : ''}</span>
      </div>

      {entries.map((entry) => (
        <EntryRow
          key={entry.userId}
          entry={entry}
          isCurrentUser={entry.userId === currentUserId}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function formatWeek(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Date(iso + 'T00:00:00Z').toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [leagueData, setLeagueData]   = useState<WeeklyLeagueResponse | null>(null);
  const [myStatus, setMyStatus]       = useState<UserLeagueStatus | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/leagues/weekly'),
      api.get('/leagues/current'),
    ])
      .then(([weeklyRes, currentRes]) => {
        setLeagueData(weeklyRes.data.data);
        setMyStatus(currentRes.data.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const currentUserId = user?._id;
  const isEmpty =
    leagueData &&
    leagueData.gold.length === 0 &&
    leagueData.silver.length === 0 &&
    leagueData.bronze.length === 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-xp-DEFAULT" />
          <h1 className="text-2xl font-bold text-white">Ligas semanales</h1>
        </div>
        {leagueData && (
          <p className="text-sm text-slate-400 mt-0.5">
            {formatWeek(leagueData.weekStart, leagueData.weekEnd)}
          </p>
        )}
      </div>

      {/* Current user status */}
      <LeagueSummaryCard status={myStatus} loading={loading} />

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="card text-center py-10">
          <p className="text-slate-500">No se pudo cargar las ligas. Intenta de nuevo.</p>
        </div>
      ) : isEmpty ? (
        <div className="card text-center py-10 space-y-2">
          <Trophy className="w-10 h-10 text-slate-700 mx-auto" />
          <p className="text-slate-500">Nadie ha completado lecciones esta semana aún.</p>
          <p className="text-xs text-slate-600">¡Sé el primero en entrar a una liga!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(['gold', 'silver', 'bronze'] as Tier[]).map((tier) => (
            <TierSection
              key={tier}
              tier={tier}
              entries={leagueData![tier]}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
