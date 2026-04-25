import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyPreferences } from '@/lib/applyPreferences';
import type { UserPreferences } from '@senatic/shared';

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  accentColor: 'indigo',
  editorTheme: 'oneDark',
  fontSize: 'normal',
};

// ─── State interface ──────────────────────────────────────────────────────────

interface PreferencesState {
  preferences: UserPreferences;
  isSaving: boolean;
  saveError: string | null;

  /** Merge partial prefs into state and apply DOM side effects immediately */
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  /** Overwrite with server-confirmed preferences (called after login / rehydration) */
  bootstrapFromServer: (serverPrefs: UserPreferences) => void;
  setSaving: (saving: boolean) => void;
  setSaveError: (error: string | null) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,
      isSaving: false,
      saveError: null,

      setPreferences: (prefs) => {
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        }));
        // Apply DOM mutations immediately (optimistic) — safe on SSR via typeof check
        if (typeof window !== 'undefined') {
          applyPreferences(prefs);
        }
      },

      bootstrapFromServer: (serverPrefs) => {
        set({ preferences: serverPrefs });
        if (typeof window !== 'undefined') {
          applyPreferences(serverPrefs);
        }
      },

      setSaving: (saving) => set({ isSaving: saving }),
      setSaveError: (error) => set({ saveError: error }),
    }),
    {
      name: 'senatic-preferences',
      // Only persist user-facing preferences — not transient UI state
      partialize: (state) => ({ preferences: state.preferences }),
    },
  ),
);
