'use client';

import { useState } from 'react';
import { Trash2, Plus, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExerciseData {
  title: string;
  prompt: string;
  startCode: string;
  tests: string;
  hints: string[];
}

interface ExerciseFieldsetProps {
  index: number;
  data: ExerciseData;
  onChange: (index: number, updated: ExerciseData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExerciseFieldset({
  index,
  data,
  onChange,
  onRemove,
  canRemove,
}: ExerciseFieldsetProps) {
  const [hintInput, setHintInput] = useState('');

  const update = (patch: Partial<ExerciseData>) => onChange(index, { ...data, ...patch });

  const addHint = () => {
    const trimmed = hintInput.trim();
    if (!trimmed || data.hints.length >= 10) return;
    update({ hints: [...data.hints, trimmed] });
    setHintInput('');
  };

  const removeHint = (hi: number) => {
    update({ hints: data.hints.filter((_, i) => i !== hi) });
  };

  const handleHintKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addHint();
    }
  };

  return (
    <fieldset className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <legend className="text-sm font-semibold text-gray-700">
          Ejercicio {index + 1}
          {data.title && (
            <span className="ml-2 text-gray-400 font-normal">— {data.title}</span>
          )}
        </legend>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`Eliminar ejercicio ${index + 1}`}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">
          Nombre del ejercicio (opcional)
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Ej: Básico, Práctica, Aplicación"
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Prompt */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">
          Enunciado del ejercicio
        </label>
        <textarea
          value={data.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          rows={2}
          placeholder="Describe qué debe hacer el estudiante..."
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm resize-y
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Starter code */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">
          Código inicial <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.startCode}
          onChange={(e) => update({ startCode: e.target.value })}
          rows={4}
          placeholder="// Código que verá el estudiante al iniciar"
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono resize-y
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Tests */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">
          Tests (JSON array) <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.tests}
          onChange={(e) => update({ tests: e.target.value })}
          rows={4}
          placeholder={'[\n  { "description": "Debe retornar 5", "expression": "suma(2, 3) === 5" }\n]'}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono resize-y
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Hints */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">
          Pistas ({data.hints.length}/10)
        </label>

        {/* Existing hints */}
        {data.hints.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.hints.map((hint, hi) => (
              <span
                key={hi}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700
                           text-xs rounded-full"
              >
                {hint}
                <button
                  type="button"
                  onClick={() => removeHint(hi)}
                  aria-label={`Eliminar pista: ${hint}`}
                  className="hover:text-indigo-900 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add hint input */}
        {data.hints.length < 10 && (
          <div className="flex gap-2">
            <input
              type="text"
              value={hintInput}
              onChange={(e) => setHintInput(e.target.value)}
              onKeyDown={handleHintKeyDown}
              placeholder="Escribe una pista y presiona Enter o +"
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addHint}
              disabled={!hintInput.trim()}
              className="px-2.5 py-1.5 text-indigo-600 bg-indigo-50 border border-indigo-200
                         rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-40"
              aria-label="Agregar pista"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </fieldset>
  );
}
