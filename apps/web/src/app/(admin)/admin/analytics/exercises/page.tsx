'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { AlertTriangle, CheckCircle2, HelpCircle, RotateCcw } from 'lucide-react';
import type { ExerciseAnalyticsItem } from '@senatic/shared';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function passRateColor(rate: number): string {
  if (rate >= 0.7) return '#22c55e'; // green
  if (rate >= 0.4) return '#f59e0b'; // amber
  return '#ef4444';                  // red
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

// ─── Chart ────────────────────────────────────────────────────────────────────

function ExerciseBarChart({ data }: { data: ExerciseAnalyticsItem[] }) {
  const chartData = data.map((ex) => ({
    name: ex.exerciseTitle.length > 18 ? ex.exerciseTitle.slice(0, 16) + '…' : ex.exerciseTitle,
    fullName: ex.exerciseTitle,
    passRate: Math.round(ex.passRate * 100),
    avgAttempts: ex.avgAttempts,
    color: passRateColor(ex.passRate),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 4 }}
          formatter={(value: number, _name: string, props: any) => [
            `${value}% aprobación`,
            props.payload.fullName,
          ]}
          labelFormatter={() => ''}
        />
        <ReferenceLine y={70} stroke="#6366f1" strokeDasharray="4 2" label={{ value: 'Meta 70%', fill: '#818cf8', fontSize: 10 }} />
        <Bar dataKey="passRate" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function ExerciseRow({ ex }: { ex: ExerciseAnalyticsItem }) {
  const rate = ex.passRate;
  const pill =
    rate >= 0.7
      ? 'bg-green-50 text-green-700'
      : rate >= 0.4
      ? 'bg-amber-50 text-amber-700'
      : 'bg-red-50 text-red-700';

  const Icon = rate >= 0.7 ? CheckCircle2 : AlertTriangle;

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-400 font-mono">#{ex.exerciseIndex + 1}</td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-gray-900">{ex.exerciseTitle}</p>
        <p className="text-xs text-gray-400 truncate max-w-xs">{ex.lessonTitle}</p>
      </td>
      <td className="px-4 py-3 text-sm text-center text-gray-600">{ex.totalStudents}</td>
      <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{ex.passedStudents}</td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${pill}`}>
          <Icon className="w-3 h-3" />
          {pct(rate)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-center text-gray-600">
        <div className="flex items-center justify-center gap-1">
          <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
          {ex.avgAttempts}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-center">
        <div className={`flex items-center justify-center gap-1 ${ex.avgHints > 1 ? 'text-orange-500' : 'text-gray-400'}`}>
          <HelpCircle className="w-3.5 h-3.5" />
          {ex.avgHints}
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsExercisesPage() {
  const { exercises, fetchExercises } = useAnalyticsStore();
  const [selectedLesson, setSelectedLesson] = useState<string>('');

  useEffect(() => { fetchExercises(); }, []);

  // Lessons available for filter dropdown
  const lessonOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const ex of exercises.data?.exercises ?? []) {
      if (!seen.has(ex.lessonId)) seen.set(ex.lessonId, ex.lessonTitle);
    }
    return [...seen.entries()].map(([id, title]) => ({ id, title }));
  }, [exercises.data]);

  const filtered = useMemo(() => {
    const all = exercises.data?.exercises ?? [];
    if (!selectedLesson) return all;
    return all.filter((ex) => ex.lessonId === selectedLesson);
  }, [exercises.data, selectedLesson]);

  const chartData = useMemo(
    () => (selectedLesson ? filtered : filtered.slice(0, 20)),
    [filtered, selectedLesson],
  );

  // Summary stats
  const worst = useMemo(
    () => [...filtered].sort((a, b) => a.passRate - b.passRate).slice(0, 3),
    [filtered],
  );

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: 'Analytics', href: '/admin/analytics' },
          { label: 'Ejercicios' },
        ]}
      />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Análisis de ejercicios</h1>
          <p className="text-sm text-slate-400 mt-1">
            Tasa de aprobación, intentos y uso de pistas por ejercicio
          </p>
        </div>

        {/* Filtro por lección */}
        <select
          value={selectedLesson}
          onChange={(e) => setSelectedLesson(e.target.value)}
          className="text-sm border border-gray-600 rounded-lg px-3 py-2 bg-surface-800 text-slate-200
                     focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[220px]"
        >
          <option value="">Todas las lecciones</option>
          {lessonOptions.map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </div>

      {exercises.error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
          {exercises.error}
        </div>
      )}

      {/* Sin datos todavía */}
      {!exercises.loading && filtered.length === 0 && (
        <div className="bg-surface-800 border border-surface-700 rounded-xl p-10 text-center">
          <p className="text-slate-400 text-sm">
            {exercises.data
              ? 'No hay datos de ejercicios todavía. Los datos se registran cuando los estudiantes ejecutan código.'
              : 'Cargando…'}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          {/* Ejercicios críticos */}
          {worst.some((ex) => ex.passRate < 0.5) && (
            <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Ejercicios con baja aprobación (&lt;50%)
              </p>
              <div className="flex flex-wrap gap-3">
                {worst.filter((ex) => ex.passRate < 0.5).map((ex) => (
                  <div key={`${ex.lessonId}-${ex.exerciseIndex}`}
                    className="bg-red-900/30 border border-red-800/40 rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-red-300">{ex.exerciseTitle}</p>
                    <p className="text-xs text-red-400/70">{ex.lessonTitle}</p>
                    <p className="text-lg font-black text-red-400">{pct(ex.passRate)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráfica */}
          <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">
              Tasa de aprobación por ejercicio
              {selectedLesson && lessonOptions.find((l) => l.id === selectedLesson)
                ? ` — ${lessonOptions.find((l) => l.id === selectedLesson)?.title}`
                : ''}
            </h2>
            {exercises.loading ? (
              <div className="h-[280px] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ExerciseBarChart data={chartData} />
            )}
            <div className="flex items-center gap-6 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> ≥70% (ok)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> 40–70% (revisar)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> &lt;40% (crítico)</span>
            </div>
          </div>

          {/* Tabla detalle */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">
                Detalle por ejercicio
                <span className="ml-2 text-gray-400 font-normal">({filtered.length})</span>
              </p>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Ejercicio</th>
                  <th className="px-4 py-3 text-center">Estudiantes</th>
                  <th className="px-4 py-3 text-center">Aprobaron</th>
                  <th className="px-4 py-3 text-center">Tasa</th>
                  <th className="px-4 py-3 text-center">Avg intentos</th>
                  <th className="px-4 py-3 text-center">Avg pistas</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ex) => (
                  <ExerciseRow key={`${ex.lessonId}-${ex.exerciseIndex}`} ex={ex} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
