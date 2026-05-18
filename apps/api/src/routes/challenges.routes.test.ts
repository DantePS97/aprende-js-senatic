import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { signAccessToken } from '../lib/jwt';

// ─── Module-level stubs ───────────────────────────────────────────────────────

// Required by app.ts at module load (email service)
vi.mock('../services/email.service', () => ({
  emailService: { sendPasswordReset: vi.fn() },
}));

vi.mock('../services/challengeUnlock.service', () => ({
  computeUnlockStatus: vi.fn(),
}));

vi.mock('../services/challenge.service', () => ({
  listChallengesForUser: vi.fn(),
  submitChallenge: vi.fn(),
}));

vi.mock('../models/Challenge.model', () => ({
  ChallengeModel: { findOne: vi.fn() },
}));

vi.mock('../models/ChallengeProgress.model', () => ({
  ChallengeProgressModel: { findOne: vi.fn() },
}));

// challengesUnlock.middleware uses computeUnlockStatus — already mocked above.
// We control unlocked/locked per test via the computeUnlockStatus mock.

import { computeUnlockStatus } from '../services/challengeUnlock.service';
import { listChallengesForUser, submitChallenge } from '../services/challenge.service';
import { ChallengeModel } from '../models/Challenge.model';
import { ChallengeProgressModel } from '../models/ChallengeProgress.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TEST_USER = { userId: '507f1f77bcf86cd799439011', email: 'test@example.com', isAdmin: false };
const authHeader = () => ({ Authorization: `Bearer ${signAccessToken(TEST_USER)}` });

const UNLOCKED_STATUS = {
  unlocked: true,
  requiredCourseSlug: 'javascript-basico' as const,
  completedLessons: 5,
  totalLessons: 5,
  progressPercent: 100,
};

const LOCKED_STATUS = {
  unlocked: false,
  requiredCourseSlug: 'javascript-basico' as const,
  completedLessons: 2,
  totalLessons: 5,
  progressPercent: 40,
};

const MOCK_CHALLENGE_DOC = {
  _id: '507f1f77bcf86cd799439099',
  slug: 'sum-two-numbers',
  title: 'Suma dos números',
  difficulty: 'facil',
  xpReward: 50,
  starterCode: 'function solution(a, b) {}',
  testCases: [
    { input: '1, 2', expectedOutput: '3', hidden: false, description: 'suma básica' },
    { input: '5, 7', expectedOutput: '12', hidden: true, description: 'test secreto' },
  ],
  order: 1,
  published: true,
  tags: ['math'],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  toObject() {
    return {
      ...this,
      testCases: this.testCases,
    };
  },
};

// ─── GET /api/challenges/unlock-status ───────────────────────────────────────

describe('GET /api/challenges/unlock-status', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/challenges/unlock-status');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 with unlock status for authenticated user', async () => {
    vi.mocked(computeUnlockStatus).mockResolvedValue(UNLOCKED_STATUS);

    const res = await request(app)
      .get('/api/challenges/unlock-status')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unlocked).toBe(true);
    expect(res.body.data.progressPercent).toBe(100);
    expect(computeUnlockStatus).toHaveBeenCalledWith(TEST_USER.userId);
  });

  it('returns 200 with locked status when user has not finished the course', async () => {
    vi.mocked(computeUnlockStatus).mockResolvedValue(LOCKED_STATUS);

    const res = await request(app)
      .get('/api/challenges/unlock-status')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.unlocked).toBe(false);
    expect(res.body.data.progressPercent).toBe(40);
  });

  it('returns 500 when computeUnlockStatus throws', async () => {
    vi.mocked(computeUnlockStatus).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .get('/api/challenges/unlock-status')
      .set(authHeader());

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/challenges ──────────────────────────────────────────────────────

describe('GET /api/challenges', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/challenges');
    expect(res.status).toBe(401);
  });

  it('returns 200 with challenges and unlock status', async () => {
    const mockResult = {
      challenges: [{ _id: 'c1', slug: 'sum-two-numbers', title: 'Suma', isSolved: false }],
      unlockStatus: LOCKED_STATUS,
    };
    vi.mocked(listChallengesForUser).mockResolvedValue(mockResult as any);

    const res = await request(app)
      .get('/api/challenges')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.challenges).toHaveLength(1);
    expect(res.body.data.unlockStatus).toBeDefined();
    expect(listChallengesForUser).toHaveBeenCalledWith(TEST_USER.userId);
  });

  it('returns 500 when listChallengesForUser throws', async () => {
    vi.mocked(listChallengesForUser).mockRejectedValue(new Error('connection refused'));

    const res = await request(app)
      .get('/api/challenges')
      .set(authHeader());

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/challenges/:slug ────────────────────────────────────────────────

describe('GET /api/challenges/:slug', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/challenges/sum-two-numbers');
    expect(res.status).toBe(401);
  });

  it('returns 403 CHALLENGES_LOCKED when user has not unlocked challenges', async () => {
    vi.mocked(computeUnlockStatus).mockResolvedValue(LOCKED_STATUS);

    const res = await request(app)
      .get('/api/challenges/sum-two-numbers')
      .set(authHeader());

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('CHALLENGES_LOCKED');
  });

  it('returns 404 when challenge slug does not exist', async () => {
    vi.mocked(computeUnlockStatus).mockResolvedValue(UNLOCKED_STATUS);
    vi.mocked(ChallengeModel.findOne).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/challenges/non-existent-slug')
      .set(authHeader());

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 with challenge data when unlocked and slug exists', async () => {
    vi.mocked(computeUnlockStatus).mockResolvedValue(UNLOCKED_STATUS);
    vi.mocked(ChallengeModel.findOne).mockResolvedValue(MOCK_CHALLENGE_DOC as any);
    vi.mocked(ChallengeProgressModel.findOne).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/challenges/sum-two-numbers')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.challenge.slug).toBe('sum-two-numbers');
    expect(res.body.data.progress).toBeNull();
  });

  it('strips description from hidden test cases before sending to client', async () => {
    vi.mocked(computeUnlockStatus).mockResolvedValue(UNLOCKED_STATUS);
    vi.mocked(ChallengeModel.findOne).mockResolvedValue(MOCK_CHALLENGE_DOC as any);
    vi.mocked(ChallengeProgressModel.findOne).mockResolvedValue(null);

    const res = await request(app)
      .get('/api/challenges/sum-two-numbers')
      .set(authHeader());

    expect(res.status).toBe(200);
    const testCases = res.body.data.challenge.testCases;

    // Visible test: description should be present
    const visible = testCases.find((tc: any) => !tc.hidden);
    expect(visible?.description).toBe('suma básica');

    // Hidden test: description should be stripped
    const hidden = testCases.find((tc: any) => tc.hidden);
    expect(hidden).toBeDefined();
    expect(hidden?.description).toBeUndefined();
  });

  it('returns progress when user has progress for the challenge', async () => {
    const mockProgress = {
      _id: 'prog1',
      userId: TEST_USER.userId,
      challengeId: MOCK_CHALLENGE_DOC._id,
      status: 'solved',
      firstSolvedAt: new Date('2026-01-15'),
      xpAwarded: 50,
    };
    vi.mocked(computeUnlockStatus).mockResolvedValue(UNLOCKED_STATUS);
    vi.mocked(ChallengeModel.findOne).mockResolvedValue(MOCK_CHALLENGE_DOC as any);
    vi.mocked(ChallengeProgressModel.findOne).mockResolvedValue(mockProgress as any);

    const res = await request(app)
      .get('/api/challenges/sum-two-numbers')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.progress).not.toBeNull();
    expect(res.body.data.progress.status).toBe('solved');
    expect(res.body.data.progress.xpAwarded).toBe(50);
  });
});

// ─── POST /api/challenges/:slug/submit ───────────────────────────────────────

describe('POST /api/challenges/:slug/submit', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/challenges/sum-two-numbers/submit')
      .send({ code: 'function solution(a,b){return a+b;}' });
    expect(res.status).toBe(401);
  });

  it('returns 403 when challenges are locked', async () => {
    vi.mocked(computeUnlockStatus).mockResolvedValue(LOCKED_STATUS);

    const res = await request(app)
      .post('/api/challenges/sum-two-numbers/submit')
      .set(authHeader())
      .send({ code: 'function solution(a,b){return a+b;}' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('CHALLENGES_LOCKED');
  });

  it('returns 400 when body is missing code field', async () => {
    vi.mocked(computeUnlockStatus).mockResolvedValue(UNLOCKED_STATUS);

    const res = await request(app)
      .post('/api/challenges/sum-two-numbers/submit')
      .set(authHeader())
      .send({}); // no code

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when body is empty', async () => {
    vi.mocked(computeUnlockStatus).mockResolvedValue(UNLOCKED_STATUS);

    const res = await request(app)
      .post('/api/challenges/sum-two-numbers/submit')
      .set(authHeader())
      .send();

    expect(res.status).toBe(400);
  });

  it('returns 200 with result when code is valid and challenges are unlocked', async () => {
    vi.mocked(computeUnlockStatus).mockResolvedValue(UNLOCKED_STATUS);

    const mockResult = {
      passed: true,
      testsPassedCount: 2,
      totalTests: 2,
      testResults: [
        { passed: true, description: 'suma básica' },
        { passed: true }, // hidden test — no description
      ],
      xpAwarded: 50,
      firstSolve: true,
      newAchievements: [],
    };
    vi.mocked(submitChallenge).mockResolvedValue(mockResult as any);

    const res = await request(app)
      .post('/api/challenges/sum-two-numbers/submit')
      .set(authHeader())
      .send({ code: 'function solution(a,b){return a+b;}' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.passed).toBe(true);
    expect(res.body.data.xpAwarded).toBe(50);
    expect(submitChallenge).toHaveBeenCalledWith(
      TEST_USER.userId,
      'sum-two-numbers',
      'function solution(a,b){return a+b;}'
    );
  });

  it('returns 404 when challenge is not found (NOT_FOUND code)', async () => {
    vi.mocked(computeUnlockStatus).mockResolvedValue(UNLOCKED_STATUS);

    const notFoundErr = Object.assign(new Error('CHALLENGE_NOT_FOUND'), { code: 'NOT_FOUND' });
    vi.mocked(submitChallenge).mockRejectedValue(notFoundErr);

    const res = await request(app)
      .post('/api/challenges/non-existent/submit')
      .set(authHeader())
      .send({ code: 'function solution(){}' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 500 when an unexpected error occurs during submission', async () => {
    vi.mocked(computeUnlockStatus).mockResolvedValue(UNLOCKED_STATUS);
    vi.mocked(submitChallenge).mockRejectedValue(new Error('DB timeout'));

    const res = await request(app)
      .post('/api/challenges/sum-two-numbers/submit')
      .set(authHeader())
      .send({ code: 'function solution(){}' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
