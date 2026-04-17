'use client';

import { useEffect, useState } from 'react';
import { Trophy, Flame, BookOpen, Star, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface RankingEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  streak: number;
  weeklyXp: number;
  weeklyLessons: number;
  score: number;
}

interface LeaderboardData {
  weekStart: string;
  weekEnd: string;
  rankings: RankingEntry[];
  currentUser: RankingEntry | null;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function formatWeek(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Date(iso + 'T00:00:00Z').toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const letter = name?.[0]?.toUpperCase() ?? '?';
  const cls =
    size === 'sm'
      ? 'w-7 h-7 text-xs'
      : 'w-9 h-9 text-sm';
  return (
    <div
      className={`${cls} rounded-full bg-primary-500/20 flex items-center justify-center
                  font-bold text-primary-400 shrink-0`}
    >
      {letter}
    </div>
  );
}

function EntryRow({ entry, isCurrentUser }: { entry: RankingEntry; isCurrentUser: boolean }) {
  const medal = MEDAL[entry.rank];
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        isCurrentUser
          ? 'bg-primary-500/10 border border-primary-500/30'
          : 'bg-slate-800/50'
      }`}
    >
      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        {medal ? (
          <span className="text-lg">{medal}</span>
        ) : (
          <span className="text-sm font-bold text-slate-500">#{entry.rank}</span>
        )}
      </div>

      {/* Avatar */}
      <Avatar name={entry.displayName} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isCurrentUser ? 'text-primary-300' : 'text-white'}`}>
          {entry.displayName}
          {isCurrentUser && (
            <span className="ml-1.5 text-xs font-normal text-primary-500">tú</span>
          )}
        </p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-xp-DEFAULT" />
            {entry.streak}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {entry.weeklyLessons}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            Nv. {entry.level}
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${isCurrentUser ? 'text-primary-400' : 'text-xp-DEFAULT'}`}>
          {entry.score}
        </p>
        <p className="text-xs text-slate-600">{entry.weeklyXp} XP</p>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get('/leaderboard/weekly')
      .then(({ data: res }) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const currentUserId = user?._id;

  // Si el usuario actual está en el top 20, no duplicar su entrada al pie
  const currentUserInTop20 =
    data?.rankings.some((r) => r.userId === currentUserId) ?? false;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-xp-DEFAULT" />
          <h1 className="text-2xl font-bold text-white">Ranking semanal</h1>
        </div>
        {data && (
          <p className="text-sm text-slate-400 mt-0.5">
            {formatWeek(data.weekStart, data.weekEnd)}
          </p>
        )}
      </div>

      {/* Fórmula de puntuación */}
      <div className="flex gap-4 text-xs text-slate-500 bg-slate-800/50 rounded-xl px-4 py-2.5">
        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-xp-DEFAULT" /> XP semanal</span>
        <span>+</span>
        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> lecciones × 5</span>
        <span>+</span>
        <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-xp-DEFAULT" /> racha × 10</span>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="card text-center py-10">
          <p className="text-slate-500">No se pudo cargar el ranking. Intenta de nuevo.</p>
        </div>
      ) : !data || data.rankings.length === 0 ? (
        <div className="card text-center py-10 space-y-2">
          <Trophy className="w-10 h-10 text-slate-700 mx-auto" />
          <p className="text-slate-500">Nadie ha completado lecciones esta semana aún.</p>
          <p className="text-xs text-slate-600">¡Sé el primero en el ranking!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.rankings.map((entry) => (
            <EntryRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === currentUserId}
            />
          ))}

          {/* Usuario actual fuera del top 20 */}
          {!currentUserInTop20 && data.currentUser && (
            <>
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-xs text-slate-600">tu posición</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              <EntryRow
                entry={data.currentUser}
                isCurrentUser
              />
              {data.currentUser.score === 0 && (
                <p className="text-xs text-slate-600 text-center pt-1">
                  Completa lecciones esta semana para aparecer en el ranking
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
