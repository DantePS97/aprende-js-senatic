'use client';

import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { RunChallengeResponse, SubmitChallengeResponse } from '@senatic/shared';

type AnyResult = RunChallengeResponse | SubmitChallengeResponse;

interface TestResultsPanelProps {
  result: AnyResult | null;
  loading: boolean;
  mode: 'run' | 'submit';
}

export function TestResultsPanel({ result, loading, mode }: TestResultsPanelProps) {
  if (loading) {
    return (
      <div className="card flex items-center justify-center gap-3 py-8 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">
          {mode === 'run' ? 'Ejecutando código...' : 'Evaluando solución...'}
        </span>
      </div>
    );
  }

  if (!result) return null;

  const xpAwarded = 'xpAwarded' in result ? result.xpAwarded : 0;
  const hintsUsed = 'hintsUsed' in result ? result.hintsUsed : 0;

  return (
    <div className="card space-y-3">
      <div className={`flex items-center gap-2 font-semibold ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
        {result.passed ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <XCircle className="w-5 h-5" />
        )}
        <span>
          {result.testsPassedCount} / {result.totalTests} tests pasaron
        </span>
        {mode === 'submit' && result.passed && xpAwarded > 0 && (
          <span className="ml-auto text-xs font-medium text-primary-400">
            +{xpAwarded} XP{hintsUsed > 0 ? ` (−${hintsUsed === 1 ? '25' : '50'}% por pistas)` : ''}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {result.testResults.map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {r.passed ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span className={r.passed ? 'text-slate-400' : 'text-slate-300'}>
              {r.description ?? `Test ${i + 1}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
