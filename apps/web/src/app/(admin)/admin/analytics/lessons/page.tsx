'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { DateRangeSelector } from '@/components/admin/DateRangeSelector';
import { BarChartLessons } from '@/components/admin/charts/BarChartLessons';
import { LessonsTable } from '@/components/admin/LessonsTable';

export default function AnalyticsLessonsPage() {
  const { lessons, fetchLessons } = useAnalyticsStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    fetchLessons({
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      courseId: searchParams.get('courseId') ?? undefined,
    });
  }, [searchParams.toString()]);

  const data = lessons.data?.lessons ?? [];

  const courses = Array.from(
    new Map(data.map((l) => [l.courseId, l.courseTitle])).entries(),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Rendimiento por lección</h1>
        <p className="text-sm text-slate-400 mt-1">Tasas de completación, intentos y tiempos</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <DateRangeSelector />
        {courses.length > 0 && (
          <select
            className="bg-surface-700 border border-surface-600 text-white rounded-lg px-3 py-1.5 text-sm"
            defaultValue={searchParams.get('courseId') ?? ''}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) params.set('courseId', e.target.value);
              else params.delete('courseId');
              router.push(`?${params.toString()}`);
            }}
          >
            <option value="">Todos los cursos</option>
            {courses.map(([id, title]) => (
              <option key={id} value={id}>{title}</option>
            ))}
          </select>
        )}
      </div>

      {lessons.error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
          {lessons.error}
        </div>
      )}

      <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Top lecciones por completación</h2>
        <BarChartLessons data={data} metric="completionRate" />
      </div>

      <LessonsTable data={data} loading={lessons.loading} />
    </div>
  );
}
