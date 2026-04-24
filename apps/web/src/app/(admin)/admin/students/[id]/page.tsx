'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Flame, Trophy, BookOpen, Calendar, CheckCircle2, Clock, HelpCircle,
} from 'lucide-react';
import { useStudentsStore } from '@/store/studentsStore';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { LineChartTrend } from '@/components/admin/charts/LineChartTrend';
import type { StudentLessonProgress } from '@senatic/shared';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<number, string> = {
  1: 'Aprendiz', 2: 'Explorador', 3: 'Desarrollador', 4: 'Avanzado', 5: 'Experto',
};

const STATUS_STYLES: Record<StudentLessonProgress['status'], string> = {
  completed: 'text-green-600 bg-green-50',
  in_progress: 'text-amber-600 bg-amber-50',
  not_started: 'text-gray-400 bg-gray-50',
};

const STATUS_LABELS: Record<StudentLessonProgress['status'], string> = {
  completed: 'Completada',
  in_progress: 'En progreso',
  not_started: 'Sin iniciar',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ─── Progress table ───────────────────────────────────────────────────────────

function ProgressTable({ progress }: { progress: StudentLessonProgress[] }) {
  // Group by module
  const byModule = progress.reduce<Record<string, StudentLessonProgress[]>>((acc, p) => {
    const key = p.moduleTitle;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(byModule).map(([moduleName, lessons]) => (
        <div key={moduleName} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{moduleName}</p>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-medium text-gray-400 border-b border-gray-100">
                <th className="px-4 py-2">Lección</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2 text-right">XP</th>
                <th className="px-4 py-2 text-right">Intentos</th>
                <th className="px-4 py-2 text-right">Pistas</th>
                <th className="px-4 py-2 text-right">Completada</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.lessonId} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-sm text-gray-800 font-medium">
                    {lesson.lessonTitle}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[lesson.status]}`}>
                      {lesson.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                      {lesson.status === 'in_progress' && <Clock className="w-3 h-3" />}
                      {STATUS_LABELS[lesson.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold text-amber-600">
                    {lesson.xpEarned > 0 ? `+${lesson.xpEarned}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm text-gray-500">{lesson.attempts}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`inline-flex items-center gap-1 text-sm ${lesson.hintsUsed > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                      <HelpCircle className="w-3.5 h-3.5" />
                      {lesson.hintsUsed}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm text-gray-400">
                    {formatDate(lesson.completedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { profile, fetchProfile, clearProfile } = useStudentsStore();

  useEffect(() => {
    fetchProfile(id);
    return () => clearProfile();
  }, [id]);

  const d = profile.data;

  const initials = d?.displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() ?? '—';

  const pctComplete = d
    ? d.totalLessons > 0 ? Math.round((d.completedLessons / d.totalLessons) * 100) : 0
    : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <AdminBreadcrumbs
        items={[
          { label: 'Estudiantes', href: '/admin/students' },
          { label: d?.displayName ?? '…' },
        ]}
      />

      {profile.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {profile.error}
        </div>
      )}

      {profile.loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {d && (
        <>
          {/* ─── Header ─────────────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{d.displayName}</h1>
              <p className="text-sm text-gray-500 truncate">{d.email}</p>
              <span className="mt-1 inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                {LEVEL_LABELS[d.level] ?? `Nivel ${d.level}`}
              </span>
            </div>
            {/* Progress ring (simplified) */}
            <div className="text-center shrink-0">
              <div className="text-3xl font-black text-indigo-600">{pctComplete}%</div>
              <div className="text-xs text-gray-400 mt-0.5">del curso completado</div>
              <div className="text-xs text-gray-500 mt-0.5">{d.completedLessons} / {d.totalLessons} lecciones</div>
            </div>
          </div>

          {/* ─── Stats ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Trophy} label="XP total" value={d.xp.toLocaleString()} color="bg-amber-50 text-amber-600" />
            <StatCard icon={Flame} label="Racha actual" value={`${d.streak} días`} color="bg-orange-50 text-orange-500" />
            <StatCard icon={BookOpen} label="Lecciones completadas" value={d.completedLessons} color="bg-green-50 text-green-600" />
            <StatCard icon={Calendar} label="Último acceso" value={formatDate(d.lastActiveDate)} color="bg-blue-50 text-blue-600" />
          </div>

          {/* ─── Actividad diaria ───────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Actividad — últimos 30 días</h2>
            <LineChartTrend
              data={d.dailyActivity}
              color="#6366f1"
              label="Lecciones completadas"
            />
          </div>

          {/* ─── Progreso por lección ───────────────────────────────────── */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Progreso por lección</h2>
            {d.progress.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-10 text-center text-sm text-gray-400">
                Este estudiante aún no ha iniciado ninguna lección.
              </div>
            ) : (
              <ProgressTable progress={d.progress} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
