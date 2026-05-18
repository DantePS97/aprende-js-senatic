'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { ConfirmDeleteModal } from '@/components/admin/ConfirmDeleteModal';
import { PublishToggle } from '@/components/admin/PublishToggle';
import { useToastStore } from '@/store/toastStore';

interface ChallengeRow {
  _id: string;
  slug: string;
  title: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  xpReward: number;
  published: boolean;
  updatedAt: string;
}

interface ListResult {
  items: ChallengeRow[];
  total: number;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  facil: 'bg-emerald-100 text-emerald-700',
  medio: 'bg-amber-100 text-amber-700',
  dificil: 'bg-red-100 text-red-700',
};

function ListSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
          <div className="flex-1 h-4 bg-gray-200 rounded" />
          <div className="w-16 h-5 bg-gray-200 rounded-full" />
          <div className="w-12 h-4 bg-gray-200 rounded" />
          <div className="w-20 h-5 bg-gray-200 rounded" />
          <div className="w-16 h-5 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function AdminChallengesPage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);

  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChallengeRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const result = (await adminApi.challenges.list({ limit: 100 })) as ListResult;
      setChallenges(result.items ?? []);
    } catch {
      setError('No se pudieron cargar los retos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChallenges(); }, []);

  const handleTogglePublish = async (id: string, next: boolean) => {
    const challenge = challenges.find((c) => c._id === id);
    if (!challenge) return;
    setTogglingId(id);
    setChallenges((prev) => prev.map((c) => c._id === id ? { ...c, published: next } : c));
    try {
      await adminApi.challenges.update(id, { published: next });
      addToast({ type: 'success', message: 'Guardado correctamente.' });
      await fetchChallenges();
    } catch {
      setChallenges((prev) => prev.map((c) => c._id === id ? { ...c, published: challenge.published } : c));
      addToast({ type: 'error', message: 'Error al actualizar. Intenta de nuevo.' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.challenges.delete(deleteTarget._id);
      addToast({ type: 'success', message: 'Reto eliminado correctamente.' });
      setDeleteTarget(null);
      await fetchChallenges();
    } catch {
      addToast({ type: 'error', message: 'No se pudo eliminar el reto.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Retos' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona los retos de código de la plataforma</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/challenges/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium
                     rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Reto
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => { setError(null); fetchChallenges(); }}
            className="ml-auto text-xs underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <ListSkeleton />
      ) : challenges.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">No hay retos creados todavía.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Título</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dificultad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">XP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {challenges.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                    <div className="truncate">{c.title}</div>
                    <div className="text-xs text-gray-400 font-mono">{c.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_COLOR[c.difficulty]}`}>
                      {DIFFICULTY_LABEL[c.difficulty]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{c.xpReward} XP</td>
                  <td className="px-4 py-3">
                    <PublishToggle
                      id={c._id}
                      isPublished={c.published}
                      disabled={togglingId === c._id}
                      onToggle={handleTogglePublish}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/challenges/${c._id}`)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(c)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        entityTitle={deleteTarget?.title ?? ''}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
