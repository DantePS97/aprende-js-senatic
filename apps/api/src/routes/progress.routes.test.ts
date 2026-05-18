import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { signAccessToken } from '../lib/jwt';

// ─── Module-level stubs ───────────────────────────────────────────────────────

// Avoid RESEND_API_KEY requirement at module load
vi.mock('../services/email.service', () => ({
  emailService: { sendPasswordReset: vi.fn() },
}));

vi.mock('../models/Lesson.model', () => ({
  LessonModel: { findById: vi.fn(), countDocuments: vi.fn(), find: vi.fn() },
}));

vi.mock('../models/Progress.model', () => ({
  ProgressModel: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../models/User.model', () => ({
  UserModel: { findById: vi.fn() },
}));

vi.mock('../models/ExerciseAttempt.model', () => ({
  ExerciseAttemptModel: { findOneAndUpdate: vi.fn() },
}));

vi.mock('../models/Course.model', () => ({
  CourseModel: { find: vi.fn() },
}));

vi.mock('../models/Module.model', () => ({
  ModuleModel: { find: vi.fn() },
}));

vi.mock('../services/gamification.service', () => ({
  awardXp: vi.fn(),
  calculateXpReward: vi.fn(),
  checkAchievements: vi.fn(),
  updateStreak: vi.fn(),
}));

vi.mock('../services/notification.service', () => ({
  notifyAchievementUnlocked: vi.fn().mockResolvedValue(undefined),
  notifyLevelUp: vi.fn().mockResolvedValue(undefined),
  notifyStreakMilestone: vi.fn().mockResolvedValue(undefined),
}));

import { LessonModel } from '../models/Lesson.model';
import { ProgressModel } from '../models/Progress.model';
import { UserModel } from '../models/User.model';
import { ExerciseAttemptModel } from '../models/ExerciseAttempt.model';
import { CourseModel } from '../models/Course.model';
import { ModuleModel } from '../models/Module.model';
import {
  awardXp,
  calculateXpReward,
  checkAchievements,
  updateStreak,
} from '../services/gamification.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TEST_USER = { userId: '507f1f77bcf86cd799439011', email: 'test@example.com', isAdmin: false };
const authHeader = () => ({ Authorization: `Bearer ${signAccessToken(TEST_USER)}` });

const LESSON_ID = '507f1f77bcf86cd799439022';

const validBody = {
  lessonId: LESSON_ID,
  passed: true,
  hintsUsed: 0,
  completedAt: new Date().toISOString(),
};

const mockProgressDoc = {
  _id: 'p1',
  userId: TEST_USER.userId,
  lessonId: LESSON_ID,
  status: 'completed',
  xpEarned: 100,
  attempts: 1,
  hintsUsed: 0,
  completedAt: new Date(),
};

// ─── POST /api/progress ───────────────────────────────────────────────────────

describe('POST /api/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkAchievements).mockResolvedValue([]);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/progress').send(validBody);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/progress')
      .set(authHeader())
      .send({ passed: true }); // missing lessonId, hintsUsed, completedAt
    expect(res.status).toBe(400);
  });

  it('returns 404 when lesson does not exist', async () => {
    vi.mocked(LessonModel.findById).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/progress')
      .set(authHeader())
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('awards XP on first completion when passed=true', async () => {
    vi.mocked(LessonModel.findById).mockResolvedValue({ _id: LESSON_ID, xpReward: 100 });
    vi.mocked(ProgressModel.findOne).mockResolvedValue(null); // first completion
    vi.mocked(UserModel.findById).mockResolvedValue({ streak: 3 });
    vi.mocked(calculateXpReward).mockReturnValue(100);
    vi.mocked(ProgressModel.findOneAndUpdate).mockResolvedValue(mockProgressDoc);
    vi.mocked(updateStreak).mockResolvedValue({ streak: 4, streakIncremented: true });
    vi.mocked(awardXp).mockResolvedValue({ leveledUp: false, newLevel: 2, newXp: 100 });

    const res = await request(app)
      .post('/api/progress')
      .set(authHeader())
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.xpEarned).toBe(100);
    expect(awardXp).toHaveBeenCalled();
    expect(updateStreak).toHaveBeenCalled();
  });

  it('does not award XP when lesson was already completed', async () => {
    vi.mocked(LessonModel.findById).mockResolvedValue({ _id: LESSON_ID, xpReward: 100 });
    vi.mocked(ProgressModel.findOne).mockResolvedValue({ status: 'completed' }); // already done
    vi.mocked(ProgressModel.findOneAndUpdate).mockResolvedValue(mockProgressDoc);

    const res = await request(app)
      .post('/api/progress')
      .set(authHeader())
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.data.xpEarned).toBe(0);
    expect(awardXp).not.toHaveBeenCalled();
    expect(updateStreak).not.toHaveBeenCalled();
  });

  it('does not award XP when passed=false', async () => {
    vi.mocked(LessonModel.findById).mockResolvedValue({ _id: LESSON_ID, xpReward: 100 });
    vi.mocked(ProgressModel.findOne).mockResolvedValue(null);
    vi.mocked(ProgressModel.findOneAndUpdate).mockResolvedValue({ ...mockProgressDoc, status: 'in_progress' });

    const res = await request(app)
      .post('/api/progress')
      .set(authHeader())
      .send({ ...validBody, passed: false });

    expect(res.status).toBe(200);
    expect(res.body.data.xpEarned).toBe(0);
    expect(awardXp).not.toHaveBeenCalled();
  });

  it('returns 500 when an unexpected error occurs', async () => {
    vi.mocked(LessonModel.findById).mockRejectedValue(new Error('DB timeout'));

    const res = await request(app)
      .post('/api/progress')
      .set(authHeader())
      .send(validBody);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─── POST /api/progress/exercise ─────────────────────────────────────────────

describe('POST /api/progress/exercise', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/progress/exercise').send({});
    expect(res.status).toBe(401);
  });

  it('returns 200 immediately (fire and forget)', async () => {
    vi.mocked(ExerciseAttemptModel.findOneAndUpdate).mockResolvedValue({});

    const res = await request(app)
      .post('/api/progress/exercise')
      .set(authHeader())
      .send({ lessonId: LESSON_ID, exerciseIndex: 0, exerciseTitle: 'Test', passed: true, hintsUsed: 0 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('still returns 200 even when the async persistence throws', async () => {
    vi.mocked(ExerciseAttemptModel.findOneAndUpdate).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/progress/exercise')
      .set(authHeader())
      .send({ lessonId: LESSON_ID, exerciseIndex: 0, passed: false, hintsUsed: 1 });

    // Route responds before the async block runs, so still 200
    expect(res.status).toBe(200);
  });
});

// ─── GET /api/progress/me ─────────────────────────────────────────────────────

describe('GET /api/progress/me', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/progress/me');
    expect(res.status).toBe(401);
  });

  it('returns all progress records for the authenticated user', async () => {
    const mockProgress = [
      { lessonId: LESSON_ID, status: 'completed' },
      { lessonId: 'other-lesson', status: 'in_progress' },
    ];
    vi.mocked(ProgressModel.find).mockResolvedValue(mockProgress);

    const res = await request(app)
      .get('/api/progress/me')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockProgress);
  });

  it('returns 500 when the DB throws', async () => {
    vi.mocked(ProgressModel.find).mockRejectedValue(new Error('connection lost'));

    const res = await request(app)
      .get('/api/progress/me')
      .set(authHeader());

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/progress/stats ──────────────────────────────────────────────────

describe('GET /api/progress/stats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/progress/stats');
    expect(res.status).toBe(401);
  });

  it('returns 404 when the user record does not exist', async () => {
    vi.mocked(UserModel.findById).mockResolvedValue(null);
    vi.mocked(ProgressModel.countDocuments).mockResolvedValue(0);
    vi.mocked(LessonModel.countDocuments).mockResolvedValue(10);

    const res = await request(app)
      .get('/api/progress/stats')
      .set(authHeader());

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns correct stats for an existing user', async () => {
    vi.mocked(UserModel.findById).mockResolvedValue({
      xp: 450,
      level: 3,
      streak: 7,
      lastActiveDate: new Date('2026-04-27T00:00:00Z'),
    });
    vi.mocked(ProgressModel.countDocuments).mockResolvedValue(9);
    vi.mocked(LessonModel.countDocuments).mockResolvedValue(30);

    const res = await request(app)
      .get('/api/progress/stats')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data.totalXp).toBe(450);
    expect(data.level).toBe(3);
    expect(data.streak).toBe(7);
    expect(data.completedLessons).toBe(9);
    expect(data.totalLessons).toBe(30);
    expect(data.percentageComplete).toBe(30); // Math.round(9/30*100)
  });

  it('returns percentageComplete=0 when there are no lessons', async () => {
    vi.mocked(UserModel.findById).mockResolvedValue({
      xp: 0, level: 1, streak: 0,
      lastActiveDate: new Date(),
    });
    vi.mocked(ProgressModel.countDocuments).mockResolvedValue(0);
    vi.mocked(LessonModel.countDocuments).mockResolvedValue(0);

    const res = await request(app)
      .get('/api/progress/stats')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.percentageComplete).toBe(0);
  });

  it('returns 500 when the DB throws', async () => {
    vi.mocked(UserModel.findById).mockRejectedValue(new Error('timeout'));

    const res = await request(app)
      .get('/api/progress/stats')
      .set(authHeader());

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/progress/courses ────────────────────────────────────────────────

const COURSE_ID = '507f1f77bcf86cd799439033';
const MODULE_ID = '507f1f77bcf86cd799439044';

describe('GET /api/progress/courses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/progress/courses');
    expect(res.status).toBe(401);
  });

  it('returns course progress array for the authenticated user', async () => {
    vi.mocked(CourseModel.find).mockReturnValue({
      sort: vi.fn().mockResolvedValue([
        { _id: COURSE_ID, slug: 'javascript-basico', title: 'JavaScript Básico', iconEmoji: '📘', isPublished: true, order: 1 },
      ]),
    } as any);

    vi.mocked(ModuleModel.find).mockResolvedValue([
      { _id: MODULE_ID, courseId: COURSE_ID, isPublished: true },
    ] as any);

    vi.mocked(LessonModel.find).mockResolvedValue([
      { _id: LESSON_ID, moduleId: MODULE_ID, isPublished: true },
      { _id: '507f1f77bcf86cd799439055', moduleId: MODULE_ID, isPublished: true },
    ] as any);

    vi.mocked(ProgressModel.countDocuments).mockResolvedValue(1);

    const res = await request(app)
      .get('/api/progress/courses')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    const entry = res.body.data[0];
    expect(entry.courseSlug).toBe('javascript-basico');
    expect(entry.totalLessons).toBe(2);
    expect(entry.completedLessons).toBe(1);
    expect(entry.percentageComplete).toBe(50);
  });

  it('returns percentageComplete=0 when course has no lessons', async () => {
    vi.mocked(CourseModel.find).mockReturnValue({
      sort: vi.fn().mockResolvedValue([
        { _id: COURSE_ID, slug: 'javascript-basico', title: 'JavaScript Básico', iconEmoji: '📘', isPublished: true, order: 1 },
      ]),
    } as any);

    vi.mocked(ModuleModel.find).mockResolvedValue([{ _id: MODULE_ID }] as any);
    vi.mocked(LessonModel.find).mockResolvedValue([] as any);

    const res = await request(app)
      .get('/api/progress/courses')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data[0].percentageComplete).toBe(0);
    expect(res.body.data[0].totalLessons).toBe(0);
    // countDocuments should NOT be called when there are no lessons
    expect(ProgressModel.countDocuments).not.toHaveBeenCalled();
  });

  it('returns empty array when there are no published courses', async () => {
    vi.mocked(CourseModel.find).mockReturnValue({
      sort: vi.fn().mockResolvedValue([]),
    } as any);

    const res = await request(app)
      .get('/api/progress/courses')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns 500 when CourseModel throws', async () => {
    vi.mocked(CourseModel.find).mockReturnValue({
      sort: vi.fn().mockRejectedValue(new Error('DB error')),
    } as any);

    const res = await request(app)
      .get('/api/progress/courses')
      .set(authHeader());

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
