'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useProgressStore } from '@/store/progressStore';
import { XPBar } from '@/components/gamification/XPBar';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { api } from '@/lib/api';
import type { Course } from '@senatic/shared';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, fetchStats } = useProgressStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    fetchStats();
    api
      .get('/courses')
      .then(({ data }) => setCourses(data.data))
      .catch(() => {})
      .finally(() => setLoadingCourses(false));
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          ¡Hola, {user?.displayName?.split(' ')[0] ?? 'estudiante'}! 👋
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

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-700">
          <div className="text-center">
            <StreakCounter streak={displayStats.streak} />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-400">{displayStats.completedLessons}</p>
            <p className="text-xs text-slate-500">lecciones</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success-DEFAULT">{displayStats.percentageComplete}%</p>
            <p className="text-xs text-slate-500">completado</p>
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
            {courses.map((course) => (
              <Link
                key={course._id}
                href={`/courses/${course._id}`}
                className="card flex items-center gap-4 hover:border-primary-500/50 transition-colors group"
              >
                <div className="text-3xl">{course.iconEmoji}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-400 truncate">{course.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400">
                      {course.level === 'basic' ? 'Básico' : 'Intermedio'}
                    </span>
                    <span className="text-xs text-slate-500">{course.totalLessons} lecciones</span>
                  </div>
                </div>
                <span className="text-slate-600 group-hover:text-primary-400 transition-colors">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
