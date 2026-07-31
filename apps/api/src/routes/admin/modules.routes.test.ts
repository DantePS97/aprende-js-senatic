import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { signAccessToken } from '../../lib/jwt';

// ─── Module-level stubs ───────────────────────────────────────────────────────

vi.mock('../../services/email.service', () => ({
  emailService: { sendPasswordReset: vi.fn() },
}));

vi.mock('../../models/Module.model', () => ({
  ModuleModel: {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../models/Lesson.model', () => ({
  LessonModel: { countDocuments: vi.fn() },
}));

vi.mock('../../services/audit.service', () => ({
  writeAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/reward.service', () => ({
  provisionModuleBadge: vi.fn().mockResolvedValue(undefined),
}));

import { ModuleModel } from '../../models/Module.model';
import { LessonModel } from '../../models/Lesson.model';
import { provisionModuleBadge } from '../../services/reward.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ADMIN_USER = { userId: '507f1f77bcf86cd799439011', email: 'admin@example.com', isAdmin: true };
const authHeader = () => ({ Authorization: `Bearer ${signAccessToken(ADMIN_USER)}` });

const COURSE_ID = '507f1f77bcf86cd799439033';
const MODULE_ID = '507f1f77bcf86cd799439044';

// ─── POST /api/admin/modules ──────────────────────────────────────────────────

describe('POST /api/admin/modules', () => {
  beforeEach(() => vi.clearAllMocks());

  it('provisions the module badge when created as published', async () => {
    vi.mocked(ModuleModel.findOne).mockReturnValue({
      sort: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue(null) }),
    } as any);
    vi.mocked(ModuleModel.create).mockResolvedValue({
      _id: MODULE_ID,
      courseId: COURSE_ID,
      title: 'Funciones',
      isPublished: true,
    } as any);

    const res = await request(app)
      .post('/api/admin/modules')
      .set(authHeader())
      .send({ courseId: COURSE_ID, title: 'Funciones y Scope', isPublished: true });

    expect(res.status).toBe(201);
    expect(provisionModuleBadge).toHaveBeenCalledWith(MODULE_ID, 'Funciones');
  });

  it('does not provision the module badge when created unpublished', async () => {
    vi.mocked(ModuleModel.findOne).mockReturnValue({
      sort: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue(null) }),
    } as any);
    vi.mocked(ModuleModel.create).mockResolvedValue({
      _id: MODULE_ID,
      courseId: COURSE_ID,
      title: 'Funciones',
      isPublished: false,
    } as any);

    const res = await request(app)
      .post('/api/admin/modules')
      .set(authHeader())
      .send({ courseId: COURSE_ID, title: 'Funciones y Scope', isPublished: false });

    expect(res.status).toBe(201);
    expect(provisionModuleBadge).not.toHaveBeenCalled();
  });
});

// ─── PUT /api/admin/modules/:id ───────────────────────────────────────────────

describe('PUT /api/admin/modules/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  function mockExistingModule(overrides: Record<string, unknown> = {}) {
    const doc: any = {
      _id: MODULE_ID,
      courseId: COURSE_ID,
      title: 'Funciones',
      isPublished: false,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      save: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    };
    vi.mocked(ModuleModel.findById).mockResolvedValue(doc);
    return doc;
  }

  it('provisions the module badge when an update publishes the module', async () => {
    const doc = mockExistingModule({ isPublished: false });

    const res = await request(app)
      .put(`/api/admin/modules/${MODULE_ID}`)
      .set(authHeader())
      .send({ isPublished: true, updatedAt: doc.updatedAt.toISOString() });

    expect(res.status).toBe(200);
    expect(provisionModuleBadge).toHaveBeenCalledWith(MODULE_ID, doc.title);
  });

  it('does not provision the module badge on a non-publish update', async () => {
    const doc = mockExistingModule({ isPublished: false });

    const res = await request(app)
      .put(`/api/admin/modules/${MODULE_ID}`)
      .set(authHeader())
      .send({ description: 'Nueva descripción', updatedAt: doc.updatedAt.toISOString() });

    expect(res.status).toBe(200);
    expect(provisionModuleBadge).not.toHaveBeenCalled();
  });

  it('provisions the module badge again on a republish update (idempotent — safe per design)', async () => {
    const doc = mockExistingModule({ isPublished: true });

    const res = await request(app)
      .put(`/api/admin/modules/${MODULE_ID}`)
      .set(authHeader())
      .send({ isPublished: true, updatedAt: doc.updatedAt.toISOString() });

    expect(res.status).toBe(200);
    expect(provisionModuleBadge).toHaveBeenCalledWith(MODULE_ID, doc.title);
  });
});
