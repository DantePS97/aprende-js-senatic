'use client';

import { useEffect, useState } from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { TierBadge } from '@/components/gamification/TierBadge';
import { LeagueSummaryCard } from '@/components/gamification/LeagueSummaryCard';
import type { WeeklyLeagueEntry, WeeklyLeagueResponse, UserLeagueStatus, Tier } from '@senatic/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AllTimeEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  xp: number;
}

interface AllTimeData {
  rankings: AllTimeEntry[];
  currentUser: AllTimeEntry | null;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center
                    text-xs font-bold text-primary-400 shrink-0">
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

// ─── EntryRow (semanal) ───────────────────────────────────────────────────────

function EntryRow({ entry, isCurrentUser }: { entry: WeeklyLeagueEntry; isCurrentUser: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        isCurrentUser
          ? 'bg-primary-500/10 border border-primary-500/30'
          : 'bg-slate-800/50'
      }`}
    >
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

// ─── AllTimeRow ───────────────────────────────────────────────────────────────

function AllTimeRow({ entry, isCurrentUser }: { entry: AllTimeEntry; isCurrentUser: boolean }) {
  const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        isCurrentUser
          ? 'bg-primary-500/10 border border-primary-500/30'
          : 'bg-slate-800/50'
      }`}
    >
      <div className="w-7 text-center shrink-0">
        {medal ? (
          <span className="text-base">{medal}</span>
        ) : (
          <span className="text-sm font-bold text-slate-500">#{entry.rank}</span>
        )}
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
          {entry.xp.toLocaleString('es-CO')} XP
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatWeek(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Date(iso + 'T00:00:00Z').toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'weekly' | 'alltime';

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('weekly');

  const [leagueData, setLeagueData] = useState<WeeklyLeagueResponse | null>(null);
  const [myStatus, setMyStatus]     = useState<UserLeagueStatus | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyError, setWeeklyError]     = useState(false);

  const [allTimeData, setAllTimeData]       = useState<AllTimeData | null>(null);
  const [allTimeLoading, setAllTimeLoading] = useState(false);
  const [allTimeError, setAllTimeError]     = useState(false);

  // Fetch weekly on mount
  useEffect(() => {
    Promise.all([
      api.get('/leagues/weekly'),
      api.get('/leagues/current'),
    ])
      .then(([weeklyRes, currentRes]) => {
        setLeagueData(weeklyRes.data.data);
        setMyStatus(currentRes.data.data);
      })
      .catch(() => setWeeklyError(true))
      .finally(() => setWeeklyLoading(false));
  }, []);

  // Fetch all-time lazily when tab is first selected
  useEffect(() => {
    if (tab !== 'alltime' || allTimeData || allTimeLoading) return;
    setAllTimeLoading(true);
    api.get('/leaderboard/alltime')
      .then((res) => setAllTimeData(res.data.data))
      .catch(() => setAllTimeError(true))
      .finally(() => setAllTimeLoading(false));
  }, [tab, allTimeData, allTimeLoading]);

  const currentUserId = user?._id;
  const weeklyIsEmpty =
    leagueData &&
    leagueData.gold.length === 0 &&
    leagueData.silver.length === 0 &&
    leagueData.bronze.length === 0;

  // Current user not in top 100 — show pinned at bottom
  const showAllTimePinned =
    allTimeData?.currentUser &&
    !allTimeData.rankings.some((e) => e.userId === currentUserId);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-xp-DEFAULT" />
          <h1 className="text-2xl font-bold text-white">
            {tab === 'weekly' ? 'Ligas semanales' : 'Ranking global'}
          </h1>
        </div>
        {tab === 'weekly' && leagueData && (
          <p className="text-sm text-slate-400 mt-0.5">
            {formatWeek(leagueData.weekStart, leagueData.weekEnd)}
          </p>
        )}
        {tab === 'alltime' && (
          <p className="text-sm text-slate-400 mt-0.5">XP total acumulado — sin límite de tiempo</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1">
        {(['weekly', 'alltime'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t
                ? 'bg-primary-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'weekly' ? 'Semanal' : 'Global'}
          </button>
        ))}
      </div>

      {/* ── Weekly tab ── */}
      {tab === 'weekly' && (
        <>
          <LeagueSummaryCard status={myStatus} loading={weeklyLoading} />

          {weeklyLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
            </div>
          ) : weeklyError ? (
            <div className="card text-center py-10">
              <p className="text-slate-500">No se pudo cargar las ligas. Intenta de nuevo.</p>
            </div>
          ) : weeklyIsEmpty ? (
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
        </>
      )}

      {/* ── All-time tab ── */}
      {tab === 'alltime' && (
        <>
          {allTimeLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
            </div>
          ) : allTimeError ? (
            <div className="card text-center py-10">
              <p className="text-slate-500">No se pudo cargar el ranking global. Intenta de nuevo.</p>
            </div>
          ) : !allTimeData || allTimeData.rankings.length === 0 ? (
            <div className="card text-center py-10 space-y-2">
              <Trophy className="w-10 h-10 text-slate-700 mx-auto" />
              <p className="text-slate-500">Nadie ha ganado XP aún.</p>
              <p className="text-xs text-slate-600">¡Completa tu primera lección para aparecer aquí!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allTimeData.rankings.map((entry) => (
                <AllTimeRow
                  key={entry.userId}
                  entry={entry}
                  isCurrentUser={entry.userId === currentUserId}
                />
              ))}

              {/* Usuario fuera del top 100 — anclado al fondo */}
              {showAllTimePinned && (
                <>
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 border-t border-slate-700 border-dashed" />
                    <span className="text-xs text-slate-600">tu posición</span>
                    <div className="flex-1 border-t border-slate-700 border-dashed" />
                  </div>
                  <AllTimeRow
                    entry={allTimeData.currentUser!}
                    isCurrentUser
                  />
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
