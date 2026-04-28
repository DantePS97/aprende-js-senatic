'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';
import { SkeletonList } from './SkeletonRow';
import { useToastStore } from '@/store/toastStore';
import { useAdminEntityForm } from '@/hooks/useAdminEntityForm';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LessonDoc {
  _id: string;
  moduleId: string;
  title: string;
  xpReward: number;
  order: number;
  isPublished: boolean;
  updatedAt: string;
}

interface LessonFormProps {
  mode: 'create' | 'edit';
  courseId: string;
  moduleId: string;
  lessonId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LessonForm({ mode, courseId, moduleId, lessonId }: LessonFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const addToast = useToastStore((s) => s.addToast);

  const [title, setTitle] = useState('');
  const [xpReward, setXpReward] = useState(50);
  const [isPublished, setIsPublished] = useState(false);

  const { loading, saving, error, existingUpdatedAt, withSubmit } = useAdminEntityForm({
    isEdit,
    entityId: lessonId,
    fetcher: (id) => adminApi.lessons.get(id) as Promise<LessonDoc>,
    onFetched: (lesson) => {
      setTitle(lesson.title);
      setXpReward(lesson.xpReward);
      setIsPublished(lesson.isPublished);
    },
    fetchErrorMsg: 'No se pudo cargar la lección.',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await withSubmit(
      async () => {
        if (isEdit && lessonId) {
          await adminApi.lessons.update(lessonId, { title, xpReward, isPublished, updatedAt: existingUpdatedAt });
          addToast({ type: 'success', message: 'Lección guardada correctamente.' });
          router.push(`/admin/courses/${courseId}/modules/${moduleId}`);
        } else {
          const created = (await adminApi.lessons.create({ moduleId, title, xpReward, isPublished })) as LessonDoc;
          addToast({ type: 'success', message: 'Lección creada correctamente.' });
          router.push(`/admin/courses/${courseId}/modules/${moduleId}/lessons/${created._id}`);
        }
      },
      {
        staleMsg: 'Otro administrador modificó esta lección. Recarga la página para ver los últimos cambios.',
        generalMsg: 'No se pudo guardar la lección. Intenta de nuevo.',
      },
    );
  };

  if (loading) {
    return <SkeletonList rows={4} />;
  }

  return (
    <div className="space-y-8">
      <AdminBreadcrumbs
        items={[
          { label: 'Cursos', href: '/admin/courses' },
          { label: 'Curso', href: `/admin/courses/${courseId}` },
          { label: 'Módulo', href: `/admin/courses/${courseId}/modules/${moduleId}` },
          { label: isEdit ? title || 'Editar Lección' : 'Nueva Lección' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Editar Lección' : 'Nueva Lección'}
        </h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            minLength={3}
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Introducción a las variables"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* XP Reward */}
        <div className="space-y-1.5">
          <label htmlFor="xpReward" className="block text-sm font-medium text-gray-700">
            Recompensa XP <span className="text-red-500">*</span>
          </label>
          <input
            id="xpReward"
            type="number"
            required
            min={10}
            max={1000}
            value={xpReward}
            onChange={(e) => setXpReward(Number(e.target.value))}
            className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400">Entre 10 y 1000 XP</p>
        </div>

        {/* Published */}
        <div className="flex items-center gap-3">
          <input
            id="isPublished"
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
            Publicar lección
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.push(`/admin/courses/${courseId}/modules/${moduleId}`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
                       rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600
                       rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear Lección'}
          </button>
        </div>
      </form>

      {/* Edit content button (edit mode only) */}
      {isEdit && lessonId && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-primary-700">Contenido de la lección</h2>
            <p className="text-xs text-primary-600 mt-0.5">
              Edita la teoría, ejemplos y ejercicios de esta lección.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/content`
              )
            }
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600
                       rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Editar Contenido
          </button>
        </div>
      )}
    </div>
  );
}
