'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { EntityList } from './EntityList';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';
import { SkeletonList } from './SkeletonRow';
import { useToastStore } from '@/store/toastStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LessonDoc {
  _id: string;
  title: string;
  order: number;
  isPublished: boolean;
  xpReward: number;
  updatedAt: string;
}

interface ModuleDoc {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  isPublished: boolean;
  updatedAt: string;
}

interface ModuleFormProps {
  mode: 'create' | 'edit';
  courseId: string;
  moduleId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ModuleForm({ mode, courseId, moduleId }: ModuleFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const addToast = useToastStore((s) => s.addToast);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [existingUpdatedAt, setExistingUpdatedAt] = useState('');

  const [lessons, setLessons] = useState<LessonDoc[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [pendingReorder, setPendingReorder] = useState<string | null>(null);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<LessonDoc | null>(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !moduleId) return;
    adminApi.modules.get(moduleId)
      .then((data) => {
        const mod = data as ModuleDoc;
        setTitle(mod.title);
        setDescription(mod.description ?? '');
        setIsPublished(mod.isPublished);
        setExistingUpdatedAt(mod.updatedAt);
      })
      .catch(() => setError('No se pudo cargar el módulo.'))
      .finally(() => setLoading(false));
  }, [isEdit, moduleId]);

  const fetchLessons = useCallback(async () => {
    if (!moduleId) return;
    setLoadingLessons(true);
    try {
      const data = (await adminApi.lessons.list(moduleId)) as LessonDoc[];
      setLessons(data.sort((a, b) => a.order - b.order));
    } catch {
      // non-critical
    } finally {
      setLoadingLessons(false);
    }
  }, [moduleId]);

  useEffect(() => {
    if (isEdit && moduleId) fetchLessons();
  }, [isEdit, moduleId, fetchLessons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isEdit && moduleId) {
        await adminApi.modules.update(moduleId, {
          title,
          description,
          isPublished,
          updatedAt: existingUpdatedAt,
        });
        addToast('success', 'Módulo guardado correctamente.');
        router.push(`/admin/courses/${courseId}`);
      } else {
        await adminApi.modules.create({ courseId, title, description, isPublished });
        addToast('success', 'Módulo creado correctamente.');
        router.push(`/admin/courses/${courseId}`);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'STALE_ENTITY') {
        setError('Otro administrador modificó este módulo. Recarga la página para ver los últimos cambios.');
        addToast('warning', 'Otro admin modificó este elemento. Recarga para ver los cambios.');
      } else {
        addToast('error', 'Error inesperado. Intenta de nuevo.');
        setError('No se pudo guardar el módulo. Intenta de nuevo.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLessonReorder = async (id: string, direction: 'up' | 'down') => {
    setPendingReorder(id);
    try {
      await adminApi.lessons.reorder(id, direction);
      await fetchLessons();
    } catch {
      setError('No se pudo reordenar la lección.');
    } finally {
      setPendingReorder(null);
    }
  };

  const handleLessonTogglePublish = async (id: string, current: boolean) => {
    const lesson = lessons.find((l) => l._id === id);
    if (!lesson) return;
    setLessons((prev) => prev.map((l) => (l._id === id ? { ...l, isPublished: !current } : l)));
    try {
      await adminApi.lessons.update(id, { isPublished: !current, updatedAt: lesson.updatedAt });
      await fetchLessons();
    } catch {
      setLessons((prev) => prev.map((l) => (l._id === id ? { ...l, isPublished: current } : l)));
      setError('No se pudo actualizar la publicación de la lección.');
    }
  };

  const handleLessonDelete = async () => {
    if (!deleteLessonTarget) return;
    try {
      await adminApi.lessons.delete(deleteLessonTarget._id);
      setDeleteLessonTarget(null);
      await fetchLessons();
    } catch {
      setError('No se pudo eliminar la lección.');
    }
  };

  if (loading) {
    return <SkeletonList rows={5} />;
  }

  return (
    <div className="space-y-8">
      <AdminBreadcrumbs
        items={[
          { label: 'Cursos', href: '/admin/courses' },
          { label: 'Módulos del curso', href: `/admin/courses/${courseId}` },
          { label: isEdit ? title || 'Editar Módulo' : 'Nuevo Módulo' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Editar Módulo' : 'Nuevo Módulo'}
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
            placeholder="Ej: Variables y tipos de datos"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            id="description"
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción del módulo..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Published */}
        <div className="flex items-center gap-3">
          <input
            id="isPublished"
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
            Publicar módulo
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.push(`/admin/courses/${courseId}`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
                       rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600
                       rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear Módulo'}
          </button>
        </div>
      </form>

      {/* Lessons section (edit mode) */}
      {isEdit && moduleId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Lecciones del módulo</h2>
            <button
              type="button"
              onClick={() =>
                router.push(`/admin/courses/${courseId}/modules/${moduleId}/lessons/new`)
              }
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700
                         bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              + Nueva Lección
            </button>
          </div>

          {loadingLessons ? (
            <SkeletonList rows={3} />
          ) : (
            <EntityList
              items={lessons}
              onReorder={handleLessonReorder}
              onTogglePublish={handleLessonTogglePublish}
              onDelete={setDeleteLessonTarget}
              onEdit={(lesson) =>
                router.push(
                  `/admin/courses/${courseId}/modules/${moduleId}/lessons/${lesson._id}`
                )
              }
              pendingReorder={pendingReorder}
            />
          )}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteLessonTarget}
        entityTitle={deleteLessonTarget?.title ?? ''}
        onConfirm={handleLessonDelete}
        onCancel={() => setDeleteLessonTarget(null)}
      />
    </div>
  );
}
