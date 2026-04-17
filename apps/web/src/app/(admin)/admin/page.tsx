'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Layers, FileText, FileX } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseDoc {
  _id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  order: number;
}

interface ModuleDoc {
  _id: string;
  title: string;
  courseId: string;
}

interface LessonDoc {
  _id: string;
  title: string;
  moduleId: string;
  isPublished: boolean;
}

interface AuditEntry {
  _id: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface DashboardStats {
  totalCourses: number;
  totalModules: number;
  totalLessons: number;
  draftLessons: number;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  Icon,
  loading,
}: {
  label: string;
  value: number;
  Icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <div className="card bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        {loading ? (
          <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalModules: 0,
    totalLessons: 0,
    draftLessons: 0,
  });
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch stats: derive from courses + modules + lessons
    const fetchStats = async () => {
      try {
        const courses = (await adminApi.courses.list()) as CourseDoc[];
        const totalCourses = courses.length;

        // Fetch all modules for all courses in parallel
        const moduleLists = await Promise.all(
          courses.map((c) => adminApi.modules.list(c._id) as Promise<ModuleDoc[]>)
        );
        const allModules = moduleLists.flat();
        const totalModules = allModules.length;

        // Fetch all lessons for all modules in parallel
        const lessonLists = await Promise.all(
          allModules.map((m) => adminApi.lessons.list(m._id) as Promise<LessonDoc[]>)
        );
        const allLessons = lessonLists.flat();
        const totalLessons = allLessons.length;
        const draftLessons = allLessons.filter((l) => !l.isPublished).length;

        setStats({ totalCourses, totalModules, totalLessons, draftLessons });
      } catch {
        setError('No se pudieron cargar las estadísticas.');
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchAudit = async () => {
      try {
        const result = await adminApi.audit.list({ limit: 10, offset: 0 });
        setAuditEntries(result.data ?? []);
      } catch {
        // Non-critical — audit can fail silently
      } finally {
        setLoadingAudit(false);
      }
    };

    fetchStats();
    fetchAudit();
  }, []);

  const statCards = [
    { label: 'Cursos', value: stats.totalCourses, Icon: BookOpen },
    { label: 'Módulos', value: stats.totalModules, Icon: Layers },
    { label: 'Lecciones', value: stats.totalLessons, Icon: FileText },
    { label: 'Borradores', value: stats.draftLessons, Icon: FileX },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen del contenido de la plataforma</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, Icon }) => (
          <StatCard key={label} label={label} value={value} Icon={Icon} loading={loadingStats} />
        ))}
      </div>

      {/* Audit log */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Últimas acciones</h2>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loadingAudit ? (
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex gap-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : auditEntries.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">
              No hay registros de auditoría aún.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Acción</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Entidad</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                    Detalle
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditEntries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 capitalize">{entry.entityType}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell truncate max-w-xs">
                      {entry.metadata?.title
                        ? String(entry.metadata.title)
                        : entry.metadata?.email
                          ? String(entry.metadata.email)
                          : entry.entityId}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString('es-CO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
