'use client';

import { useChallengesStore } from '@/store/challengesStore';

const DIFFICULTY_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'facil', label: 'Fácil' },
  { value: 'medio', label: 'Medio' },
  { value: 'dificil', label: 'Difícil' },
] as const;

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'resueltos', label: 'Resueltos' },
  { value: 'pendientes', label: 'Pendientes' },
] as const;

export function ChallengeFilterBar() {
  const { difficultyFilter, statusFilter, setDifficultyFilter, setStatusFilter } = useChallengesStore();

  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-medium">Dificultad:</span>
        <div className="flex gap-1">
          {DIFFICULTY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setDifficultyFilter(value)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                difficultyFilter === value
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-medium">Estado:</span>
        <div className="flex gap-1">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                statusFilter === value
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
