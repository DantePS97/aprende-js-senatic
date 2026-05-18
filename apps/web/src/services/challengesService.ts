import { api } from '@/lib/api';
import type {
  Challenge,
  ChallengeListItem,
  ChallengeProgress,
  UnlockStatus,
  SubmitChallengeInput,
  SubmitChallengeResponse,
} from '@senatic/shared';

export interface ListResponse {
  challenges: ChallengeListItem[];
  unlockStatus: UnlockStatus;
}

export interface DetailResponse {
  challenge: Challenge;
  progress: ChallengeProgress | null;
}

export const challengesService = {
  list: (): Promise<ListResponse> =>
    api.get('/challenges').then((r) => r.data.data),

  unlockStatus: (): Promise<UnlockStatus> =>
    api.get('/challenges/unlock-status').then((r) => r.data.data),

  get: (slug: string): Promise<DetailResponse> =>
    api.get(`/challenges/${slug}`).then((r) => r.data.data),

  submit: (slug: string, body: SubmitChallengeInput): Promise<SubmitChallengeResponse> =>
    api.post(`/challenges/${slug}/submit`, body).then((r) => r.data.data),

  adminList: (params: { page?: number; limit?: number; difficulty?: string; published?: boolean } = {}) =>
    api.get('/admin/challenges', { params }).then((r) => r.data.data),

  adminGet: (id: string): Promise<Challenge> =>
    api.get(`/admin/challenges/${id}`).then((r) => r.data.data),

  adminCreate: (body: unknown): Promise<Challenge> =>
    api.post('/admin/challenges', body).then((r) => r.data.data),

  adminUpdate: (id: string, body: unknown): Promise<Challenge> =>
    api.patch(`/admin/challenges/${id}`, body).then((r) => r.data.data),

  adminDelete: (id: string): Promise<void> =>
    api.delete(`/admin/challenges/${id}`).then(() => undefined),

  adminReorder: (items: Array<{ id: string; order: number }>): Promise<void> =>
    api.patch('/admin/challenges/reorder', { items }).then(() => undefined),
};
