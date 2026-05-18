import { create } from 'zustand';
import type { ChallengeListItem, UnlockStatus, SubmitChallengeResponse } from '@senatic/shared';

type DifficultyFilter = 'todos' | 'facil' | 'medio' | 'dificil';
type StatusFilter = 'todos' | 'resueltos' | 'pendientes';

interface ChallengesState {
  items: ChallengeListItem[];
  unlockStatus: UnlockStatus | null;
  difficultyFilter: DifficultyFilter;
  statusFilter: StatusFilter;
  solvedChallengeIds: Set<string>;
  lastSubmit: SubmitChallengeResponse | null;
  submitting: boolean;

  setItems: (items: ChallengeListItem[]) => void;
  setUnlockStatus: (status: UnlockStatus) => void;
  setDifficultyFilter: (f: DifficultyFilter) => void;
  setStatusFilter: (f: StatusFilter) => void;
  markSolved: (challengeId: string) => void;
  setSubmitting: (v: boolean) => void;
  setLastSubmit: (r: SubmitChallengeResponse | null) => void;
  reset: () => void;
}

export const useChallengesStore = create<ChallengesState>((set) => ({
  items: [],
  unlockStatus: null,
  difficultyFilter: 'todos',
  statusFilter: 'todos',
  solvedChallengeIds: new Set(),
  lastSubmit: null,
  submitting: false,

  setItems: (items) =>
    set({
      items,
      solvedChallengeIds: new Set(items.filter((i) => i.isSolved).map((i) => i._id)),
    }),
  setUnlockStatus: (unlockStatus) => set({ unlockStatus }),
  setDifficultyFilter: (difficultyFilter) => set({ difficultyFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  markSolved: (id) =>
    set((s) => {
      const next = new Set(s.solvedChallengeIds);
      next.add(id);
      return { solvedChallengeIds: next };
    }),
  setSubmitting: (submitting) => set({ submitting }),
  setLastSubmit: (lastSubmit) => set({ lastSubmit }),
  reset: () =>
    set({
      items: [],
      unlockStatus: null,
      difficultyFilter: 'todos',
      statusFilter: 'todos',
      solvedChallengeIds: new Set(),
      lastSubmit: null,
      submitting: false,
    }),
}));
