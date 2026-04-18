'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import type { AnalyticsLesson } from '@senatic/shared';

interface BarChartLessonsProps {
  data: AnalyticsLesson[];
  metric?: 'completionRate' | 'totalAttempts';
}

function rateColor(rate: number): string {
  if (rate >= 0.7) return '#22c55e';
  if (rate >= 0.4) return '#eab308';
  return '#ef4444';
}

export function BarChartLessons({ data, metric = 'completionRate' }: BarChartLessonsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-slate-500 text-sm">
        Sin datos para el rango seleccionado
      </div>
    );
  }

  const chartData = data.slice(0, 20).map((l) => ({
    title: l.title.length > 28 ? l.title.slice(0, 28) + '…' : l.title,
    value: metric === 'completionRate' ? Math.round(l.completionRate * 100) : l.totalAttempts,
    rate: l.completionRate,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis type="category" dataKey="title" width={160} tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          formatter={(v: number) => metric === 'completionRate' ? `${v}%` : v}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={metric === 'completionRate' ? rateColor(entry.rate) : '#6366f1'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
