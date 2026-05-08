'use client';

import { useState, useCallback, useEffect } from 'react';
import { Play, RotateCcw, ChevronRight, ArrowRight, LayoutGrid, CheckCircle2, Circle } from 'lucide-react';
import type { LessonExercise } from '@senatic/shared';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Console } from '@/components/editor/Console';
import { TestRunner } from './TestRunner';
import { HintSystem } from './HintSystem';
import { runInSandbox, TestResult } from '@/lib/sandbox';
import { runHtmlSandbox, buildReactScaffold } from '@/lib/htmlSandbox';
import { api } from '@/lib/api';

// ─── Code persistence ─────────────────────────────────────────────────────────

function codeKey(lessonId: string, idx: number) {
  return `senatic_code_${lessonId}_${idx}`;
}

function loadCode(lessonId: string | undefined, idx: number, fallback: string): string {
  if (!lessonId) return fallback;
  try {
    return localStorage.getItem(codeKey(lessonId, idx)) ?? fallback;
  } catch {
    return fallback;
  }
}

function persistCode(lessonId: string | undefined, idx: number, code: string) {
  if (!lessonId) return;
  try {
    localStorage.setItem(codeKey(lessonId, idx), code);
  } catch {}
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExerciseState {
  code: string;
  output: string[];
  error: string | null;
  testResults: TestResult[];
  isRunning: boolean;
  submitted: boolean;
  passed: boolean;
  hintsUsed: number;
}

interface ExercisePanelProps {
  exercises: LessonExercise[];
  xpReward: number;
  lessonId?: string;
  onComplete: (passed: boolean, hintsUsed: number) => Promise<void>;
  isCompleted?: boolean;
  onNextLesson: () => void;
  hasNext: boolean;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeInitialState(exercise: LessonExercise, lessonId?: string, idx?: number): ExerciseState {
  return {
    code: loadCode(lessonId, idx ?? 0, exercise.starterCode),
    output: [],
    error: null,
    testResults: [],
    isRunning: false,
    submitted: false,
    passed: false,
    hintsUsed: 0,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ExerciseStepperProps {
  exercises: LessonExercise[];
  current: number;
  states: ExerciseState[];
  isCompleted: boolean | undefined;
  onSelect: (idx: number) => void;
  labelFn: (idx: number) => string;
}

function ExerciseStepper({ exercises, current, states, isCompleted, onSelect, labelFn }: ExerciseStepperProps) {
  if (exercises.length <= 1) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {exercises.map((_, idx) => {
        const done = states[idx].passed || (idx === 0 && isCompleted);
        const active = idx === current;
        return (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              whitespace-nowrap transition-all duration-150 border
              ${active
                ? 'bg-primary-500/20 border-primary-500/60 text-primary-300'
                : done
                ? 'bg-success-DEFAULT/10 border-success-DEFAULT/30 text-success-400 hover:bg-success-DEFAULT/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
              }
            `}
          >
            {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
            {labelFn(idx)}
          </button>
        );
      })}
    </div>
  );
}

interface LessonCompletionBannerProps {
  exercises: LessonExercise[];
  states: ExerciseState[];
  hasNext: boolean;
  onNextLesson: () => void;
  onSelectExercise: (idx: number) => void;
  labelFn: (idx: number) => string;
}

function LessonCompletionBanner({
  exercises,
  states,
  hasNext,
  onNextLesson,
  onSelectExercise,
  labelFn,
}: LessonCompletionBannerProps) {
  return (
    <div className="card space-y-4 animate-bounce-in">
      <div className="text-center">
        <p className="text-success-400 font-bold text-lg">¡Lección completada!</p>
        <p className="text-xs text-slate-500 mt-1">
          {hasNext ? 'Continúa con la siguiente lección' : 'Has terminado el módulo'}
        </p>
      </div>

      {exercises.length > 1 && (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-400 font-medium">Sigue practicando — ejercicios extra:</p>
          {exercises.slice(1).map((_, idx) => {
            const realIdx = idx + 1;
            const done = states[realIdx]?.passed;
            return (
              <button
                key={realIdx}
                onClick={() => onSelectExercise(realIdx)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                  border transition-colors text-left
                  ${done
                    ? 'border-success-DEFAULT/30 bg-success-DEFAULT/10 text-success-400'
                    : 'border-slate-700 hover:border-slate-500 text-slate-300 hover:bg-slate-800'
                  }
                `}
              >
                {done
                  ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                  : <Circle className="w-4 h-4 shrink-0 text-slate-500" />
                }
                {labelFn(realIdx)}
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={onNextLesson}
        className="w-full flex items-center justify-center gap-2 py-3 px-6
                   bg-primary-500 hover:bg-primary-600 text-white font-semibold
                   rounded-lg transition-colors duration-200"
      >
        {hasNext ? (
          <>Siguiente lección <ArrowRight className="w-4 h-4" /></>
        ) : (
          <>Ver mapa del curso <LayoutGrid className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ExercisePanel({
  exercises,
  xpReward,
  lessonId,
  onComplete,
  isCompleted,
  onNextLesson,
  hasNext,
}: ExercisePanelProps) {
  const [current, setCurrent] = useState(0);
  const [states, setStates] = useState<ExerciseState[]>(() =>
    exercises.map((ex, idx) => makeInitialState(ex, lessonId, idx))
  );

  useEffect(() => {
    setCurrent(0);
    setStates(exercises.map((ex, idx) => makeInitialState(ex, lessonId, idx)));
  }, [exercises, lessonId]);

  // Persist code to localStorage on every change
  useEffect(() => {
    persistCode(lessonId, current, states[current].code);
  }, [states[current].code, lessonId, current]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = states[current];
  const exercise = exercises[current];

  const [previewSrcdoc, setPreviewSrcdoc] = useState<string>(
    exercise.type === 'html' ? exercise.starterCode : ''
  );

  const mainPassed = states[0].passed || isCompleted;
  const allPassed = s.testResults.length > 0 && s.testResults.every((r) => r.passed);

  useEffect(() => {
    if (exercise.type !== 'html') return;
    const id = setTimeout(() => setPreviewSrcdoc(s.code), 400);
    return () => clearTimeout(id);
  }, [s.code, exercise.type]);

  // Preview inicial al cambiar de ejercicio
  useEffect(() => {
    if (exercise.type === 'html') {
      setPreviewSrcdoc(exercise.starterCode ?? '');
    } else if (exercise.type === 'react') {
      setPreviewSrcdoc(buildReactScaffold(exercise.starterCode ?? ''));
    } else {
      setPreviewSrcdoc('');
    }
  }, [exercise]);

  // Preview React: se actualiza 800 ms después del último keystroke
  // para no disparar la carga del CDN en cada tecla.
  useEffect(() => {
    if (exercise.type !== 'react') return;
    const id = setTimeout(() => {
      setPreviewSrcdoc(buildReactScaffold(s.code));
    }, 800);
    return () => clearTimeout(id);
  }, [s.code, exercise.type]);

  // ─── Mutators ────────────────────────────────────────────────────────────────

  const update = useCallback((patch: Partial<ExerciseState>) => {
    setStates((prev) => prev.map((st, i) => (i === current ? { ...st, ...patch } : st)));
  }, [current]);

  const handleRun = useCallback(async () => {
    update({ isRunning: true, output: [], error: null, testResults: [] });
    const result =
      exercise.type === 'html' || exercise.type === 'react'
        ? await runHtmlSandbox({ code: s.code, tests: exercise.tests, exerciseType: exercise.type })
        : await runInSandbox({ code: s.code, tests: exercise.tests });
    update({ output: result.output, error: result.error, testResults: result.testResults, isRunning: false });

    if (lessonId) {
      const passed = result.testResults.length > 0 && result.testResults.every((r) => r.passed);
      api.post('/progress/exercise', {
        lessonId,
        exerciseIndex: current,
        exerciseTitle: exercise.title ?? `Ejercicio ${current + 1}`,
        passed,
        hintsUsed: s.hintsUsed,
      }).catch(() => {});
    }
  }, [update, s.code, exercise.type, exercise.tests, exercise.title, current, lessonId, s.hintsUsed]);

  const handleReset = () => {
    persistCode(lessonId, current, exercise.starterCode);
    update({ code: exercise.starterCode, output: [], error: null, testResults: [], submitted: false, passed: false, hintsUsed: 0 });
  };

  const handleSubmit = async () => {
    update({ submitted: true, passed: allPassed });
    if (current === 0) await onComplete(allPassed, s.hintsUsed);
  };

  // ─── UI helpers ──────────────────────────────────────────────────────────────

  const isCurrentCompleted = s.passed || (current === 0 && isCompleted);
  const showCompletedBanner = current === 0 && (states[0].passed || isCompleted);

  function exerciseLabel(idx: number) {
    const ex = exercises[idx];
    if (ex.title) return ex.title;
    if (idx === 0) return 'Principal';
    if (idx === 1) return 'Práctica';
    return `Extra ${idx}`;
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <ExerciseStepper
        exercises={exercises}
        current={current}
        states={states}
        isCompleted={isCompleted}
        onSelect={setCurrent}
        labelFn={exerciseLabel}
      />

      {/* Consigna */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {exercises.length > 1
              ? `Ejercicio ${current + 1} de ${exercises.length}`
              : 'Tu desafío'}
          </h3>
          {current === 0 && (
            <span className="text-xs text-xp-DEFAULT font-bold">
              +{xpReward} XP
              {s.hintsUsed > 0 && <span className="text-slate-500 font-normal ml-1">(reducido)</span>}
            </span>
          )}
          {current > 0 && (
            <span className="text-xs text-slate-500">Práctica extra</span>
          )}
        </div>
        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
          {exercise.prompt}
        </p>
      </div>

      {/* Editor */}
      <CodeEditor
        value={s.code}
        onChange={(v) => update({ code: v })}
        language={exercise.type === 'html' ? 'html' : 'javascript'}
      />

      {(exercise.type === 'html' || exercise.type === 'react') && previewSrcdoc && (
        <div className="rounded-lg overflow-hidden border border-slate-700">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700">
            <span className="text-xs text-slate-500 font-mono">preview</span>
            {exercise.type === 'react' && (
              <span className="text-xs text-blue-400 font-mono ml-auto">React {'⚛'}</span>
            )}
          </div>
          <iframe
            srcDoc={previewSrcdoc}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-48 bg-white"
            title={exercise.type === 'react' ? 'Vista previa React' : 'Vista previa HTML'}
          />
        </div>
      )}

      {/* Controles */}
      <div className="flex gap-2">
        <button
          onClick={handleRun}
          disabled={s.isRunning}
          className="flex items-center gap-2 btn-primary flex-1"
          aria-label="Ejecutar código"
        >
          <Play className="w-4 h-4" />
          {s.isRunning ? 'Ejecutando...' : 'Ejecutar'}
        </button>

        <button
          onClick={handleReset}
          className="p-3 border border-slate-700 rounded-lg text-slate-400 hover:text-white
                     hover:border-slate-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Reiniciar código"
          title="Reiniciar al código inicial"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Consola */}
      <Console lines={s.output.map((t) => ({ text: t }))} error={s.error} isEmpty />

      {/* Tests */}
      <TestRunner tests={exercise.tests} results={s.testResults} isRunning={s.isRunning} />

      {/* Pistas */}
      <HintSystem hints={exercise.hints} onHintUsed={(n) => update({ hintsUsed: n })} />

      {/* Enviar cuando todos los tests pasan */}
      {allPassed && !s.submitted && !isCurrentCompleted && (
        <button
          onClick={handleSubmit}
          className="w-full flex items-center justify-center gap-2 py-3 px-6
                     bg-success-DEFAULT hover:bg-success-500 text-white font-semibold
                     rounded-lg transition-colors duration-200 animate-bounce-in"
        >
          {current === 0 ? '¡Enviar y ganar XP!' : '¡Ejercicio completado!'}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Ejercicio extra completado */}
      {current > 0 && isCurrentCompleted && !showCompletedBanner && (
        <div className="card text-center space-y-3 animate-bounce-in">
          <p className="text-success-400 font-semibold text-sm">✓ Ejercicio extra completado</p>
          {current < exercises.length - 1 ? (
            <button
              onClick={() => setCurrent(current + 1)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-5
                         border border-primary-500/40 hover:border-primary-500 text-primary-300
                         hover:text-primary-200 rounded-lg transition-colors text-sm font-medium"
            >
              Siguiente ejercicio
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <p className="text-xs text-slate-500">¡Completaste todos los ejercicios de esta lección!</p>
          )}
        </div>
      )}

      {/* Banner de lección completada + navegación */}
      {showCompletedBanner && (
        <LessonCompletionBanner
          exercises={exercises}
          states={states}
          hasNext={hasNext}
          onNextLesson={onNextLesson}
          onSelectExercise={setCurrent}
          labelFn={exerciseLabel}
        />
      )}
    </div>
  );
}
