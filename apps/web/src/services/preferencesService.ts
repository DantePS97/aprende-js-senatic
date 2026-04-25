import { api } from '@/lib/api';
import { usePreferencesStore } from '@/store/preferencesStore';
import type { UserPreferences } from '@senatic/shared';

/**
 * Actualiza preferencias del usuario con optimistic update y rollback automático.
 *
 * Flujo:
 * 1. Snapshot del estado actual (para rollback)
 * 2. setPreferences(partial) — DOM + store actualizados inmediatamente
 * 3. PATCH /users/me/preferences
 * 4a. Éxito → sync con valores confirmados por servidor, retorna UserPreferences
 * 4b. Error  → rollback al snapshot, guarda mensaje de error en store, re-lanza
 */
export async function updatePreferences(
  partial: Partial<UserPreferences>,
): Promise<UserPreferences> {
  const store = usePreferencesStore.getState();

  // ── Snapshot para rollback ──
  const snapshot = { ...store.preferences };

  // ── Optimistic update ──
  store.setPreferences(partial);
  store.setSaving(true);
  store.setSaveError(null);

  try {
    const { data } = await api.patch<{
      success: true;
      data: { preferences: UserPreferences };
    }>('/users/me/preferences', partial);

    const confirmed = data.data.preferences;

    // Sync back server-confirmed values (server may normalise / fill defaults)
    store.setPreferences(confirmed);
    store.setSaving(false);

    return confirmed;
  } catch (err) {
    // ── Rollback ──
    store.setPreferences(snapshot);
    store.setSaving(false);

    const message =
      (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      'Error al guardar las preferencias.';

    store.setSaveError(message);
    throw new Error(message);
  }
}
