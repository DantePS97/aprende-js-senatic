import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminEntityForm } from './useAdminEntityForm';

// ─── Mock toastStore ──────────────────────────────────────────────────────────

const addToast = vi.fn();
vi.mock('@/store/toastStore', () => ({
  useToastStore: (selector: (s: { addToast: typeof addToast }) => unknown) =>
    selector({ addToast }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const entity = { updatedAt: '2026-01-01T00:00:00.000Z', name: 'Test' };

function makeOptions(overrides: Partial<Parameters<typeof useAdminEntityForm>[0]> = {}) {
  return {
    isEdit: false,
    entityId: undefined,
    fetcher: vi.fn().mockResolvedValue(entity),
    onFetched: vi.fn(),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useAdminEntityForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts with loading=false in create mode', () => {
    const { result } = renderHook(() => useAdminEntityForm(makeOptions()));
    expect(result.current.loading).toBe(false);
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('starts with loading=true in edit mode and calls fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue(entity);
    const onFetched = vi.fn();
    const { result } = renderHook(() =>
      useAdminEntityForm(makeOptions({ isEdit: true, entityId: 'abc123', fetcher, onFetched })),
    );

    expect(result.current.loading).toBe(true);

    await act(async () => {});

    expect(fetcher).toHaveBeenCalledWith('abc123');
    expect(onFetched).toHaveBeenCalledWith(entity);
    expect(result.current.loading).toBe(false);
    expect(result.current.existingUpdatedAt).toBe(entity.updatedAt);
  });

  it('sets error when fetcher rejects', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('network'));
    const { result } = renderHook(() =>
      useAdminEntityForm(
        makeOptions({ isEdit: true, entityId: 'abc123', fetcher, fetchErrorMsg: 'No se pudo cargar.' }),
      ),
    );

    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('No se pudo cargar.');
  });

  it('withSubmit — sets saving=true during execution and false after', async () => {
    let resolveFn!: () => void;
    const slowFn = () => new Promise<void>((r) => { resolveFn = r; });

    const { result } = renderHook(() => useAdminEntityForm(makeOptions()));

    act(() => { result.current.withSubmit(slowFn); });
    expect(result.current.saving).toBe(true);

    await act(async () => resolveFn());
    expect(result.current.saving).toBe(false);
  });

  it('withSubmit — STALE_ENTITY sets stale error and warning toast', async () => {
    const staleError = { code: 'STALE_ENTITY' };
    const fn = vi.fn().mockRejectedValue(staleError);

    const { result } = renderHook(() => useAdminEntityForm(makeOptions()));

    await act(async () => {
      await result.current.withSubmit(fn, {
        staleMsg: 'Contenido modificado por otro admin.',
      });
    });

    expect(result.current.error).toBe('Contenido modificado por otro admin.');
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'warning' }),
    );
  });

  it('withSubmit — generic error sets general error and error toast', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('db down'));

    const { result } = renderHook(() => useAdminEntityForm(makeOptions()));

    await act(async () => {
      await result.current.withSubmit(fn, {
        generalMsg: 'No se pudo guardar.',
      });
    });

    expect(result.current.error).toBe('No se pudo guardar.');
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' }),
    );
  });
});
