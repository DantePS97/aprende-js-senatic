import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Module-level mocks ───────────────────────────────────────────────────────

// Both ModuleModel.find().select() and LessonModel.find().select() are called
// as chained Mongoose queries. Mocks must return a chainable object.
vi.mock('../models/Course.model', () => ({
  CourseModel: { findOne: vi.fn() },
}));

vi.mock('../models/Module.model', () => ({
  ModuleModel: { find: vi.fn() },
}));

vi.mock('../models/Lesson.model', () => ({
  LessonModel: { find: vi.fn() },
}));

vi.mock('../models/Progress.model', () => ({
  ProgressModel: { countDocuments: vi.fn() },
}));

import { CourseModel } from '../models/Course.model';
import { ModuleModel } from '../models/Module.model';
import { LessonModel } from '../models/Lesson.model';
import { ProgressModel } from '../models/Progress.model';
import { computeUnlockStatus } from './challengeUnlock.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USER_ID = '507f1f77bcf86cd799439011';
const COURSE_ID = '507f1f77bcf86cd799439022';
const MODULE_ID = '507f1f77bcf86cd799439033';

function makeLessonIds(count: number) {
  return Array.from({ length: count }, (_, i) => ({ _id: `lesson-id-${i}` }));
}

/**
 * Returns a chainable mock for Model.find().select().
 * Matches the Mongoose query pattern used in computeUnlockStatus.
 */
function mockFind(model: { find: ReturnType<typeof vi.fn> }, resolvedValue: object[]) {
  const queryLike = {
    select: vi.fn().mockResolvedValue(resolvedValue),
  };
  model.find.mockReturnValue(queryLike as any);
}

// ─── computeUnlockStatus ─────────────────────────────────────────────────────

describe('computeUnlockStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Curso no existe ──────────────────────────────────────────────────────

  it('returns unlocked=false with 0/0 and 0% when course javascript-basico does not exist', async () => {
    vi.mocked(CourseModel.findOne).mockResolvedValue(null);

    const status = await computeUnlockStatus(USER_ID);

    expect(status.unlocked).toBe(false);
    expect(status.completedLessons).toBe(0);
    expect(status.totalLessons).toBe(0);
    expect(status.progressPercent).toBe(0);
    expect(status.requiredCourseSlug).toBe('javascript-basico');
  });

  // ─── Curso existe pero sin lecciones publicadas ───────────────────────────

  it('returns unlocked=false with 0/0 and 0% when course has no published lessons', async () => {
    vi.mocked(CourseModel.findOne).mockResolvedValue({ _id: COURSE_ID });
    mockFind(vi.mocked(ModuleModel), [{ _id: MODULE_ID }]);
    mockFind(vi.mocked(LessonModel), []); // no published lessons

    const status = await computeUnlockStatus(USER_ID);

    expect(status.unlocked).toBe(false);
    expect(status.completedLessons).toBe(0);
    expect(status.totalLessons).toBe(0);
    expect(status.progressPercent).toBe(0);
  });

  // ─── Curso con módulos vacíos ─────────────────────────────────────────────

  it('returns unlocked=false when course has no modules', async () => {
    vi.mocked(CourseModel.findOne).mockResolvedValue({ _id: COURSE_ID });
    mockFind(vi.mocked(ModuleModel), []);
    mockFind(vi.mocked(LessonModel), []);

    const status = await computeUnlockStatus(USER_ID);

    expect(status.unlocked).toBe(false);
    expect(status.totalLessons).toBe(0);
  });

  // ─── 0/N completadas ─────────────────────────────────────────────────────

  it('returns unlocked=false and progressPercent=0 when user completed 0 of N lessons', async () => {
    const lessons = makeLessonIds(5);
    vi.mocked(CourseModel.findOne).mockResolvedValue({ _id: COURSE_ID });
    mockFind(vi.mocked(ModuleModel), [{ _id: MODULE_ID }]);
    mockFind(vi.mocked(LessonModel), lessons as any);
    vi.mocked(ProgressModel.countDocuments).mockResolvedValue(0);

    const status = await computeUnlockStatus(USER_ID);

    expect(status.unlocked).toBe(false);
    expect(status.totalLessons).toBe(5);
    expect(status.completedLessons).toBe(0);
    expect(status.progressPercent).toBe(0);
  });

  // ─── Algunas lecciones completadas (3/5) ─────────────────────────────────

  it('returns unlocked=false and progressPercent=60 when user completed 3 of 5 lessons', async () => {
    const lessons = makeLessonIds(5);
    vi.mocked(CourseModel.findOne).mockResolvedValue({ _id: COURSE_ID });
    mockFind(vi.mocked(ModuleModel), [{ _id: MODULE_ID }]);
    mockFind(vi.mocked(LessonModel), lessons as any);
    vi.mocked(ProgressModel.countDocuments).mockResolvedValue(3);

    const status = await computeUnlockStatus(USER_ID);

    expect(status.unlocked).toBe(false);
    expect(status.completedLessons).toBe(3);
    expect(status.totalLessons).toBe(5);
    expect(status.progressPercent).toBe(60);
  });

  // ─── Todas las lecciones completadas ─────────────────────────────────────

  it('returns unlocked=true and progressPercent=100 when user completed ALL lessons', async () => {
    const lessons = makeLessonIds(4);
    vi.mocked(CourseModel.findOne).mockResolvedValue({ _id: COURSE_ID });
    mockFind(vi.mocked(ModuleModel), [{ _id: MODULE_ID }]);
    mockFind(vi.mocked(LessonModel), lessons as any);
    vi.mocked(ProgressModel.countDocuments).mockResolvedValue(4);

    const status = await computeUnlockStatus(USER_ID);

    expect(status.unlocked).toBe(true);
    expect(status.completedLessons).toBe(4);
    expect(status.totalLessons).toBe(4);
    expect(status.progressPercent).toBe(100);
  });

  // ─── progressPercent se redondea ─────────────────────────────────────────

  it('rounds progressPercent correctly using Math.round (1/3 → 33)', async () => {
    // 1/3 = 0.333... → Math.round(33.33) = 33
    const lessons = makeLessonIds(3);
    vi.mocked(CourseModel.findOne).mockResolvedValue({ _id: COURSE_ID });
    mockFind(vi.mocked(ModuleModel), [{ _id: MODULE_ID }]);
    mockFind(vi.mocked(LessonModel), lessons as any);
    vi.mocked(ProgressModel.countDocuments).mockResolvedValue(1);

    const status = await computeUnlockStatus(USER_ID);

    expect(status.progressPercent).toBe(33);
  });
});
