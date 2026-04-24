import { create } from 'zustand';
import { api } from '@/lib/api';
import type {
  DateRangeParams,
  AnalyticsOverview,
  AnalyticsLessonsResponse,
  AnalyticsRetention,
  AnalyticsFunnel,
  ExercisesAnalyticsResponse,
  ActivityHeatmapResponse,
} from '@senatic/shared';

interface PanelState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function initialPanel<T>(): PanelState<T> {
  return { data: null, loading: false, error: null };
}

function buildParams(params?: DateRangeParams): Record<string, string> {
  const q: Record<string, string> = {};
  if (params?.from) q.from = params.from;
  if (params?.to) q.to = params.to;
  if (params?.courseId) q.courseId = params.courseId;
  return q;
}

interface AnalyticsStore {
  overview: PanelState<AnalyticsOverview>;
  lessons: PanelState<AnalyticsLessonsResponse>;
  retention: PanelState<AnalyticsRetention>;
  funnel: PanelState<AnalyticsFunnel>;
  exercises: PanelState<ExercisesAnalyticsResponse>;
  heatmap: PanelState<ActivityHeatmapResponse>;
  fetchOverview: (params?: DateRangeParams) => Promise<void>;
  fetchLessons: (params?: DateRangeParams) => Promise<void>;
  fetchRetention: (params?: DateRangeParams) => Promise<void>;
  fetchFunnel: (params: DateRangeParams & { courseId: string }) => Promise<void>;
  fetchExercises: (lessonId?: string) => Promise<void>;
  fetchHeatmap: (params?: DateRangeParams) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  overview: initialPanel(),
  lessons: initialPanel(),
  retention: initialPanel(),
  funnel: initialPanel(),
  exercises: initialPanel(),
  heatmap: initialPanel(),

  fetchOverview: async (params) => {
    set((s) => ({ overview: { ...s.overview, loading: true, error: null } }));
    try {
      const { data } = await api.get('/admin/analytics/overview', { params: buildParams(params) });
      set({ overview: { data: data.data, loading: false, error: null } });
    } catch (e: any) {
      set({ overview: { data: null, loading: false, error: e.response?.data?.error ?? 'Error al cargar resumen' } });
    }
  },

  fetchLessons: async (params) => {
    set((s) => ({ lessons: { ...s.lessons, loading: true, error: null } }));
    try {
      const { data } = await api.get('/admin/analytics/lessons', { params: buildParams(params) });
      set({ lessons: { data: data.data, loading: false, error: null } });
    } catch (e: any) {
      set({ lessons: { data: null, loading: false, error: e.response?.data?.error ?? 'Error al cargar lecciones' } });
    }
  },

  fetchRetention: async (params) => {
    set((s) => ({ retention: { ...s.retention, loading: true, error: null } }));
    try {
      const { data } = await api.get('/admin/analytics/retention', { params: buildParams(params) });
      set({ retention: { data: data.data, loading: false, error: null } });
    } catch (e: any) {
      set({ retention: { data: null, loading: false, error: e.response?.data?.error ?? 'Error al cargar retención' } });
    }
  },

  fetchFunnel: async (params) => {
    set((s) => ({ funnel: { ...s.funnel, loading: true, error: null } }));
    try {
      const { data } = await api.get('/admin/analytics/funnel', { params: buildParams(params) });
      set({ funnel: { data: data.data, loading: false, error: null } });
    } catch (e: any) {
      set({ funnel: { data: null, loading: false, error: e.response?.data?.error ?? 'Error al cargar embudo' } });
    }
  },

  fetchExercises: async (lessonId?: string) => {
    set((s) => ({ exercises: { ...s.exercises, loading: true, error: null } }));
    try {
      const params = lessonId ? { lessonId } : {};
      const { data } = await api.get('/admin/analytics/exercises', { params });
      set({ exercises: { data: data.data, loading: false, error: null } });
    } catch (e: any) {
      set({ exercises: { data: null, loading: false, error: e.response?.data?.error ?? 'Error al cargar ejercicios' } });
    }
  },

  fetchHeatmap: async (params?: DateRangeParams) => {
    set((s) => ({ heatmap: { ...s.heatmap, loading: true, error: null } }));
    try {
      const { data } = await api.get('/admin/analytics/heatmap', { params: buildParams(params) });
      set({ heatmap: { data: data.data, loading: false, error: null } });
    } catch (e: any) {
      set({ heatmap: { data: null, loading: false, error: e.response?.data?.error ?? 'Error al cargar mapa de calor' } });
    }
  },
}));
