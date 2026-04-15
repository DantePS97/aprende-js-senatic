'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowRight } from 'lucide-react';
import type { LessonTheory } from '@senatic/shared';
import type { Components } from 'react-markdown';

interface TheoryPanelProps {
  theory: LessonTheory;
  onStartExercise?: () => void;
  exerciseCount?: number;
}

const mdComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-white mt-6 mb-3 pb-2 border-b border-slate-700">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold text-white mt-6 mb-3 pb-2 border-b border-slate-700/60">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-white mt-4 mb-2">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-slate-300 leading-relaxed mb-3">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="text-white font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-slate-200 italic">{children}</em>
  ),
  hr: () => (
    <hr className="my-5 border-slate-700" />
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary-500 bg-primary-500/10 px-4 py-3 rounded-r-lg my-4 text-slate-300">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-1 mb-3 text-slate-300 pl-2">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1 mb-3 text-slate-300 pl-2">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-slate-300 leading-relaxed">
      {children}
    </li>
  ),
  // inline code vs code block: className contains "language-xxx" only for blocks
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className="block text-sm text-slate-200 font-mono">
          {children}
        </code>
      );
    }
    return (
      <code
        className="text-primary-400 bg-slate-800 rounded px-1.5 py-0.5 text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 my-4 overflow-x-auto text-sm leading-relaxed">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-slate-700">
      <table className="w-full text-sm border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-800">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-slate-700">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-slate-800/40 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide border-b border-slate-700">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-slate-400">
      {children}
    </td>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary-400 hover:text-primary-300 underline underline-offset-2 transition-colors"
    >
      {children}
    </a>
  ),
};

export function TheoryPanel({ theory, onStartExercise, exerciseCount = 1 }: TheoryPanelProps) {
  return (
    <div className="space-y-6">
      {/* Contenido markdown */}
      <div className="min-w-0">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={mdComponents}
        >
          {theory.markdown}
        </ReactMarkdown>
      </div>

      {/* Ejemplos */}
      {theory.examples.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Ejemplos
          </h3>
          {theory.examples.map((example, i) => (
            <div key={i} className="rounded-xl border border-slate-700 overflow-hidden bg-slate-900">
              {/* header con número */}
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                <span className="text-xs font-mono text-slate-500">ejemplo {i + 1}</span>
              </div>
              {/* código */}
              <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
                <code className="text-slate-200 font-mono">{example.code}</code>
              </pre>
              {/* explicación */}
              <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700">
                <p className="text-xs text-slate-400 leading-relaxed">
                  {example.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA: ir a practicar */}
      {onStartExercise && (
        <button
          onClick={onStartExercise}
          className="w-full flex items-center justify-between px-5 py-4 rounded-xl
                     bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30
                     hover:border-primary-500/60 transition-all duration-200 group"
        >
          <div className="text-left">
            <p className="text-sm font-semibold text-primary-300 group-hover:text-primary-200 transition-colors">
              ¡Listo para practicar!
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {exerciseCount === 1
                ? '1 ejercicio te espera'
                : `${exerciseCount} ejercicios te esperan`}
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary-400 group-hover:text-primary-300 transition-colors">
            <span className="text-sm font-medium">Ir a practicar</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      )}
    </div>
  );
}
