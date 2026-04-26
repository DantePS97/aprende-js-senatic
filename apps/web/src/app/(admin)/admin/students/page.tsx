'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, Flame, Trophy, BookOpen } from 'lucide-react';
import { useStudentsStore } from '@/store/studentsStore';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import type { StudentSummary } from '@senatic/shared';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<number, string> = {
  1: 'Aprendiz',
  2: 'Explorador',
  3: 'Desarrollador',
  4: 'Avanzado',
  5: 'Experto',
};

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-slate-700 text-slate-300',
  2: 'bg-blue-900/50 text-blue-300',
  3: 'bg-primary-600/20 text-primary-400',
  4: 'bg-purple-900/50 text-purple-300',
  5: 'bg-amber-900/50 text-amber-300',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function StudentRow({ student, onClick }: { student: StudentSummary; onClick: () => void }) {
  const initials = student.displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <tr
      onClick={onClick}
      className="border-t border-gray-100 hover:bg-primary-50 cursor-pointer transition-colors"
    >
      {/* Nombre */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{student.displayName}</p>
            <p className="text-xs text-gray-400 truncate">{student.email}</p>
          </div>
        </div>
      </td>

      {/* Nivel */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[student.level] ?? LEVEL_COLORS[1]}`}>
          {LEVEL_LABELS[student.level] ?? `Nivel ${student.level}`}
        </span>
      </td>

      {/* XP */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm text-amber-600 font-semibold">
          <Trophy className="w-3.5 h-3.5" />
          {student.xp.toLocaleString()}
        </div>
      </td>

      {/* Racha */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm text-orange-500 font-medium">
          <Flame className="w-3.5 h-3.5" />
          {student.streak}d
        </div>
      </td>

      {/* Lecciones */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <BookOpen className="w-3.5 h-3.5" />
          {student.completedLessons}
        </div>
      </td>

      {/* Último acceso */}
      <td className="px-4 py-3 text-sm text-gray-500">
        {formatDate(student.lastActiveDate)}
      </td>

      {/* Flecha */}
      <td className="px-4 py-3 text-gray-400">
        <ChevronRight className="w-4 h-4" />
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const router = useRouter();
  const { list, fetchList } = useStudentsStore();
  const [query, setQuery] = useState('');

  useEffect(() => { fetchList(); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return list.data?.students ?? [];
    return (list.data?.students ?? []).filter(
      (s) => s.displayName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    );
  }, [list.data, query]);

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Estudiantes' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estudiantes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {list.data ? `${list.data.total} registrados` : 'Cargando…'}
          </p>
        </div>

        {/* Buscador */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar por nombre o correo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {list.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {list.error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {list.loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            {query ? 'Sin resultados para tu búsqueda.' : 'No hay estudiantes registrados aún.'}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Estudiante</th>
                <th className="px-4 py-3">Nivel</th>
                <th className="px-4 py-3">XP</th>
                <th className="px-4 py-3">Racha</th>
                <th className="px-4 py-3">Lecciones</th>
                <th className="px-4 py-3">Último acceso</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  onClick={() => router.push(`/admin/students/${student.id}`)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
