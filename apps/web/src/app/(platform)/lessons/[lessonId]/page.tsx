'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Code2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useProgressStore } from '@/store/progressStore';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { TheoryPanel } from '@/components/lesson/TheoryPanel';
import { ExercisePanel } from '@/components/lesson/ExercisePanel';
import type { LessonContent } from '@senatic/shared';

type Tab = 'theory' | 'exercise';

interface LessonData {
  lesson: { _id: string; title: string; xpReward: number; moduleId: string };
  content: LessonContent;
  progress: { status: string } | null;
}

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const { submitLesson } = useProgressStore();
  const { updateUser, user } = useAuthStore();
  const { showXpGain, showAchievement, showLevelUp } = useUiStore();

  const [data, setData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('theory');

  useEffect(() => {
    api
      .get(`/courses/lessons/${params.lessonId}`)
      .then(({ data: res }) => setData(res.data))
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [params.lessonId, router]);

  const handleComplete = async (passed: boolean, hintsUsed: number) => {
    if (!data) return;

    const result = await submitLesson(data.lesson._id, passed, hintsUsed);

    if (passed && result.xpEarned > 0) {
      showXpGain(result.xpEarned);

      if (user) {
        updateUser({ xp: user.xp + result.xpEarned });
      }
    }

    if (result.leveledUp && result.newLevel !== undefined) {
      showLevelUp(result.newLevel);
    }

    for (const achievement of result.newAchievements) {
      showAchievement(achievement);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500 animate-pulse">Cargando lección...</div>
      </div>
    );
  }

  if (!data) return null;

  const isCompleted = data.progress?.status === 'completed';

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-white truncate">{data.content.title}</h1>
          <p className="text-xs text-xp-DEFAULT">+{data.lesson.xpReward} XP</p>
        </div>
        {isCompleted && (
          <span className="text-xs px-2 py-1 bg-success-DEFAULT/20 text-success-400 rounded-full">
            ✅ Completada
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {[
          { id: 'theory' as Tab, label: 'Teoría', Icon: BookOpen },
          { id: 'exercise' as Tab, label: 'Ejercicio', Icon: Code2 },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'theory' ? (
        <TheoryPanel theory={data.content.theory} />
      ) : (
        <ExercisePanel
          exercise={data.content.exercise}
          xpReward={data.lesson.xpReward}
          onComplete={handleComplete}
          isCompleted={isCompleted}
        />
      )}
    </div>
  );
}
