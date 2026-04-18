import { cn } from '@/lib/cn';

interface TrendProps {
  value: number;
  direction: 'up' | 'down' | 'neutral';
}

interface AnalyticsStatCardProps {
  label: string;
  value: string | number;
  trend?: TrendProps;
}

export function AnalyticsStatCard({ label, value, trend }: AnalyticsStatCardProps) {
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-5 flex flex-col gap-2">
      <p className="text-sm text-slate-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {trend && (
        <p
          className={cn(
            'text-xs font-medium',
            trend.direction === 'up' && 'text-green-400',
            trend.direction === 'down' && 'text-red-400',
            trend.direction === 'neutral' && 'text-slate-500',
          )}
        >
          {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—'}{' '}
          {Math.abs(trend.value)}%
        </p>
      )}
    </div>
  );
}
