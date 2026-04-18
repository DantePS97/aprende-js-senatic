'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { DateRangeSelector } from '@/components/admin/DateRangeSelector';
import { FunnelChart } from '@/components/admin/charts/FunnelChart';
import { api } from '@/lib/api';
import { useState } from 'react';

interface CourseOption { _id: string; title: string }

export default function AnalyticsFunnelPage() {
  const { funnel, fetchFunnel } = useAnalyticsStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get('courseId') ?? '';
  const [courses, setCourses] = useState<CourseOption[]>([]);

  useEffect(() => {
    api.get('/courses').then((r) => setCourses(r.data?.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!courseId) return;
    fetchFunnel({
      courseId,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
    });
  }, [searchParams.toString()]);

  function handleCourseChange(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set('courseId', id);
    else params.delete('courseId');
    router.push(`?${params.toString()}`);
  }

  const d = funnel.data;
  const totalEnrolled = d?.stages[0]?.count ?? 0;
  const totalCompleted = d?.stages[d.stages.length - 1]?.count ?? 0;
  const overallRate = totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Embudo de conversión</h1>
        <p className="text-sm text-slate-400 mt-1">Progresión de estudiantes a través del curso</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <DateRangeSelector />
        <select
          value={courseId}
          onChange={(e) => handleCourseChange(e.target.value)}
          className="bg-surface-700 border border-surface-600 text-white rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Seleccionar curso…</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
      </div>

      {!courseId && (
        <div className="bg-surface-800 border border-surface-700 rounded-xl p-8 text-center text-slate-400 text-sm">
          Selecciona un curso para ver su embudo de conversión
        </div>
      )}

      {funnel.error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
          {funnel.error}
        </div>
      )}

      {courseId && d && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-800 border border-surface-700 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Inscritos</p>
              <p className="text-2xl font-bold text-white">{totalEnrolled.toLocaleString()}</p>
            </div>
            <div className="bg-surface-800 border border-surface-700 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Tasa de completación</p>
              <p className="text-2xl font-bold text-green-400">{overallRate}%</p>
            </div>
          </div>

          <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">{d.courseTitle}</h2>
            {funnel.loading ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <FunnelChart data={d.stages} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
