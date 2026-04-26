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
import type { CourseCreateInput } from '@senatic/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleDoc {
  _id: string;
  title: string;
  order: number;
  isPublished: boolean;
  description: string;
  updatedAt: string;
}

interface CourseDoc {
  _id: string;
  slug: string;
  title: string;
  description: string;
  level: 'basic' | 'intermediate';
  iconEmoji: string;
  order: number;
  isPublished: boolean;
  updatedAt: string;
}

interface CourseFormProps {
  mode: 'create' | 'edit';
  courseId?: string;
}

// ─── Slug preview ─────────────────────────────────────────────────────────────

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CourseForm({ mode, courseId }: CourseFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const addToast = useToastStore((s) => s.addToast);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<'basic' | 'intermediate'>('basic');
  const [iconEmoji, setIconEmoji] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [existingSlug, setExistingSlug] = useState('');
  const [existingUpdatedAt, setExistingUpdatedAt] = useState('');

  // Module list (edit mode)
  const [modules, setModules] = useState<ModuleDoc[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [pendingReorder, setPendingReorder] = useState<string | null>(null);
  const [deleteModuleTarget, setDeleteModuleTarget] = useState<ModuleDoc | null>(null);

  // UI state
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing course in edit mode
  useEffect(() => {
    if (!isEdit || !courseId) return;
    adminApi.courses.get(courseId)
      .then((data) => {
        const course = data as CourseDoc;
        setTitle(course.title);
        setDescription(course.description);
        setLevel(course.level);
        setIconEmoji(course.iconEmoji ?? '');
        setIsPublished(course.isPublished);
        setExistingSlug(course.slug);
        setExistingUpdatedAt(course.updatedAt);
      })
      .catch(() => setError('No se pudo cargar el curso.'))
      .finally(() => setLoading(false));
  }, [isEdit, courseId]);

  // Fetch modules in edit mode
  const fetchModules = useCallback(async () => {
    if (!courseId) return;
    setLoadingModules(true);
    try {
      const data = (await adminApi.modules.list(courseId)) as ModuleDoc[];
      setModules(data.sort((a, b) => a.order - b.order));
    } catch {
      // non-critical
    } finally {
      setLoadingModules(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (isEdit && courseId) fetchModules();
  }, [isEdit, courseId, fetchModules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: CourseCreateInput = {
      title,
      description,
      level,
      iconEmoji: iconEmoji || undefined,
      isPublished,
    };

    try {
      if (isEdit && courseId) {
        await adminApi.courses.update(courseId, { ...payload, updatedAt: existingUpdatedAt });
      } else {
        await adminApi.courses.create(payload);
      }
      addToast('success', 'Curso guardado correctamente.');
      router.push('/admin/courses');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'STALE_ENTITY') {
        setError('Otro administrador modificó este curso. Recarga la página para ver los últimos cambios.');
        addToast('warning', 'Otro admin modificó este elemento. Recarga para ver los cambios.');
      } else {
        addToast('error', 'Error inesperado. Intenta de nuevo.');
        setError('No se pudo guardar el curso. Intenta de nuevo.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Module handlers
  const handleModuleReorder = async (id: string, direction: 'up' | 'down') => {
    setPendingReorder(id);
    try {
      await adminApi.modules.reorder(id, direction);
      await fetchModules();
    } catch {
      setError('No se pudo reordenar el módulo.');
    } finally {
      setPendingReorder(null);
    }
  };

  const handleModuleTogglePublish = async (id: string, current: boolean) => {
    const mod = modules.find((m) => m._id === id);
    if (!mod) return;
    setModules((prev) => prev.map((m) => (m._id === id ? { ...m, isPublished: !current } : m)));
    try {
      await adminApi.modules.update(id, { isPublished: !current, updatedAt: mod.updatedAt });
      await fetchModules();
    } catch {
      setModules((prev) => prev.map((m) => (m._id === id ? { ...m, isPublished: current } : m)));
      setError('No se pudo actualizar la publicación del módulo.');
    }
  };

  const handleModuleDelete = async () => {
    if (!deleteModuleTarget) return;
    try {
      await adminApi.modules.delete(deleteModuleTarget._id);
      setDeleteModuleTarget(null);
      await fetchModules();
    } catch {
      setError('No se pudo eliminar el módulo.');
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
          { label: isEdit ? title || 'Editar Curso' : 'Nuevo Curso' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Editar Curso' : 'Nuevo Curso'}
        </h1>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
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
            placeholder="Ej: JavaScript Básico"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Slug (read-only in edit, preview in create) */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Slug {isEdit ? '(inmutable)' : '(generado automáticamente)'}
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-500">
            {isEdit ? existingSlug : (title ? toSlug(title) : '—')}
          </div>
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
            placeholder="Descripción breve del curso..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400">{description.length}/500</p>
        </div>

        {/* Level */}
        <div className="space-y-1.5">
          <label htmlFor="level" className="block text-sm font-medium text-gray-700">
            Nivel <span className="text-red-500">*</span>
          </label>
          <select
            id="level"
            required
            value={level}
            onChange={(e) => setLevel(e.target.value as 'basic' | 'intermediate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="basic">Básico</option>
            <option value="intermediate">Intermedio</option>
          </select>
        </div>

        {/* Icon Emoji */}
        <div className="space-y-1.5">
          <label htmlFor="iconEmoji" className="block text-sm font-medium text-gray-700">
            Emoji de ícono (opcional)
          </label>
          <input
            id="iconEmoji"
            type="text"
            value={iconEmoji}
            onChange={(e) => setIconEmoji(e.target.value)}
            placeholder="Ej: 📘"
            className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
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
            Publicar curso (visible para los estudiantes)
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.push('/admin/courses')}
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
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear Curso'}
          </button>
        </div>
      </form>

      {/* Modules section (edit mode only) */}
      {isEdit && courseId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Módulos del curso</h2>
            <button
              type="button"
              onClick={() => router.push(`/admin/courses/${courseId}/modules/new`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-700
                         bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
            >
              + Nuevo Módulo
            </button>
          </div>

          {loadingModules ? (
            <SkeletonList rows={3} />
          ) : (
            <EntityList
              items={modules}
              onReorder={handleModuleReorder}
              onTogglePublish={handleModuleTogglePublish}
              onDelete={setDeleteModuleTarget}
              onEdit={(mod) => router.push(`/admin/courses/${courseId}/modules/${mod._id}`)}
              pendingReorder={pendingReorder}
            />
          )}
        </div>
      )}

      {/* Delete module modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteModuleTarget}
        entityTitle={deleteModuleTarget?.title ?? ''}
        onConfirm={handleModuleDelete}
        onCancel={() => setDeleteModuleTarget(null)}
      />
    </div>
  );
}
