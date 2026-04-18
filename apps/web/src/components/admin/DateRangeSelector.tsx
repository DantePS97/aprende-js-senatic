'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Preset = '7d' | '30d' | '90d' | 'custom';

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const PRESETS: { label: string; value: Preset; days?: number }[] = [
  { label: '7 días', value: '7d', days: 7 },
  { label: '30 días', value: '30d', days: 30 },
  { label: '90 días', value: '90d', days: 90 },
  { label: 'Personalizado', value: 'custom' },
];

export function DateRangeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initFrom = searchParams.get('from') ?? daysAgo(30);
  const initTo = searchParams.get('to') ?? today();

  const [preset, setPreset] = useState<Preset>('30d');
  const [from, setFrom] = useState(initFrom);
  const [to, setTo] = useState(initTo);
  const [rangeError, setRangeError] = useState('');

  function applyParams(f: string, t: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('from', f);
    params.set('to', t);
    router.push(`?${params.toString()}`);
  }

  function handlePreset(p: Preset, days?: number) {
    setPreset(p);
    setRangeError('');
    if (p !== 'custom' && days) {
      const f = daysAgo(days);
      const t = today();
      setFrom(f);
      setTo(t);
      applyParams(f, t);
    }
  }

  function handleApplyCustom() {
    const diff = (new Date(to).getTime() - new Date(from).getTime()) / 86400000;
    if (diff < 0) { setRangeError('La fecha de inicio debe ser anterior al fin'); return; }
    if (diff > 365) { setRangeError('El rango no puede superar 365 días'); return; }
    setRangeError('');
    applyParams(from, to);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.value}
          onClick={() => handlePreset(p.value, p.days)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            preset === p.value
              ? 'bg-primary-600 text-white'
              : 'bg-surface-700 text-slate-300 hover:bg-surface-600'
          }`}
        >
          {p.label}
        </button>
      ))}

      {preset === 'custom' && (
        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-surface-700 border border-surface-600 text-white rounded-lg px-2 py-1 text-sm"
          />
          <span className="text-slate-400 text-sm">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-surface-700 border border-surface-600 text-white rounded-lg px-2 py-1 text-sm"
          />
          <button
            onClick={handleApplyCustom}
            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Aplicar
          </button>
          {rangeError && <span className="text-red-400 text-xs">{rangeError}</span>}
        </div>
      )}
    </div>
  );
}
