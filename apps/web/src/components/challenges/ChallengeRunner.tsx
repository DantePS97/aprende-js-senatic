'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import type { Challenge, ChallengeProgress } from '@senatic/shared';
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

export function ChallengeRunner({ challenge, initialProgress }: ChallengeRunnerProps) {
  const [code, setCode] = useState(challenge.starterCode);
  const [solved, setSolved] = useState(initialProgress?.status === 'solved');

  const { submitting, lastSubmit, setSubmitting, setLastSubmit, markSolved } = useChallengesStore();
  const { showXpGain, showLevelUp, showAchievement } = useToastStore();

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setLastSubmit(null);

    try {
      const result = await challengesService.submit(challenge.slug, { code });
      setLastSubmit(result);

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
      setLastSubmit(null);
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

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Tu solución</h2>
        <CodeEditor value={code} onChange={setCode} language="javascript" />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary-600 text-white
                   font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50
                   disabled:cursor-not-allowed transition-colors"
      >
        <Send className="w-4 h-4" />
        {submitting ? 'Evaluando...' : 'Enviar solución'}
      </button>

      <TestResultsPanel result={lastSubmit} submitting={submitting} />
    </div>
  );
}
