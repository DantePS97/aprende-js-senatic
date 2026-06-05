import { create } from 'zustand';
import type { PushPermissionStatus, PushPreferences } from '@senatic/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PushState {
  status: PushPermissionStatus;
  preferences: PushPreferences | null;
  setStatus: (status: PushPermissionStatus) => void;
  setPreferences: (preferences: PushPreferences) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePushStore = create<PushState>((set) => ({
  status: 'default',
  preferences: null,
  setStatus: (status) => set({ status }),
  setPreferences: (preferences) => set({ preferences }),
}));
