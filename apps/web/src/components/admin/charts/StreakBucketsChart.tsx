'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { StreakBucket } from '@senatic/shared';

interface StreakBucketsChartProps {
  data: StreakBucket[];
}

export function StreakBucketsChart({ data }: StreakBucketsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-slate-500 text-sm">
        Sin datos de racha disponibles
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
          formatter={(v: number) => [v, 'Usuarios']}
        />
        <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Usuarios" />
      </BarChart>
    </ResponsiveContainer>
  );
}
