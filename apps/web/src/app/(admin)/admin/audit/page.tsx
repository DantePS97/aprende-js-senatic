'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditEntry {
  _id: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const PAGE_LIMIT = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ActionBadge({ action }: { action: string }) {
  const colorMap: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    REORDER: 'bg-amber-100 text-amber-700',
    PROMOTE: 'bg-indigo-100 text-indigo-700',
    DEMOTE: 'bg-purple-100 text-purple-700',
  };
  const normalized = action.toUpperCase();
  const colorClass = colorMap[normalized] ?? 'bg-gray-100 text-gray-600';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {action}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-gray-100">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="w-16 h-5 bg-gray-200 rounded" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
          <div className="flex-1 h-4 bg-gray-200 rounded" />
          <div className="w-36 h-4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = useCallback(async (newOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.audit.list({ limit: PAGE_LIMIT, offset: newOffset });
      setEntries((result.data as AuditEntry[]) ?? []);
      setTotal((result as { total?: number }).total ?? 0);
      setOffset(newOffset);
    } catch {
      setError('No se pudo cargar el registro de auditoría.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAudit(0); }, [fetchAudit]);

  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_LIMIT < total;
  const currentPage = Math.floor(offset / PAGE_LIMIT) + 1;
  const totalPages = Math.ceil(total / PAGE_LIMIT) || 1;

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Auditoría' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registro de Auditoría</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Historial de acciones realizadas por administradores
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchAudit(offset)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-white
                     border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          aria-label="Actualizar"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchAudit(offset)}
            className="ml-auto text-xs underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : entries.length === 0 ? (
          <p className="px-6 py-12 text-sm text-gray-400 text-center">
            No hay registros de auditoría aún.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Acción
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Entidad
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Admin
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                    Detalle
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <ActionBadge action={entry.action} />
                    </td>
                    <td className="px-4 py-3 text-gray-700 capitalize">{entry.entityType}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs truncate max-w-[120px] hidden md:table-cell">
                      {entry.adminId}
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[200px] hidden sm:table-cell">
                      {entry.metadata?.title
                        ? String(entry.metadata.title)
                        : entry.metadata?.email
                          ? String(entry.metadata.email)
                          : entry.entityId}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                      {formatDate(entry.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && total > PAGE_LIMIT && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Página {currentPage} de {totalPages} ({total} registros)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fetchAudit(offset - PAGE_LIMIT)}
              disabled={!hasPrev}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg
                         hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => fetchAudit(offset + PAGE_LIMIT)}
              disabled={!hasNext}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg
                         hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
        </div>
      )}
    </div>
  );
}
