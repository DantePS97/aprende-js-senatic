// Admin API client — wraps all admin endpoints using the existing axios instance.
// The `api` instance already injects Authorization: Bearer {token} via its
// request interceptor (apps/web/src/lib/api.ts), so no manual token handling
// is needed here.

import { api } from '@/lib/api';
import type { AxiosResponse } from 'axios';
import type {
  CourseCreateInput,
  CourseUpdateInput,
  ModuleCreateInput,
  ModuleUpdateInput,
  LessonCreateInput,
  LessonUpdateInput,
  LessonContentInput,
} from '@senatic/shared';

// ─── Generic response unwrapper ───────────────────────────────────────────────

function unwrap<T>(response: AxiosResponse<{ success: boolean; data: T }>): T {
  return response.data.data;
}

// ─── Courses ──────────────────────────────────────────────────────────────────

const courses = {
  list: () =>
    api.get('/admin/courses').then(unwrap),

  create: (data: CourseCreateInput) =>
    api.post('/admin/courses', data).then(unwrap),

  get: (id: string) =>
    api.get(`/admin/courses/${id}`).then(unwrap),

  update: (id: string, data: CourseUpdateInput) =>
    api.put(`/admin/courses/${id}`, data).then(unwrap),

  delete: (id: string) =>
    api.delete(`/admin/courses/${id}`).then(unwrap),

  reorder: (id: string, direction: 'up' | 'down') =>
    api.post(`/admin/courses/${id}/reorder`, { direction }).then(unwrap),
};

// ─── Modules ──────────────────────────────────────────────────────────────────

const modules = {
  list: (courseId: string) =>
    api.get('/admin/modules', { params: { courseId } }).then(unwrap),

  create: (data: ModuleCreateInput) =>
    api.post('/admin/modules', data).then(unwrap),

  get: (id: string) =>
    api.get(`/admin/modules/${id}`).then(unwrap),

  update: (id: string, data: ModuleUpdateInput) =>
    api.put(`/admin/modules/${id}`, data).then(unwrap),

  delete: (id: string) =>
    api.delete(`/admin/modules/${id}`).then(unwrap),

  reorder: (id: string, direction: 'up' | 'down') =>
    api.post(`/admin/modules/${id}/reorder`, { direction }).then(unwrap),
};

// ─── Lessons ──────────────────────────────────────────────────────────────────

const lessons = {
  list: (moduleId: string) =>
    api.get('/admin/lessons', { params: { moduleId } }).then(unwrap),

  create: (data: LessonCreateInput) =>
    api.post('/admin/lessons', data).then(unwrap),

  get: (id: string) =>
    api.get(`/admin/lessons/${id}`).then(unwrap),

  update: (id: string, data: LessonUpdateInput) =>
    api.put(`/admin/lessons/${id}`, data).then(unwrap),

  delete: (id: string) =>
    api.delete(`/admin/lessons/${id}`).then(unwrap),

  reorder: (id: string, direction: 'up' | 'down') =>
    api.post(`/admin/lessons/${id}/reorder`, { direction }).then(unwrap),

  content: {
    get: (id: string) =>
      api.get(`/admin/lessons/${id}/content`).then(unwrap),

    update: (id: string, data: LessonContentInput) =>
      api.put(`/admin/lessons/${id}/content`, data).then(unwrap),
  },
};

// ─── Users ────────────────────────────────────────────────────────────────────

const users = {
  promote: (email: string) =>
    api.post('/admin/users/promote', { email }).then(unwrap),

  demote: (email: string) =>
    api.post('/admin/users/demote', { email }).then(unwrap),
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
