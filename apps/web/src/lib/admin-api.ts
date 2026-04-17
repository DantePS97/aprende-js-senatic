// Admin API client — wraps all admin endpoints using the existing axios instance.
// The `api` instance already injects Authorization: Bearer {token} via its
// request interceptor (apps/web/src/lib/api.ts), so no manual token handling
// is needed here.

import { api } from '@/lib/api';
import type { AxiosResponse, AxiosError } from 'axios';
import type {
  CourseCreateInput,
  CourseUpdateInput,
  ModuleCreateInput,
  ModuleUpdateInput,
  LessonCreateInput,
  LessonUpdateInput,
  LessonContentInput,
} from '@senatic/shared';

// ─── Structured error ─────────────────────────────────────────────────────────
// All admin-api calls throw this shape on non-2xx responses.
// Catch blocks can switch on `err.code` without casting to raw Axios types.

export interface AdminApiError {
  code: string;
  status: number;
  details: unknown;
}

function normalizeError(err: unknown): never {
  const axiosErr = err as AxiosError<{ error?: string; code?: string }>;
  const status = axiosErr.response?.status ?? 0;
  const body = axiosErr.response?.data;

  let code: string;
  if (status === 409) {
    code = body?.error ?? body?.code ?? 'CONFLICT';
  } else if (status === 404) {
    code = 'NOT_FOUND';
  } else if (status >= 400 && status < 500) {
    code = body?.error ?? body?.code ?? 'CLIENT_ERROR';
  } else if (status >= 500) {
    code = 'SERVER_ERROR';
  } else {
    code = 'NETWORK_ERROR';
  }

  throw { code, status, details: body } satisfies AdminApiError;
}

// ─── Generic response unwrapper ───────────────────────────────────────────────

function unwrap<T>(response: AxiosResponse<{ success: boolean; data: T }>): T {
  return response.data.data;
}

async function call<T>(promise: Promise<AxiosResponse<{ success: boolean; data: T }>>): Promise<T> {
  try {
    return unwrap(await promise);
  } catch (err) {
    // If the error was already normalized (re-thrown from a nested call), pass through.
    if (err && typeof err === 'object' && 'code' in err && 'status' in err) throw err;
    normalizeError(err);
  }
}

// ─── Courses ──────────────────────────────────────────────────────────────────

const courses = {
  list: () =>
    call(api.get('/admin/courses')),

  create: (data: CourseCreateInput) =>
    call(api.post('/admin/courses', data)),

  get: (id: string) =>
    call(api.get(`/admin/courses/${id}`)),

  update: (id: string, data: CourseUpdateInput) =>
    call(api.put(`/admin/courses/${id}`, data)),

  delete: (id: string) =>
    call(api.delete(`/admin/courses/${id}`)),

  reorder: (id: string, direction: 'up' | 'down') =>
    call(api.post(`/admin/courses/${id}/reorder`, { direction })),
};

// ─── Modules ──────────────────────────────────────────────────────────────────

const modules = {
  list: (courseId: string) =>
    call(api.get('/admin/modules', { params: { courseId } })),

  create: (data: ModuleCreateInput) =>
    call(api.post('/admin/modules', data)),

  get: (id: string) =>
    call(api.get(`/admin/modules/${id}`)),

  update: (id: string, data: ModuleUpdateInput) =>
    call(api.put(`/admin/modules/${id}`, data)),

  delete: (id: string) =>
    call(api.delete(`/admin/modules/${id}`)),

  reorder: (id: string, direction: 'up' | 'down') =>
    call(api.post(`/admin/modules/${id}/reorder`, { direction })),
};

// ─── Lessons ──────────────────────────────────────────────────────────────────

const lessons = {
  list: (moduleId: string) =>
    call(api.get('/admin/lessons', { params: { moduleId } })),

  create: (data: LessonCreateInput) =>
    call(api.post('/admin/lessons', data)),

  get: (id: string) =>
    call(api.get(`/admin/lessons/${id}`)),

  update: (id: string, data: LessonUpdateInput) =>
    call(api.put(`/admin/lessons/${id}`, data)),

  delete: (id: string) =>
    call(api.delete(`/admin/lessons/${id}`)),

  reorder: (id: string, direction: 'up' | 'down') =>
    call(api.post(`/admin/lessons/${id}/reorder`, { direction })),

  content: {
    get: (id: string) =>
      call(api.get(`/admin/lessons/${id}/content`)),

    update: (id: string, data: LessonContentInput) =>
      call(api.put(`/admin/lessons/${id}/content`, data)),
  },
};

// ─── Users ────────────────────────────────────────────────────────────────────

const users = {
  promote: (email: string) =>
    call(api.post('/admin/users/promote', { email })),

  demote: (email: string) =>
    call(api.post('/admin/users/demote', { email })),
};

// ─── Audit ────────────────────────────────────────────────────────────────────

const audit = {
  list: (params?: { limit?: number; offset?: number }) =>
    api.get('/admin/audit', { params }).then((r) => r.data),
};

// ─── Unified export ───────────────────────────────────────────────────────────

export const adminApi = {
  courses,
  modules,
  lessons,
  users,
  audit,
};
