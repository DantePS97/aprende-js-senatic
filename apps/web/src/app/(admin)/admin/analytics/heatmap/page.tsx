'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { DateRangeSelector } from '@/components/admin/DateRangeSelector';
import type { HeatmapCell } from '@senatic/shared';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DAY_NAMES: Record<number, string> = {
  0: 'Lunes', 1: 'Martes', 2: 'Miércoles', 3: 'Jueves',
  4: 'Viernes', 5: 'Sábado', 6: 'Domingo',
};

// ─── Heatmap cell color ───────────────────────────────────────────────────────

function cellBg(count: number, maxCount: number): string {
  if (count === 0) return 'bg-slate-800 border-slate-700';
  const ratio = count / maxCount;
  if (ratio < 0.15) return 'bg-indigo-950 border-indigo-900';
  if (ratio < 0.35) return 'bg-indigo-900 border-indigo-800';
  if (ratio < 0.55) return 'bg-indigo-700 border-indigo-600';
  if (ratio < 0.75) return 'bg-indigo-500 border-indigo-400';
  return 'bg-indigo-400 border-indigo-300';
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipState {
  day: number;
  hour: number;
  count: number;
  x: number;
  y: number;
}

// ─── Heatmap grid ─────────────────────────────────────────────────────────────

function HeatmapGrid({
  cells,
  maxCount,
}: {
  cells: HeatmapCell[];
  maxCount: number;
}) {
  const cellMap = new Map<string, number>();
  for (const c of cells) cellMap.set(`${c.day}:${c.hour}`, c.count);

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Hour labels */}
        <div className="flex ml-10 mb-1">
          {HOURS.map((h) => (
            <div
              key={h}
              className="text-center text-slate-500"
              style={{ width: 28, fontSize: 10 }}
            >
              {h % 3 === 0 ? `${h}h` : ''}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {DAYS.map((dayLabel, dayIdx) => (
          <div key={dayIdx} className="flex items-center mb-1">
            {/* Day label */}
            <span
              className="text-slate-500 shrink-0 text-right pr-2"
              style={{ width: 36, fontSize: 11 }}
            >
              {dayLabel}
            </span>

            {/* Cells */}
            {HOURS.map((hour) => {
              const count = cellMap.get(`${dayIdx}:${hour}`) ?? 0;
              return (
                <div
                  key={hour}
                  title={`${DAY_NAMES[dayIdx]} ${hour}:00 — ${count} lección${count !== 1 ? 'es' : ''}`}
                  className={`rounded-sm border cursor-default transition-opacity hover:opacity-80 ${cellBg(count, maxCount)}`}
                  style={{ width: 24, height: 20, margin: 2 }}
                />
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 ml-10">
          <span className="text-slate-500 text-xs">Menos</span>
          {['bg-slate-800', 'bg-indigo-950', 'bg-indigo-900', 'bg-indigo-700', 'bg-indigo-500', 'bg-indigo-400'].map((cls, i) => (
            <div key={i} className={`w-5 h-4 rounded-sm ${cls} border border-slate-600`} />
          ))}
          <span className="text-slate-500 text-xs">Más</span>
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function InsightCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface-700 rounded-xl p-4 border border-surface-600">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HeatmapPage() {
  const { heatmap, fetchHeatmap } = useAnalyticsStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchHeatmap({
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
    });
  }, [searchParams.toString()]);

  const d = heatmap.data;

  // Actividad por franja horaria
  const timeSlots = !d ? null : {
    madrugada: d.cells.filter((c) => c.hour >= 0 && c.hour < 6).reduce((s, c) => s + c.count, 0),
    manana: d.cells.filter((c) => c.hour >= 6 && c.hour < 12).reduce((s, c) => s + c.count, 0),
    tarde: d.cells.filter((c) => c.hour >= 12 && c.hour < 18).reduce((s, c) => s + c.count, 0),
    noche: d.cells.filter((c) => c.hour >= 18 && c.hour < 24).reduce((s, c) => s + c.count, 0),
  };

  // Actividad entre semana vs fin de semana
  const weekdayTotal = d?.cells.filter((c) => c.day < 5).reduce((s, c) => s + c.count, 0) ?? 0;
  const weekendTotal = d?.cells.filter((c) => c.day >= 5).reduce((s, c) => s + c.count, 0) ?? 0;
  const weekdayPct = d && d.totalCompletions > 0
    ? Math.round((weekdayTotal / d.totalCompletions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: 'Analytics', href: '/admin/analytics' },
          { label: 'Mapa de calor' },
        ]}
      />

      <div>
        <h1 className="text-xl font-bold text-white">Mapa de calor de actividad</h1>
        <p className="text-sm text-slate-400 mt-1">
          Cuándo estudian los alumnos — hora Colombia (UTC-5)
        </p>
      </div>

      <DateRangeSelector />

      {heatmap.error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
          {heatmap.error}
        </div>
      )}

      {heatmap.loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {d && (
        <>
          {/* Insights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <InsightCard
              label="Total de completaciones"
              value={d.totalCompletions.toLocaleString()}
              sub="en el período seleccionado"
            />
            <InsightCard
              label="Día más activo"
              value={DAY_NAMES[d.peakDay]}
              sub="mayor volumen de lecciones"
            />
            <InsightCard
              label="Hora pico"
              value={`${d.peakHour}:00 – ${d.peakHour + 1}:00`}
              sub="hora Colombia (UTC-5)"
            />
            <InsightCard
              label="Entre semana vs fin de semana"
              value={`${weekdayPct}% / ${100 - weekdayPct}%`}
              sub={`${weekdayTotal} vs ${weekendTotal} completaciones`}
            />
          </div>

          {/* Heatmap */}
          <div className="bg-surface-800 border border-surface-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-300 mb-5">
              Actividad por día × hora
            </h2>
            {d.totalCompletions === 0 ? (
              <p className="text-slate-500 text-sm text-center py-10">
                Sin datos en el período seleccionado.
              </p>
            ) : (
              <HeatmapGrid cells={d.cells} maxCount={d.maxCount} />
            )}
          </div>

          {/* Franjas horarias */}
          {timeSlots && d.totalCompletions > 0 && (
            <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">
                Distribución por franja horaria
              </h2>
              <div className="space-y-3">
                {[
                  { label: '🌙 Madrugada', sublabel: '0:00 – 5:59', value: timeSlots.madrugada },
                  { label: '☀️ Mañana', sublabel: '6:00 – 11:59', value: timeSlots.manana },
                  { label: '🌤 Tarde', sublabel: '12:00 – 17:59', value: timeSlots.tarde },
                  { label: '🌆 Noche', sublabel: '18:00 – 23:59', value: timeSlots.noche },
                ].map(({ label, sublabel, value }) => {
                  const pct = d.totalCompletions > 0
                    ? Math.round((value / d.totalCompletions) * 100)
                    : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">
                          {label}
                          <span className="text-slate-500 ml-2 text-xs">{sublabel}</span>
                        </span>
                        <span className="text-slate-400 font-medium">
                          {value.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Insight pedagógico */}
              {timeSlots.noche > timeSlots.manana && (
                <div className="mt-4 bg-amber-900/20 border border-amber-700/40 rounded-lg px-4 py-3 text-sm text-amber-300">
                  💡 La mayoría del estudio ocurre en la noche — el contenido debe funcionar bien
                  sin conexión y en pantallas pequeñas.
                </div>
              )}
              {timeSlots.manana > timeSlots.noche && (
                <div className="mt-4 bg-blue-900/20 border border-blue-700/40 rounded-lg px-4 py-3 text-sm text-blue-300">
                  💡 Los estudiantes prefieren la mañana — considera enviar recordatorios matutinos.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
