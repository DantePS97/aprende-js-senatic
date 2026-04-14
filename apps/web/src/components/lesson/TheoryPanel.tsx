'use client';

import ReactMarkdown from 'react-markdown';
import type { LessonTheory } from '@senatic/shared';

interface TheoryPanelProps {
  theory: LessonTheory;
}

export function TheoryPanel({ theory }: TheoryPanelProps) {
  return (
    <div className="space-y-6">
      {/* Contenido markdown */}
      <div
        className="prose prose-invert prose-sm max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-p:text-slate-300 prose-p:leading-relaxed
          prose-code:text-primary-400 prose-code:bg-slate-800 prose-code:rounded prose-code:px-1
          prose-pre:bg-surface-900 prose-pre:border prose-pre:border-slate-700
          prose-strong:text-white
          prose-li:text-slate-300
          prose-table:text-sm
          prose-th:text-slate-300 prose-th:font-semibold prose-th:border prose-th:border-slate-700
          prose-td:text-slate-400 prose-td:border prose-td:border-slate-700"
      >
        <ReactMarkdown>{theory.markdown}</ReactMarkdown>
      </div>

      {/* Ejemplos interactivos */}
      {theory.examples.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
            Ejemplos
          </h3>
          {theory.examples.map((example, i) => (
            <div key={i} className="card">
              <pre className="text-sm text-primary-400 font-mono overflow-x-auto whitespace-pre-wrap">
                {example.code}
              </pre>
              <p className="mt-2 text-xs text-slate-500 border-t border-slate-700 pt-2">
                {example.explanation}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
