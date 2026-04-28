import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { getFunnel } from './funnel.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../models/Course.model', () => ({
  CourseModel: { findById: vi.fn() },
}));
vi.mock('../../models/Module.model', () => ({
  ModuleModel: { find: vi.fn() },
}));
vi.mock('../../models/Lesson.model', () => ({
  LessonModel: { find: vi.fn() },
}));
vi.mock('../../models/Progress.model', () => ({
  ProgressModel: { distinct: vi.fn(), aggregate: vi.fn() },
}));

import { CourseModel } from '../../models/Course.model';
import { ModuleModel } from '../../models/Module.model';
import { LessonModel } from '../../models/Lesson.model';
import { ProgressModel } from '../../models/Progress.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const oid = (hex = '000000000000000000000001') => new mongoose.Types.ObjectId(hex);

// Chainable .sort() mock that returns the array directly
function findWithSort<T>(items: T[]) {
  return { sort: vi.fn().mockResolvedValue(items) };
}

const COURSE_ID = '507f1f77bcf86cd799439011';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getFunnel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty stages when the course has no lessons', async () => {
    vi.mocked(CourseModel.findById).mockResolvedValue({ title: 'JS Básico' });
    vi.mocked(ModuleModel.find).mockReturnValue(findWithSort([{ _id: oid() }]) as any);
    vi.mocked(LessonModel.find).mockReturnValue(findWithSort([]) as any);

    const result = await getFunnel({ courseId: COURSE_ID });

    expect(result.stages).toHaveLength(0);
    expect(result.courseId).toBe(COURSE_ID);
    expect(result.courseTitle).toBe('JS Básico');
  });

  it('falls back to "(sin curso)" when course is not found', async () => {
    vi.mocked(CourseModel.findById).mockResolvedValue(null);
    vi.mocked(ModuleModel.find).mockReturnValue(findWithSort([]) as any);
    vi.mocked(LessonModel.find).mockReturnValue(findWithSort([]) as any);

    const { courseTitle } = await getFunnel({ courseId: COURSE_ID });
    expect(courseTitle).toBe('(sin curso)');
  });

  it('returns 5 stages with correct labels for a 4-lesson course', async () => {
    vi.mocked(CourseModel.findById).mockResolvedValue({ title: 'Curso A' });
    vi.mocked(ModuleModel.find).mockReturnValue(findWithSort([{ _id: oid() }]) as any);

    const lessonIds = [oid('100000000000000000000001'), oid('100000000000000000000002'),
                       oid('100000000000000000000003'), oid('100000000000000000000004')];
    vi.mocked(LessonModel.find).mockReturnValue(findWithSort(lessonIds.map((id) => ({ _id: id }))) as any);

    // enrolled=10, startedFirst=8, completedFirst=6, completedMid=4, completedAll=2
    vi.mocked(ProgressModel.distinct)
      .mockResolvedValueOnce(Array.from({ length: 10 }, (_, i) => `u${i}`)) // enrolled
      .mockResolvedValueOnce(Array.from({ length: 8 }, (_, i) => `u${i}`))  // startedFirst
      .mockResolvedValueOnce(Array.from({ length: 6 }, (_, i) => `u${i}`))  // completedFirst
      .mockResolvedValueOnce(Array.from({ length: 4 }, (_, i) => `u${i}`)); // completedMid
    vi.mocked(ProgressModel.aggregate).mockResolvedValue(
      Array.from({ length: 2 }, (_, i) => ({ _id: oid(`10000000000000000000000${i}`) })),
    );

    const result = await getFunnel({ courseId: COURSE_ID });

    expect(result.stages).toHaveLength(5);

    const [s0, s1, s2, s3, s4] = result.stages;
    expect(s0.stage).toBe('Inscrito');
    expect(s0.count).toBe(10);
    expect(s0.dropoffRate).toBe(0); // first stage has no dropoff

    expect(s1.stage).toBe('Inició lección 1');
    expect(s1.count).toBe(8);
    expect(s1.dropoffRate).toBeCloseTo(0.2); // (10-8)/10

    expect(s2.stage).toBe('Completó lección 1');
    expect(s2.count).toBe(6);
    expect(s2.dropoffRate).toBeCloseTo(0.25); // (8-6)/8

    expect(s3.stage).toMatch(/^Completó lección/);
    expect(s3.count).toBe(4);

    expect(s4.stage).toBe('Completó todo el curso');
    expect(s4.count).toBe(2);
    expect(s4.dropoffRate).toBeCloseTo(0.5); // (4-2)/4
  });

  it('sets dropoffRate=0 for any stage whose predecessor had count=0', async () => {
    vi.mocked(CourseModel.findById).mockResolvedValue({ title: 'Curso B' });
    vi.mocked(ModuleModel.find).mockReturnValue(findWithSort([{ _id: oid() }]) as any);
    vi.mocked(LessonModel.find).mockReturnValue(
      findWithSort([{ _id: oid('200000000000000000000001') }, { _id: oid('200000000000000000000002') }]) as any,
    );

    // All zero counts
    vi.mocked(ProgressModel.distinct)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(ProgressModel.aggregate).mockResolvedValue([]);

    const result = await getFunnel({ courseId: COURSE_ID });
    for (const stage of result.stages) {
      expect(stage.dropoffRate).toBe(0);
    }
  });

  it('correctly identifies the mid-lesson for an odd-length course', async () => {
    vi.mocked(CourseModel.findById).mockResolvedValue({ title: 'Curso C' });
    vi.mocked(ModuleModel.find).mockReturnValue(findWithSort([{ _id: oid() }]) as any);

    // 5 lessons → midIndex = floor(5/2) = 2 → "Completó lección 3"
    const lessonIds = Array.from({ length: 5 }, (_, i) =>
      oid(`30000000000000000000000${i + 1}`),
    );
    vi.mocked(LessonModel.find).mockReturnValue(
      findWithSort(lessonIds.map((id) => ({ _id: id }))) as any,
    );

    vi.mocked(ProgressModel.distinct)
      .mockResolvedValue([]);
    vi.mocked(ProgressModel.aggregate).mockResolvedValue([]);

    const { stages } = await getFunnel({ courseId: COURSE_ID });
    expect(stages[3].stage).toBe('Completó lección 3');
  });
});
