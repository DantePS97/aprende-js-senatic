'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle, Lock, Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useProgressStore } from '@/store/progressStore';
import { XPBar } from '@/components/gamification/XPBar';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { api } from '@/lib/api';
import type { Course } from '@senatic/shared';

// ─── Local types ──────────────────────────────────────────────────────────────

interface CourseProgress {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  iconEmoji: string;
  completedLessons: number;
  totalLessons: number;
  percentageComplete: number;
}

interface LeagueStatus {
  tier: 'gold' | 'silver' | 'bronze' | null;
  weeklyXp: number;
  weekStart: string;
}

interface UserAchievement {
  achievement: {
    title: string;
    iconEmoji: string;
  };
  earnedAt: string;
}

const TIER_LABELS: Record<string, string> = {
  gold: 'Oro',
  silver: 'Plata',
  bronze: 'Bronce',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const { user } = useAuthStore();
  const { stats, fetchStats } = useProgressStore();

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [leagueStatus, setLeagueStatus] = useState<LeagueStatus | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingLeague, setLoadingLeague] = useState(true);
  const [loadingAchievements, setLoadingAchievements] = useState(true);

  useEffect(() => {
    fetchStats();

    // Courses + course progress (sequential — progress depends on courses loading first
    // only for merging, but we fetch them in parallel and merge by slug)
    api
      .get('/courses')
      .then(({ data }) => setCourses(data.data))
      .catch(() => {})
      .finally(() => setLoadingCourses(false));

    // Independent fetches — use Promise.allSettled so one failure doesn't block others
    Promise.allSettled([
      api.get('/progress/courses'),
      api.get('/leagues/current'),
      api.get('/achievements/me'),
    ]).then(([progressResult, leagueResult, achievementsResult]) => {
      if (progressResult.status === 'fulfilled') {
        setCourseProgress(progressResult.value.data.data ?? []);
      }
      if (leagueResult.status === 'fulfilled') {
        setLeagueStatus(leagueResult.value.data.data ?? null);
        setLoadingLeague(false);
      } else {
        setLoadingLeague(false);
      }
      if (achievementsResult.status === 'fulfilled') {
        setAchievements((achievementsResult.value.data.data ?? []).slice(0, 3));
        setLoadingAchievements(false);
      } else {
        setLoadingAchievements(false);
      }
    });
  }, [fetchStats]);

  const displayStats = stats ?? {
    totalXp: user?.xp ?? 0,
    level: user?.level ?? 1,
    streak: user?.streak ?? 0,
    completedLessons: 0,
    totalLessons: 0,
    percentageComplete: 0,
    lastActiveDate: new Date().toISOString(),
  };

  // Helper: find course progress by courseId
  const getProgress = (courseId: string): CourseProgress | undefined =>
    courseProgress.find((p) => p.courseId === courseId);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          ¡Hola, {user?.displayName?.split(' ')[0] ?? 'estudiante'}!
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {displayStats.completedLessons > 0
            ? `Llevas ${displayStats.completedLessons} lección${displayStats.completedLessons !== 1 ? 'es' : ''} completada${displayStats.completedLessons !== 1 ? 's' : ''}`
            : 'Comienza tu primera lección hoy'}
        </p>
      </div>

      {/* Stats card */}
      <div className="card space-y-4">
        <XPBar xp={displayStats.totalXp} level={displayStats.level} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-700">
          {/* Racha */}
          <div className="text-center">
            <StreakCounter streak={displayStats.streak} />
          </div>

          {/* Lecciones */}
          <div className="text-center">
            <BookOpen className="w-6 h-6 text-primary-400 mx-auto mb-0.5" />
            <p className="text-2xl font-bold text-primary-400">{displayStats.completedLessons}</p>
            <p className="text-xs text-slate-500">lecciones</p>
          </div>

          {/* % completado */}
          <div className="text-center">
            <CheckCircle className="w-6 h-6 text-success-DEFAULT mx-auto mb-0.5" />
            <p className="text-2xl font-bold text-success-DEFAULT">{displayStats.percentageComplete}%</p>
            <p className="text-xs text-slate-500">completado</p>
          </div>

          {/* Liga semanal */}
          <div className="text-center">
            {loadingLeague ? (
              <div className="h-10 bg-slate-700 rounded animate-pulse mx-auto w-16" />
            ) : leagueStatus ? (
              <>
                <Trophy className="w-6 h-6 text-primary-400 mx-auto mb-0.5" />
                <p className="text-sm font-bold text-primary-400">
                  {leagueStatus.tier ? TIER_LABELS[leagueStatus.tier] : '—'}
                </p>
                <p className="text-xs text-slate-500">{leagueStatus.weeklyXp} XP</p>
              </>
            ) : (
              <>
                <Trophy className="w-6 h-6 text-slate-600 mx-auto mb-0.5" />
                <p className="text-xs text-slate-500">Sin liga</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cursos */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Cursos disponibles</h2>

        {loadingCourses ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="card animate-pulse h-24 bg-slate-800" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-slate-500">No hay cursos disponibles aún.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => {
              const locked = course.isLocked ?? false;
              const progress = getProgress(course._id);
              const pct = progress?.percentageComplete ?? 0;
              const completedLessons = progress?.completedLessons ?? 0;
              const totalLessons = progress?.totalLessons ?? course.totalLessons ?? 0;

              const inner = (
                <>
                  <div className={`text-3xl ${locked ? 'opacity-40' : ''}`}>{course.iconEmoji}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold transition-colors ${locked ? 'text-slate-500' : 'text-white group-hover:text-primary-400'}`}>
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-500 truncate">{course.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${locked ? 'bg-slate-700 text-slate-500' : 'bg-primary-500/20 text-primary-400'}`}>
                        {course.level === 'basic' ? 'Básico' : 'Intermedio'}
                      </span>
                      <span className="text-xs text-slate-500">{course.totalLessons} lecciones</span>
                      {locked && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Completa el curso anterior
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {!locked && progress && (
                      <div className="mt-2 space-y-1">
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div
                            className="bg-primary-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {completedLessons}/{totalLessons} lecciones · {pct}%
                          </span>
                          {pct === 100 ? (
                            <span className="text-xs text-success-DEFAULT">✓ Completado</span>
                          ) : pct > 0 ? (
                            <span className="text-xs text-primary-400">Continuar →</span>
                          ) : (
                            <span className="text-xs text-slate-400">Empezar</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* No progress data yet — show Empezar */}
                    {!locked && !progress && (
                      <div className="mt-1">
                        <span className="text-xs text-slate-400">Empezar</span>
                      </div>
                    )}
                  </div>
                  {locked
                    ? <Lock className="w-5 h-5 text-slate-600 shrink-0" />
                    : <span className="text-slate-600 group-hover:text-primary-400 transition-colors">→</span>
                  }
                </>
              );

              return locked ? (
                <div
                  key={course._id}
                  className="card flex items-center gap-4 opacity-60 cursor-not-allowed"
                >
                  {inner}
                </div>
              ) : (
                <Link
                  key={course._id}
                  href={`/courses/${course._id}`}
                  className="card flex items-center gap-4 hover:border-primary-500/50 transition-colors group"
                >
                  {inner}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Logros recientes */}
      {!loadingAchievements && achievements.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Logros recientes</h2>
          <div className="flex gap-3 flex-wrap">
            {achievements.map((ua, i) => (
              <div
                key={i}
                className="bg-surface-800 border border-slate-700 rounded-lg px-3 py-2 text-center min-w-[80px]"
              >
                <p className="text-2xl mb-1">{ua.achievement.iconEmoji}</p>
                <p className="text-xs text-slate-400 truncate max-w-[80px]">{ua.achievement.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
