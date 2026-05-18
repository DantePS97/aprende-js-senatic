'use client';

import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { SubmitChallengeResponse } from '@senatic/shared';

interface TestResultsPanelProps {
  result: SubmitChallengeResponse | null;
  submitting: boolean;
}

export function TestResultsPanel({ result, submitting }: TestResultsPanelProps) {
  if (submitting) {
    return (
      <div className="card flex items-center justify-center gap-3 py-8 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Evaluando solución...</span>
      </div>
    );
  }

  if (!result) return null;

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
        {result.passed && result.xpAwarded > 0 && (
          <span className="ml-auto text-xs font-medium text-primary-400">+{result.xpAwarded} XP</span>
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
