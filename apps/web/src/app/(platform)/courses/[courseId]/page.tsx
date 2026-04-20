'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { useProgressStore } from '@/store/progressStore';
import { CourseMap } from '@/components/courses/CourseMap';
import type { Course, Module, LessonSummary } from '@senatic/shared';

type LessonStatus = 'completed' | 'available' | 'locked';

interface LessonWithStatus extends LessonSummary {
  status: LessonStatus;
}

interface ModuleWithStatus extends Omit<Module, 'lessons'> {
  lessons: LessonWithStatus[];
  isUnlocked: boolean;
  completedCount: number;
}

function buildModules(rawModules: Module[], getLessonStatus: (id: string) => string): ModuleWithStatus[] {
  let previousModuleCompleted = true;

  return rawModules.map((mod) => {
    const unlockedByPrevious = previousModuleCompleted;

    const lessons: LessonWithStatus[] = mod.lessons.map((lesson, i) => {
      const status = getLessonStatus(lesson._id);

      let lessonStatus: LessonStatus;
      if (status === 'completed') {
        lessonStatus = 'completed';
      } else if (unlockedByPrevious && i === 0) {
        lessonStatus = 'available';
      } else {
        lessonStatus = 'locked';
      }

      return { ...lesson, status: lessonStatus };
    });

    for (let i = 1; i < lessons.length; i++) {
      if (lessons[i - 1].status === 'completed' && lessons[i].status === 'locked') {
        lessons[i] = { ...lessons[i], status: 'available' };
      }
    }

    const completedCount = lessons.filter((l) => l.status === 'completed').length;
    const moduleCompleted = completedCount === lessons.length && lessons.length > 0;
    previousModuleCompleted = moduleCompleted;

    return {
      ...mod,
      lessons,
      isUnlocked: mod.order === 1 || unlockedByPrevious,
      completedCount,
    };
  });
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const getLessonStatus = useProgressStore((s) => s.getLessonStatus);
  const progressMap = useProgressStore((s) => s.progressMap);
  const fetchMyProgress = useProgressStore((s) => s.fetchMyProgress);

  const [course, setCourse] = useState<Course | null>(null);
  const [rawModules, setRawModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${courseId}`),
      fetchMyProgress(),
    ])
      .then(([{ data }]) => {
        const raw: Course = data.data;
        setCourse(raw);
        setRawModules(raw.modules);
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [courseId, router, fetchMyProgress]);

  const modules = useMemo(
    () => (rawModules.length > 0 ? buildModules(rawModules, getLessonStatus) : []),
    [rawModules, progressMap, getLessonStatus]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500 animate-pulse">Cargando curso...</div>
      </div>
    );
  }

  if (!course) return null;

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = modules.reduce((acc, m) => acc + m.completedCount, 0);
  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{course.iconEmoji}</span>
            <h1 className="text-xl font-bold text-white">{course.title}</h1>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">{course.description}</p>
        </div>
      </div>

      {/* Progreso general del curso */}
      <div className="card space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-slate-400">
            <BookOpen className="w-4 h-4" />
            <span>Progreso del curso</span>
          </div>
          <span className="font-semibold text-white">{percent}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full xp-gradient rounded-full transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">
          {completedLessons} de {totalLessons} lecciones completadas
        </p>
      </div>

      {/* Mapa de módulos */}
      <CourseMap modules={modules} />
    </div>
  );
}
