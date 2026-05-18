'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { TestCase } from '@senatic/shared';

interface TestCaseListProps {
  value: TestCase[];
  onChange: (next: TestCase[]) => void;
}

const emptyCase = (): TestCase => ({
  input: '',
  expectedOutput: '',
  hidden: false,
});

export function TestCaseList({ value, onChange }: TestCaseListProps) {
  const update = (i: number, patch: Partial<TestCase>) => {
    onChange(value.map((tc, idx) => (idx === i ? { ...tc, ...patch } : tc)));
  };

  const remove = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  const add = () => {
    if (value.length >= 20) return;
    onChange([...value, emptyCase()]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Casos de prueba <span className="text-gray-400">({value.length}/20)</span>
        </span>
        <button
          type="button"
          onClick={add}
          disabled={value.length >= 20}
          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary-50 text-primary-700
                     rounded-lg hover:bg-primary-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar test
        </button>
      </div>

      {value.length === 0 && (
        <p className="text-sm text-gray-400 py-3 text-center">Agrega al menos un caso de prueba.</p>
      )}

      {value.map((tc, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Test {i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={value.length <= 1}
              className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Input (argumento JS)
              </label>
              <input
                type="text"
                value={tc.input}
                onChange={(e) => update(i, { input: e.target.value })}
                placeholder='Ej: 50000 ó "hola mundo"'
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Output esperado
              </label>
              <input
                type="text"
                value={tc.expectedOutput}
                onChange={(e) => update(i, { expectedOutput: e.target.value })}
                placeholder="Ej: 5000"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Descripción (opcional, visible si falla)
              </label>
              <input
                type="text"
                value={tc.description ?? ''}
                onChange={(e) => update(i, { description: e.target.value || undefined })}
                placeholder="Ej: Cuenta redonda"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tc.hidden}
                  onChange={(e) => update(i, { hidden: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Test oculto
              </label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
