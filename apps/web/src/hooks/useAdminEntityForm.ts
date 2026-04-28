import { useState, useEffect, useRef } from 'react';
import { useToastStore } from '@/store/toastStore';

interface UseAdminEntityFormOptions<T extends { updatedAt: string }> {
  isEdit: boolean;
  entityId: string | undefined;
  fetcher: (id: string) => Promise<T>;
  onFetched: (data: T) => void;
  fetchErrorMsg?: string;
}

interface UseAdminEntityFormReturn {
  loading: boolean;
  saving: boolean;
  error: string | null;
  setError: (msg: string | null) => void;
  existingUpdatedAt: string;
  setExistingUpdatedAt: (v: string) => void;
  withSubmit: (
    fn: () => Promise<void>,
    opts?: { staleMsg?: string; generalMsg?: string },
  ) => Promise<void>;
}

export function useAdminEntityForm<T extends { updatedAt: string }>({
  isEdit,
  entityId,
  fetcher,
  onFetched,
  fetchErrorMsg = 'No se pudo cargar el elemento.',
}: UseAdminEntityFormOptions<T>): UseAdminEntityFormReturn {
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingUpdatedAt, setExistingUpdatedAt] = useState('');
  const addToast = useToastStore((s) => s.addToast);

  // Keep a stable ref to onFetched so the effect dep array stays minimal
  const onFetchedRef = useRef(onFetched);
  onFetchedRef.current = onFetched;

  useEffect(() => {
    if (!isEdit || !entityId) return;
    fetcher(entityId)
      .then((data) => {
        setExistingUpdatedAt(data.updatedAt);
        onFetchedRef.current(data);
      })
      .catch(() => setError(fetchErrorMsg))
      .finally(() => setLoading(false));
  // fetcher is expected to be stable (module-level API functions); entityId & isEdit drive re-fetches
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, entityId]);

  async function withSubmit(
    fn: () => Promise<void>,
    {
      staleMsg = 'Otro administrador modificó este elemento. Recarga la página para ver los últimos cambios.',
      generalMsg = 'No se pudo guardar. Intenta de nuevo.',
    }: { staleMsg?: string; generalMsg?: string } = {},
  ) {
    setSaving(true);
    setError(null);
    try {
      await fn();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'STALE_ENTITY') {
        setError(staleMsg);
        addToast({ type: 'warning', message: 'Otro admin modificó este elemento. Recarga para ver los cambios.' });
      } else {
        addToast({ type: 'error', message: 'Error inesperado. Intenta de nuevo.' });
        setError(generalMsg);
      }
    } finally {
      setSaving(false);
    }
  }

  return { loading, saving, error, setError, existingUpdatedAt, setExistingUpdatedAt, withSubmit };
}
