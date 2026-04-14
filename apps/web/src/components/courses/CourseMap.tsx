'use client';

import Link from 'next/link';
import { CheckCircle2, Lock, Circle, ChevronRight } from 'lucide-react';
import type { Module, LessonSummary } from '@senatic/shared';

type LessonStatus = 'completed' | 'available' | 'locked';

interface LessonWithStatus extends LessonSummary {
  status: LessonStatus;
}

interface ModuleWithStatus extends Omit<Module, 'lessons'> {
  lessons: LessonWithStatus[];
  isUnlocked: boolean;
  completedCount: number;
}

interface CourseMapProps {
  modules: ModuleWithStatus[];
}

export function CourseMap({ modules }: CourseMapProps) {
  return (
    <div className="space-y-6">
      {modules.map((mod, modIndex) => (
        <div key={mod._id as string}>
          {/* Conector entre módulos */}
          {modIndex > 0 && (
            <div className="flex justify-center my-2">
              <div className={`w-0.5 h-6 ${mod.isUnlocked ? 'bg-primary-500/40' : 'bg-slate-700'}`} />
            </div>
          )}

          {/* Card del módulo */}
          <div className={`rounded-xl border p-4 space-y-3 ${
            mod.isUnlocked
              ? 'bg-surface-800 border-slate-700'
              : 'bg-slate-900/50 border-slate-800 opacity-60'
          }`}>
            {/* Header del módulo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  mod.completedCount === mod.lessons.length && mod.lessons.length > 0
                    ? 'bg-success-DEFAULT/20 text-success-400'
                    : mod.isUnlocked
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'bg-slate-800 text-slate-600'
                }`}>
                  Módulo {modIndex + 1}
                </span>
                {!mod.isUnlocked && <Lock className="w-3.5 h-3.5 text-slate-600" />}
              </div>
              <span className="text-xs text-slate-500">
                {mod.completedCount}/{mod.lessons.length} lecciones
              </span>
            </div>

            <div>
              <h3 className={`font-semibold ${mod.isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                {mod.title}
              </h3>
              {mod.description && (
                <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
              )}
            </div>

            {/* Barra de progreso del módulo */}
            {mod.isUnlocked && mod.lessons.length > 0 && (
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-500"
                  style={{ width: `${(mod.completedCount / mod.lessons.length) * 100}%` }}
                />
              </div>
            )}

            {/* Lista de lecciones */}
            {mod.isUnlocked && (
              <div className="space-y-1.5 pt-1">
                {mod.lessons.map((lesson, lessonIndex) => (
                  <LessonNode
                    key={lesson._id as string}
                    lesson={lesson}
                    index={lessonIndex}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function LessonNode({ lesson, index }: { lesson: LessonWithStatus; index: number }) {
  const isCompleted = lesson.status === 'completed';
  const isAvailable = lesson.status === 'available';
  const isLocked = lesson.status === 'locked';

  const content = (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
      isLocked
        ? 'opacity-40 cursor-not-allowed'
        : isCompleted
        ? 'bg-success-DEFAULT/10 hover:bg-success-DEFAULT/15 border border-success-DEFAULT/20'
        : isAvailable
        ? 'bg-primary-500/10 hover:bg-primary-500/15 border border-primary-500/30'
        : ''
    }`}>
      {/* Icono de estado */}
      <div className="shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-success-DEFAULT" />
        ) : isLocked ? (
          <Lock className="w-5 h-5 text-slate-600" />
        ) : (
          <Circle className={`w-5 h-5 ${isAvailable ? 'text-primary-400' : 'text-slate-600'}`} />
        )}
      </div>

      {/* Número + título */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          isCompleted ? 'text-success-400' : isAvailable ? 'text-white' : 'text-slate-600'
        }`}>
          {index + 1}. {lesson.title}
        </p>
      </div>

      {/* XP */}
      <div className="flex items-center gap-1 shrink-0">
        <span className={`text-xs ${isCompleted ? 'text-success-400' : 'text-xp-DEFAULT'}`}>
          {isCompleted ? '✓' : `+${lesson.xpReward}`} XP
        </span>
        {isAvailable && <ChevronRight className="w-3.5 h-3.5 text-primary-400" />}
      </div>
    </div>
  );

  if (isLocked || !lesson._id) return content;

  return (
    <Link href={`/lessons/${lesson._id}`}>
      {content}
    </Link>
  );
}
