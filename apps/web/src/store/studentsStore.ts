import { create } from 'zustand';
import { api } from '@/lib/api';
import type { StudentsListResponse, StudentProfile } from '@senatic/shared';

interface PanelState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function initialPanel<T>(): PanelState<T> {
  return { data: null, loading: false, error: null };
}

interface StudentsStore {
  list: PanelState<StudentsListResponse>;
  profile: PanelState<StudentProfile>;
  fetchList: () => Promise<void>;
  fetchProfile: (id: string) => Promise<void>;
  clearProfile: () => void;
}

export const useStudentsStore = create<StudentsStore>((set) => ({
  list: initialPanel(),
  profile: initialPanel(),

  fetchList: async () => {
    set((s) => ({ list: { ...s.list, loading: true, error: null } }));
    try {
      const { data } = await api.get('/admin/students');
      set({ list: { data: data.data, loading: false, error: null } });
    } catch (e: any) {
      set({
        list: {
          data: null,
          loading: false,
          error: e.response?.data?.error ?? 'Error al cargar estudiantes',
        },
      });
    }
  },

  fetchProfile: async (id: string) => {
    set((s) => ({ profile: { ...s.profile, loading: true, error: null } }));
    try {
      const { data } = await api.get(`/admin/students/${id}`);
      set({ profile: { data: data.data, loading: false, error: null } });
    } catch (e: any) {
      set({
        profile: {
          data: null,
          loading: false,
          error: e.response?.data?.error ?? 'Error al cargar perfil',
        },
      });
    }
  },

  clearProfile: () => set({ profile: initialPanel() }),
}));
