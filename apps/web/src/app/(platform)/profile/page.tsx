'use client';

import { useEffect, useState } from 'react';
import { LogOut, Trophy, Flame, Star, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProgressStore } from '@/store/progressStore';
import { PersonalizationSection } from '@/components/profile/PersonalizationSection';
import { XPBar } from '@/components/gamification/XPBar';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { api } from '@/lib/api';
import type { UserAchievement } from '@senatic/shared';

const LEVEL_TITLES = ['', 'Aprendiz', 'Explorador', 'Programador', 'Desarrollador', 'Experto'];
const LEVEL_COLORS = ['', 'text-slate-400', 'text-primary-400', 'text-xp-DEFAULT', 'text-success-DEFAULT', 'text-purple-400'];

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { stats, fetchStats } = useProgressStore();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<UserAchievement['achievement'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    Promise.all([
      api.get('/achievements/me'),
      api.get('/achievements'),
    ])
      .then(([earnedRes, allRes]) => {
        setAchievements(earnedRes.data.data);
        setAllAchievements(allRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchStats]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const earnedKeys = new Set(achievements.map((a) => a.achievement.key));
  const level = user.level ?? 1;
  const xp = user.xp ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header perfil */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Mi perfil</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-400 transition-colors px-3 py-2"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>

      {/* Tarjeta de usuario */}
      <div className="card space-y-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-primary-500/20 border-2 border-primary-500/40
                          flex items-center justify-center text-2xl shrink-0">
            {user.displayName?.[0]?.toUpperCase() ?? '?'}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{user.displayName}</h2>
            <p className="text-sm text-slate-400 truncate">{user.email}</p>
            <p className={`text-xs font-semibold mt-0.5 ${LEVEL_COLORS[level] ?? 'text-slate-400'}`}>
              Nivel {level} — {LEVEL_TITLES[level] ?? 'Experto'}
            </p>
          </div>
        </div>

        <XPBar xp={xp} level={level} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            icon: <Flame className="w-5 h-5 text-xp-DEFAULT" />,
            value: <StreakCounter streak={user.streak ?? 0} compact />,
            label: 'Racha',
          },
          {
            icon: <BookOpen className="w-5 h-5 text-primary-400" />,
            value: <span className="text-xl font-bold text-white">{stats?.completedLessons ?? 0}</span>,
            label: 'Lecciones',
          },
          {
            icon: <Trophy className="w-5 h-5 text-success-DEFAULT" />,
            value: <span className="text-xl font-bold text-white">{achievements.length}</span>,
            label: 'Logros',
          },
        ].map((stat, i) => (
          <div key={i} className="card flex flex-col items-center gap-1 py-3">
            {stat.icon}
            {stat.value}
            <span className="text-xs text-slate-500">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Logros */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Logros</h2>
          <span className="text-xs text-slate-500">
            {achievements.length} / {allAchievements.length} desbloqueados
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card animate-pulse h-20 bg-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {allAchievements.map((achievement) => {
              const isEarned = earnedKeys.has(achievement.key);
              const earnedAt = achievements.find((a) => a.achievement.key === achievement.key)?.earnedAt;

              return (
                <div
                  key={achievement.key}
                  className={`card flex gap-3 items-start transition-opacity ${
                    isEarned ? '' : 'opacity-35'
                  }`}
                >
                  <span className="text-2xl shrink-0">{isEarned ? achievement.iconEmoji : '🔒'}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${isEarned ? 'text-white' : 'text-slate-500'}`}>
                      {achievement.title}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2">{achievement.description}</p>
                    {isEarned && earnedAt && (
                      <p className="text-xs text-primary-400 mt-1">
                        {new Date(earnedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Personalización */}
      <PersonalizationSection />
    </div>
  );
}
