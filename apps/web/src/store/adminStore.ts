import { create } from 'zustand';
import type { Course, Module, LessonSummary } from '@senatic/shared';

// Admin store uses full entity types returned by the API.
// These map to Course, Module, LessonSummary from @senatic/shared.
// NOT persisted — state is re-derived from URL and API calls per tab.

interface AdminState {
  selectedCourse: Course | null;
  selectedModule: Module | null;
  selectedLesson: LessonSummary | null;
  pendingReorder: string | null; // entityId being reordered
  pendingSave: boolean;

  setSelectedCourse: (c: Course | null) => void;
  setSelectedModule: (m: Module | null) => void;
  setSelectedLesson: (l: LessonSummary | null) => void;
  setPendingReorder: (id: string | null) => void;
  setPendingSave: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  selectedCourse: null,
  selectedModule: null,
  selectedLesson: null,
  pendingReorder: null,
  pendingSave: false,
};

export const useAdminStore = create<AdminState>()((set) => ({
  ...initialState,

  setSelectedCourse: (c) => set({ selectedCourse: c }),
  setSelectedModule: (m) => set({ selectedModule: m }),
  setSelectedLesson: (l) => set({ selectedLesson: l }),
  setPendingReorder: (id) => set({ pendingReorder: id }),
  setPendingSave: (v) => set({ pendingSave: v }),
  reset: () => set(initialState),
}));
