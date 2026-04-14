'use client';

import { CheckCircle2, XCircle, Circle } from 'lucide-react';
import type { TestResult } from '@/lib/sandbox';

interface TestRunnerProps {
  tests: Array<{ description: string; expression: string }>;
  results: TestResult[];
  isRunning: boolean;
}

export function TestRunner({ tests, results, isRunning }: TestRunnerProps) {
  const allPassed = results.length > 0 && results.every((r) => r.passed);
  const passedCount = results.filter((r) => r.passed).length;

  return (
    <div className="card space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-300">Pruebas automáticas</h3>
        {results.length > 0 && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              allPassed
                ? 'bg-success-DEFAULT/20 text-success-400'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            {passedCount}/{tests.length} pasadas
          </span>
        )}
      </div>

      {/* Test list */}
      <div className="space-y-1.5">
        {tests.map((test, i) => {
          const result = results[i];
          const pending = results.length === 0;

          return (
            <div
              key={i}
              className={`flex items-start gap-2.5 py-2 px-3 rounded-lg text-sm transition-colors ${
                pending
                  ? 'bg-slate-800/50'
                  : result?.passed
                  ? 'bg-success-DEFAULT/10 border border-success-DEFAULT/20'
                  : 'bg-red-950/50 border border-red-800/30'
              }`}
            >
              {isRunning ? (
                <Circle className="w-4 h-4 text-slate-500 animate-pulse mt-0.5 shrink-0" />
              ) : pending ? (
                <Circle className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
              ) : result?.passed ? (
                <CheckCircle2 className="w-4 h-4 text-success-DEFAULT mt-0.5 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              )}

              <div className="min-w-0">
                <p
                  className={
                    pending
                      ? 'text-slate-500'
                      : result?.passed
                      ? 'text-success-400'
                      : 'text-red-400'
                  }
                >
                  {test.description}
                </p>
                {result?.error && (
                  <p className="text-xs text-red-500 mt-0.5 font-mono">{result.error}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
