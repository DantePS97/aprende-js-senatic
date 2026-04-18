'use client';

import type { FunnelStage } from '@senatic/shared';

interface FunnelChartProps {
  data: FunnelStage[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">
        Sin datos de embudo disponibles
      </div>
    );
  }

  const maxCount = data[0]?.count ?? 1;

  return (
    <div className="flex flex-col gap-2 py-2">
      {data.map((stage, i) => {
        const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
        return (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{stage.stage}</span>
              <span className="font-mono">
                {stage.count.toLocaleString()}
                {i > 0 && stage.dropoffRate > 0 && (
                  <span className="text-red-400 ml-2">
                    −{Math.round(stage.dropoffRate * 100)}%
                  </span>
                )}
              </span>
            </div>
            <div className="h-7 bg-surface-700 rounded-lg overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-lg transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
