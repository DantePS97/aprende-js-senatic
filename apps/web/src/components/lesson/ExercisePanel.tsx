'use client';

import { useState, useCallback, useEffect } from 'react';
import { Play, RotateCcw, ChevronRight, ArrowRight, LayoutGrid, CheckCircle2, Circle } from 'lucide-react';
import type { LessonExercise } from '@senatic/shared';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Console } from '@/components/editor/Console';
import { TestRunner } from './TestRunner';
import { HintSystem } from './HintSystem';
import { runInSandbox, TestResult } from '@/lib/sandbox';
import { runHtmlSandbox } from '@/lib/htmlSandbox';
import { api } from '@/lib/api';

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

function makeInitialState(exercise: LessonExercise): ExerciseState {
  return {
    code: exercise.starterCode,
    output: [],
    error: null,
    testResults: [],
    isRunning: false,
    submitted: false,
    passed: false,
    hintsUsed: 0,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  // Estado independiente por ejercicio
  const [states, setStates] = useState<ExerciseState[]>(() =>
    exercises.map(makeInitialState)
  );

  // Cuando cambian los ejercicios (nueva lección), reiniciar todo
  useEffect(() => {
    setCurrent(0);
    setStates(exercises.map(makeInitialState));
  }, [exercises]);

  const s = states[current];
  const exercise = exercises[current];

  const [previewSrcdoc, setPreviewSrcdoc] = useState<string>(
    exercise.type === 'html' ? exercise.starterCode : ''
  );

  // La lección está completa cuando el ejercicio principal (índice 0) fue aprobado
  const mainPassed = states[0].passed || isCompleted;
  const allPassed = s.testResults.length > 0 && s.testResults.every((r) => r.passed);

  // Debounced live preview
  useEffect(() => {
    if (exercise.type !== 'html') return;
    const id = setTimeout(() => setPreviewSrcdoc(s.code), 400);
    return () => clearTimeout(id);
  }, [s.code, exercise.type]);

  // Reset preview when exercise changes
  useEffect(() => {
    if (exercise.type === 'html') setPreviewSrcdoc(exercise.starterCode ?? '');
  }, [exercise]);

  // ─── Mutators ────────────────────────────────────────────────────────────────

  const update = useCallback((patch: Partial<ExerciseState>) => {
    setStates((prev) =>
      prev.map((st, i) => (i === current ? { ...st, ...patch } : st))
    );
  }, [current]);

  const handleRun = useCallback(async () => {
    update({ isRunning: true, output: [], error: null, testResults: [] });
    const result =
      exercise.type === 'html'
        ? await runHtmlSandbox({ code: s.code, tests: exercise.tests })
        : await runInSandbox({ code: s.code, tests: exercise.tests });
    update({
      output: result.output,
      error: result.error,
      testResults: result.testResults,
      isRunning: false,
    });

    // Telemetría de ejercicio — fire and forget, no bloquea al estudiante
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
    update({
      code: exercise.starterCode,
      output: [],
      error: null,
      testResults: [],
      submitted: false,
      passed: false,
      hintsUsed: 0,
    });
  };

  const handleHintsUsed = (n: number) => update({ hintsUsed: n });

  const handleSubmit = async () => {
    // Solo el ejercicio principal (índice 0) envía progreso al servidor
    if (current === 0) {
      update({ submitted: true, passed: allPassed });
      await onComplete(allPassed, s.hintsUsed);
    } else {
      update({ submitted: true, passed: allPassed });
    }
  };

  // ─── UI helpers ──────────────────────────────────────────────────────────────

  const isCurrentCompleted = s.passed || (current === 0 && isCompleted);
  const showCompletedBanner = current === 0 && (states[0].passed || isCompleted);

  // Label por defecto si el JSON no trae título
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
      {/* Stepper — solo visible cuando hay más de un ejercicio */}
      {exercises.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {exercises.map((_, idx) => {
            const done = states[idx].passed || (idx === 0 && isCompleted);
            const active = idx === current;
            return (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
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
                {done ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
                {exerciseLabel(idx)}
              </button>
            );
          })}
        </div>
      )}

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
        readOnly={isCurrentCompleted}
        language={exercise.type === 'html' ? 'html' : 'javascript'}
      />

      {exercise.type === 'html' && (
        <div className="rounded-lg overflow-hidden border border-slate-700">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700">
            <span className="text-xs text-slate-500 font-mono">preview</span>
          </div>
          <iframe
            srcDoc={previewSrcdoc}
            sandbox="allow-scripts"
            className="w-full h-48 bg-white"
            title="Vista previa HTML"
          />
        </div>
      )}

      {/* Controles */}
      <div className="flex gap-2">
        <button
          onClick={handleRun}
          disabled={s.isRunning || isCurrentCompleted}
          className="flex items-center gap-2 btn-primary flex-1"
          aria-label="Ejecutar código"
        >
          <Play className="w-4 h-4" />
          {s.isRunning ? 'Ejecutando...' : 'Ejecutar'}
        </button>

        <button
          onClick={handleReset}
          disabled={isCurrentCompleted}
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
      <TestRunner
        tests={exercise.tests}
        results={s.testResults}
        isRunning={s.isRunning}
      />

      {/* Pistas */}
      <HintSystem hints={exercise.hints} onHintUsed={handleHintsUsed} />

      {/* Botón de entrega — cuando todos los tests pasan y aún no se envió */}
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

      {/* Ejercicio extra completado → ir al siguiente o al principal */}
      {current > 0 && isCurrentCompleted && !showCompletedBanner && (
        <div className="card text-center space-y-3 animate-bounce-in">
          <p className="text-success-400 font-semibold text-sm">
            ✓ Ejercicio extra completado
          </p>
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

      {/* Estado completado del ejercicio PRINCIPAL + navegación */}
      {showCompletedBanner && (
        <div className="card space-y-4 animate-bounce-in">
          <div className="text-center">
            <p className="text-success-400 font-bold text-lg">¡Lección completada!</p>
            <p className="text-xs text-slate-500 mt-1">
              {hasNext ? 'Continúa con la siguiente lección' : 'Has terminado el módulo'}
            </p>
          </div>

          {/* Ejercicios extra disponibles */}
          {exercises.length > 1 && (
            <div className="space-y-1.5">
              <p className="text-xs text-slate-400 font-medium">
                Sigue practicando — ejercicios extra:
              </p>
              {exercises.slice(1).map((_, idx) => {
                const realIdx = idx + 1;
                const done = states[realIdx]?.passed;
                return (
                  <button
                    key={realIdx}
                    onClick={() => setCurrent(realIdx)}
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
                    {exerciseLabel(realIdx)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Navegación a siguiente lección */}
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
      )}
    </div>
  );
}
