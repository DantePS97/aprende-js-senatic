'use client';

import { useState } from 'react';
import { Lightbulb, Play, Send } from 'lucide-react';
import type { Challenge, ChallengeProgress, RunChallengeResponse, SubmitChallengeResponse } from '@senatic/shared';
import { challengesService } from '@/services/challengesService';
import { useChallengesStore } from '@/store/challengesStore';
import { useToastStore } from '@/store/toastStore';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { ChallengeHeader } from './ChallengeHeader';
import { ChallengeDescription } from './ChallengeDescription';
import { TestResultsPanel } from './TestResultsPanel';

interface ChallengeRunnerProps {
  challenge: Challenge;
  initialProgress: ChallengeProgress | null;
}

type PanelState =
  | { mode: 'run'; result: RunChallengeResponse | null; loading: boolean }
  | { mode: 'submit'; result: SubmitChallengeResponse | null; loading: boolean };

export function ChallengeRunner({ challenge, initialProgress }: ChallengeRunnerProps) {
  const [code, setCode] = useState(challenge.starterCode);
  const [solved, setSolved] = useState(initialProgress?.status === 'solved');
  const [panel, setPanel] = useState<PanelState>({ mode: 'submit', result: null, loading: false });

  // ─── Hints state ───────────────────────────────────────────────────────────
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [totalHints, setTotalHints] = useState(challenge.hintsCount);
  const [hintLoading, setHintLoading] = useState(false);
  const hintsExhausted = revealedHints.length >= totalHints;

  const { submitting, setSubmitting, markSolved } = useChallengesStore();
  const { showXpGain, showAchievement } = useToastStore();

  const busy = submitting || panel.loading;

  const handleHint = async () => {
    if (hintLoading || hintsExhausted || solved) return;
    setHintLoading(true);
    try {
      const res = await challengesService.hint(challenge.slug);
      setRevealedHints((prev) => [...prev, res.hint]);
      setTotalHints(res.totalHints);
    } catch {
      // No-op — hint might already be exhausted; 409 is swallowed silently
    } finally {
      setHintLoading(false);
    }
  };

  const handleRun = async () => {
    if (busy) return;
    setPanel({ mode: 'run', result: null, loading: true });
    try {
      const result = await challengesService.run(challenge.slug, { code });
      setPanel({ mode: 'run', result, loading: false });
    } catch {
      setPanel({ mode: 'run', result: null, loading: false });
    }
  };

  const handleSubmit = async () => {
    if (busy) return;
    setSubmitting(true);
    setPanel({ mode: 'submit', result: null, loading: true });

    try {
      const result = await challengesService.submit(challenge.slug, { code });
      setPanel({ mode: 'submit', result, loading: false });

      if (result.passed && result.firstSolve) {
        setSolved(true);
        markSolved(challenge._id);
        if (result.xpAwarded > 0) showXpGain(result.xpAwarded);
        for (const achievement of result.newAchievements) {
          showAchievement(achievement);
        }
      }

      if (result.passed && !result.firstSolve) {
        setSolved(true);
      }
    } catch {
      setPanel({ mode: 'submit', result: null, loading: false });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <ChallengeHeader
        title={challenge.title}
        difficulty={challenge.difficulty}
        xpReward={challenge.xpReward}
        solved={solved}
      />

      <div className="card">
        <ChallengeDescription markdown={challenge.description} />
      </div>

      {/* ─── Hints ───────────────────────────────────────────────────────── */}
      {totalHints > 0 && (
        <div className="space-y-2">
          {revealedHints.map((hint, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-sm text-amber-300">
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span><span className="font-semibold text-amber-400">Pista {i + 1}:</span> {hint}</span>
            </div>
          ))}

          {!solved && !hintsExhausted && (
            <button
              type="button"
              onClick={handleHint}
              disabled={hintLoading || busy}
              className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              {hintLoading
                ? 'Cargando pista...'
                : revealedHints.length === 0
                  ? `Ver pista (${totalHints} disponible${totalHints !== 1 ? 's' : ''})`
                  : `Ver siguiente pista (${revealedHints.length}/${totalHints})`}
            </button>
          )}
        </div>
      )}

      {/* ─── Editor ──────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Tu solución</h2>
        <CodeEditor value={code} onChange={setCode} language="javascript" />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleRun}
          disabled={busy}
          className="flex items-center justify-center gap-2 py-3 px-5 border border-slate-600
                     text-slate-300 font-semibold rounded-xl hover:border-slate-400 hover:text-white
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play className="w-4 h-4" />
          {panel.mode === 'run' && panel.loading ? 'Ejecutando...' : 'Ejecutar'}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-primary-600 text-white
                     font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50
                     disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {panel.mode === 'submit' && panel.loading ? 'Evaluando...' : 'Enviar solución'}
        </button>
      </div>

      <TestResultsPanel
        result={panel.result}
        loading={panel.loading}
        mode={panel.mode}
      />
    </div>
  );
}
