'use client';

import { useState, useCallback } from 'react';
import { Play, RotateCcw, ChevronRight } from 'lucide-react';
import type { LessonExercise } from '@senatic/shared';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Console } from '@/components/editor/Console';
import { TestRunner } from './TestRunner';
import { HintSystem } from './HintSystem';
import { runInSandbox, TestResult } from '@/lib/sandbox';

interface ExercisePanelProps {
  exercise: LessonExercise;
  xpReward: number;
  onComplete: (passed: boolean, hintsUsed: number) => Promise<void>;
  isCompleted?: boolean;
}

export function ExercisePanel({ exercise, xpReward, onComplete, isCompleted }: ExercisePanelProps) {
  const [code, setCode] = useState(exercise.starterCode);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const allPassed = testResults.length > 0 && testResults.every((r) => r.passed);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setOutput([]);
    setError(null);
    setTestResults([]);

    const result = await runInSandbox({ code, tests: exercise.tests });

    setOutput(result.output);
    setError(result.error);
    setTestResults(result.testResults);
    setIsRunning(false);
  }, [code, exercise.tests]);

  const handleReset = () => {
    setCode(exercise.starterCode);
    setOutput([]);
    setError(null);
    setTestResults([]);
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    await onComplete(allPassed, hintsUsed);
  };

  return (
    <div className="space-y-4">
      {/* Consigna */}
      <div className="card">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Tu desafío
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
          {exercise.prompt}
        </p>
        <div className="mt-2 flex items-center gap-1 text-xs text-xp-DEFAULT">
          <span>Recompensa:</span>
          <span className="font-bold">+{xpReward} XP</span>
          {hintsUsed > 0 && <span className="text-slate-500">(reducido por pistas)</span>}
        </div>
      </div>

      {/* Editor */}
      <CodeEditor value={code} onChange={setCode} readOnly={isCompleted} />

      {/* Controles */}
      <div className="flex gap-2">
        <button
          onClick={handleRun}
          disabled={isRunning || isCompleted}
          className="flex items-center gap-2 btn-primary flex-1"
          aria-label="Ejecutar código"
        >
          <Play className="w-4 h-4" />
          {isRunning ? 'Ejecutando...' : 'Ejecutar'}
        </button>

        <button
          onClick={handleReset}
          className="p-3 border border-slate-700 rounded-lg text-slate-400 hover:text-white
                     hover:border-slate-500 transition-colors"
          aria-label="Reiniciar código"
          title="Reiniciar al código inicial"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Consola */}
      <Console lines={output.map((t) => ({ text: t }))} error={error} isEmpty />

      {/* Tests */}
      <TestRunner
        tests={exercise.tests}
        results={testResults}
        isRunning={isRunning}
      />

      {/* Pistas */}
      <HintSystem hints={exercise.hints} onHintUsed={setHintsUsed} />

      {/* Botón de entrega */}
      {allPassed && !submitted && !isCompleted && (
        <button
          onClick={handleSubmit}
          className="w-full flex items-center justify-center gap-2 py-3 px-6
                     bg-success-DEFAULT hover:bg-success-500 text-white font-semibold
                     rounded-lg transition-colors duration-200 animate-bounce-in"
        >
          ¡Enviar y ganar XP!
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {isCompleted && (
        <div className="card text-center">
          <p className="text-success-400 font-semibold">✅ Lección completada</p>
          <p className="text-xs text-slate-500 mt-1">Puedes seguir practicando el código</p>
        </div>
      )}
    </div>
  );
}
