'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { DateRangeSelector } from '@/components/admin/DateRangeSelector';
import { LineChartTrend } from '@/components/admin/charts/LineChartTrend';
import { AreaChartCompletions } from '@/components/admin/charts/AreaChartCompletions';
import { StreakBucketsChart } from '@/components/admin/charts/StreakBucketsChart';

export default function AnalyticsRetentionPage() {
  const { retention, fetchRetention } = useAnalyticsStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchRetention({
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
    });
  }, [searchParams.toString()]);

  const d = retention.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Retención y actividad</h1>
        <p className="text-sm text-slate-400 mt-1">Usuarios activos diarios, retención semanal y rachas</p>
      </div>

      <DateRangeSelector />

      {retention.error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
          {retention.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Usuarios activos diarios (DAU)</h2>
          {retention.loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <LineChartTrend data={d?.dailyActiveUsers ?? []} color="#6366f1" label="Usuarios activos" />
          )}
        </div>

        <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Usuarios activos semanales</h2>
          {retention.loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AreaChartCompletions data={d?.weeklyRetention ?? []} color="#22c55e" />
          )}
        </div>
      </div>

      <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Distribución de rachas</h2>
        {retention.loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <StreakBucketsChart data={d?.streakBuckets ?? []} />
        )}
      </div>
    </div>
  );
}
