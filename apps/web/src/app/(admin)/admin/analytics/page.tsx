'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { DateRangeSelector } from '@/components/admin/DateRangeSelector';
import { AnalyticsStatCard } from '@/components/admin/AnalyticsStatCard';
import { AreaChartCompletions } from '@/components/admin/charts/AreaChartCompletions';

export default function AnalyticsOverviewPage() {
  const { overview, fetchOverview } = useAnalyticsStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchOverview({
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
    });
  }, [searchParams.toString()]);

  const d = overview.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Resumen de plataforma</h1>
        <p className="text-sm text-slate-400 mt-1">Métricas generales de uso y actividad</p>
      </div>

      <DateRangeSelector />

      {overview.error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
          {overview.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsStatCard label="Usuarios totales" value={d?.totalUsers ?? '—'} />
        <AnalyticsStatCard label="Usuarios activos" value={d?.activeUsers ?? '—'} />
        <AnalyticsStatCard label="Lecciones completadas" value={d?.totalLessonsCompleted ?? '—'} />
        <AnalyticsStatCard
          label="Tasa de completación promedio"
          value={d ? `${Math.round(d.avgCompletionRate * 100)}%` : '—'}
        />
      </div>

      <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Lecciones completadas por día</h2>
        {overview.loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AreaChartCompletions data={d?.dailyCompletions ?? []} />
        )}
      </div>

      {d?.levelDistribution && (
        <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Distribución por nivel</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(d.levelDistribution).map(([level, count]) => (
              <div key={level} className="bg-surface-700 rounded-lg px-4 py-2 text-center">
                <p className="text-xs text-slate-400">Nivel {level}</p>
                <p className="text-lg font-bold text-white">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
