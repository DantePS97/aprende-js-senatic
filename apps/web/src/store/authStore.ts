import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens } from '@senatic/shared';
import { api } from '@/lib/api';
import { usePreferencesStore } from './preferencesStore';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          const { user, tokens } = data.data;

          // Persiste tokens en localStorage para el interceptor axios
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);

          set({ user, tokens, isAuthenticated: true, isAdmin: !!user.isAdmin, isLoading: false });
          if (user.preferences) {
            usePreferencesStore.getState().bootstrapFromServer(user.preferences);
          }
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            'Error al iniciar sesión';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      register: async (email, password, displayName) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/register', { email, password, displayName });
          const { user, tokens } = data.data;

          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);

          set({ user, tokens, isAuthenticated: true, isAdmin: !!user.isAdmin, isLoading: false });
          if (user.preferences) {
            usePreferencesStore.getState().bootstrapFromServer(user.preferences);
          }
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            'Error al registrar';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, tokens: null, isAuthenticated: false, isAdmin: false });
        // Reset preferences to defaults on logout
        usePreferencesStore.getState().setPreferences({
          theme: 'dark',
          accentColor: 'indigo',
          editorTheme: 'oneDark',
          fontSize: 'normal',
        });
      },

      updateUser: (updates) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...updates } });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'senatic-auth',
      // Solo persiste user y isAuthenticated (los tokens van en localStorage aparte)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
      // Re-apply server preferences on page refresh (rehydration from localStorage)
      onRehydrateStorage: () => (rehydratedState) => {
        if (rehydratedState?.user?.preferences) {
          usePreferencesStore.getState().bootstrapFromServer(rehydratedState.user.preferences);
        }
      },
    }
  )
);
