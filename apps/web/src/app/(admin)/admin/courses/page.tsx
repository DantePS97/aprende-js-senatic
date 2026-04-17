'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, AlertCircle } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { EntityList } from '@/components/admin/EntityList';
import { ConfirmDeleteModal } from '@/components/admin/ConfirmDeleteModal';

interface CourseDoc {
  _id: string;
  title: string;
  slug: string;
  description: string;
  level: string;
  iconEmoji?: string;
  order: number;
  isPublished: boolean;
  updatedAt: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
          <div className="w-6 h-6 bg-gray-200 rounded-full" />
          <div className="flex-1 h-4 bg-gray-200 rounded" />
          <div className="w-20 h-5 bg-gray-200 rounded-full" />
          <div className="w-16 h-5 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingReorder, setPendingReorder] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CourseDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = async () => {
    try {
      const data = (await adminApi.courses.list()) as CourseDoc[];
      setCourses(data.sort((a, b) => a.order - b.order));
    } catch {
      setError('No se pudieron cargar los cursos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    setPendingReorder(id);
    try {
      await adminApi.courses.reorder(id, direction);
      await fetchCourses();
    } catch {
      setError('No se pudo reordenar. Intenta de nuevo.');
    } finally {
      setPendingReorder(null);
    }
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    const course = courses.find((c) => c._id === id);
    if (!course) return;

    // Optimistic update
    setCourses((prev) =>
      prev.map((c) => (c._id === id ? { ...c, isPublished: !current } : c))
    );

    try {
      await adminApi.courses.update(id, {
        isPublished: !current,
        updatedAt: course.updatedAt,
      });
      await fetchCourses();
    } catch {
      // Revert
      setCourses((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isPublished: current } : c))
      );
      setError('No se pudo actualizar la publicación.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.courses.delete(deleteTarget._id);
      setDeleteTarget(null);
      await fetchCourses();
    } catch {
      setError('No se pudo eliminar el curso.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Cursos' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona el catálogo de cursos de la plataforma</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/courses/new')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium
                     rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Curso
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => { setError(null); fetchCourses(); }}
            className="ml-auto text-xs underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <ListSkeleton />
      ) : (
        <EntityList
          items={courses}
          onReorder={handleReorder}
          onTogglePublish={handleTogglePublish}
          onDelete={setDeleteTarget}
          onEdit={(course) => router.push(`/admin/courses/${course._id}`)}
          pendingReorder={pendingReorder}
          renderExtra={(course) => (
            <Link
              href={`/admin/courses/${course._id}`}
              className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline whitespace-nowrap"
            >
              Ver módulos
            </Link>
          )}
        />
      )}

      {/* Delete modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        entityTitle={deleteTarget?.title ?? ''}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
