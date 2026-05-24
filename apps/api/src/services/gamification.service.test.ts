import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { calculateLevel, calculateXpReward, updateStreak, checkAchievements } from './gamification.service';
import { UserModel } from '../models/User.model';

// ─── Pure function tests (no mocks needed) ────────────────────────────────────

describe('calculateLevel', () => {
  it('returns level 1 for 0 XP', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('returns level 1 for 100 XP (boundary)', () => {
    expect(calculateLevel(100)).toBe(1);
  });

  it('returns level 2 for 101 XP', () => {
    expect(calculateLevel(101)).toBe(2);
  });

  it('returns level 3 for 301 XP', () => {
    expect(calculateLevel(301)).toBe(3);
  });

  it('returns level 5 for 1001 XP', () => {
    expect(calculateLevel(1001)).toBe(5);
  });

  it('returns level 6 for 1500 XP', () => {
    expect(calculateLevel(1500)).toBe(6);
  });

  it('returns level 7 for 2500 XP', () => {
    expect(calculateLevel(2500)).toBe(7);
  });

  it('returns level 8 for 4000 XP', () => {
    expect(calculateLevel(4000)).toBe(8);
  });

  it('returns level 9 for 6000 XP', () => {
    expect(calculateLevel(6000)).toBe(9);
  });

  it('returns level 10 for 9000 XP', () => {
    expect(calculateLevel(9000)).toBe(10);
  });

  it('returns level 10 (max) for very high XP', () => {
    expect(calculateLevel(99999)).toBe(10);
  });
});

describe('calculateXpReward', () => {
  // ─── Penalización por pistas ────────────────────────────────────────────────
  it('returns full XP when no hints used', () => {
    expect(calculateXpReward(100, 0)).toBe(100);
  });

  it('returns 75% of XP when 1 hint used', () => {
    expect(calculateXpReward(100, 1)).toBe(75);
  });

  it('returns 50% of XP when 2 hints used (floor)', () => {
    expect(calculateXpReward(100, 2)).toBe(50);
  });

  it('returns same 50% floor for 3+ hints', () => {
    expect(calculateXpReward(100, 5)).toBe(50);
    expect(calculateXpReward(100, 10)).toBe(50);
  });

  // ─── Bonus por racha ────────────────────────────────────────────────────────
  it('applies no bonus for streak < 7', () => {
    expect(calculateXpReward(100, 0, 6)).toBe(100);
  });

  it('applies +5% bonus for streak 7–13', () => {
    expect(calculateXpReward(100, 0, 7)).toBe(105);
    expect(calculateXpReward(100, 0, 13)).toBe(105);
  });

  it('applies +10% bonus for streak 14–29', () => {
    expect(calculateXpReward(100, 0, 14)).toBe(110);
    expect(calculateXpReward(100, 0, 29)).toBe(110);
  });

  it('applies +20% bonus for streak 30+', () => {
    expect(calculateXpReward(100, 0, 30)).toBe(120);
    expect(calculateXpReward(100, 0, 99)).toBe(120);
  });

  // ─── Combinación pistas + racha ─────────────────────────────────────────────
  it('applies streak bonus on top of hint-penalized XP', () => {
    // 1 pista (75%) + racha 7 (+5%) = 75 * 1.05 = 78.75 → 79
    expect(calculateXpReward(100, 1, 7)).toBe(79);
    // 2 pistas (50%) + racha 30 (+20%) = 50 * 1.20 = 60
    expect(calculateXpReward(100, 2, 30)).toBe(60);
  });
});

// ─── updateStreak — mocked UserModel ─────────────────────────────────────────

vi.mock('../models/User.model', () => {
  const mockUser = {
    streak: 0,
    lastActiveDate: new Date(),
    save: vi.fn().mockResolvedValue(undefined),
  };
  return {
    UserModel: {
      findById: vi.fn().mockResolvedValue(mockUser),
    },
    _mockUser: mockUser,
  };
});

describe('updateStreak', () => {
  let mockUser: any;

  beforeEach(async () => {
    vi.useRealTimers();
    const mod = await vi.importMock<any>('../models/User.model');
    mockUser = mod._mockUser;
    mockUser.streak = 0;
    mockUser.save.mockClear();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('starts streak at 1 on first active day (diffDays=0, streak=0)', async () => {
    mockUser.lastActiveDate = new Date(); // same UTC day
    mockUser.streak = 0;
    const { streak } = await updateStreak('user-1');
    expect(streak).toBe(1);
  });

  it('increments streak when last active was yesterday', async () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    mockUser.lastActiveDate = yesterday;
    mockUser.streak = 3;
    const { streak, streakIncremented } = await updateStreak('user-1');
    expect(streak).toBe(4);
    expect(streakIncremented).toBe(true);
  });

  it('resets streak to 1 when gap > 1 day', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);
    mockUser.lastActiveDate = threeDaysAgo;
    mockUser.streak = 10;
    const { streak } = await updateStreak('user-1');
    expect(streak).toBe(1);
  });

  it('does not modify streak when already active today with streak > 0', async () => {
    mockUser.lastActiveDate = new Date(); // today
    mockUser.streak = 5;
    const { streak, streakIncremented } = await updateStreak('user-1');
    expect(streak).toBe(5);
    expect(streakIncremented).toBe(false);
  });

  it('increments streak using a past activityDate (offline sync scenario)', async () => {
    const monday = new Date('2025-06-02T10:00:00Z');
    const tuesday = new Date('2025-06-03T10:00:00Z');
    mockUser.lastActiveDate = monday;
    mockUser.streak = 2;
    const { streak, streakIncremented } = await updateStreak('user-1', tuesday);
    expect(streak).toBe(3);
    expect(streakIncremented).toBe(true);
  });

  it('resets streak using a past activityDate with gap > 1 day (offline sync)', async () => {
    const monday = new Date('2025-06-02T10:00:00Z');
    const thursday = new Date('2025-06-05T10:00:00Z');
    mockUser.lastActiveDate = monday;
    mockUser.streak = 5;
    const { streak } = await updateStreak('user-1', thursday);
    expect(streak).toBe(1);
  });

  it('saves activityDate as lastActiveDate, not the current date', async () => {
    const pastDate = new Date('2025-03-15T08:00:00Z');
    mockUser.lastActiveDate = new Date('2025-03-14T08:00:00Z');
    mockUser.streak = 1;
    await updateStreak('user-1', pastDate);
    expect(mockUser.lastActiveDate).toEqual(pastDate);
  });
});

// ─── checkAchievements — idempotent upsert ────────────────────────────────────
//
// These tests focus on the race-condition safety of the UserAchievement upsert:
// findOneAndUpdate returns null  → document was just created → push to result
// findOneAndUpdate returns doc   → document already existed  → skip (no duplicate)

vi.mock('../models/Achievement.model', () => ({
  AchievementModel: { find: vi.fn() },
  UserAchievementModel: {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('../models/Progress.model', () => ({
  ProgressModel: { find: vi.fn() },
}));

vi.mock('../models/Lesson.model', () => ({
  LessonModel: { find: vi.fn() },
}));

vi.mock('../models/ChallengeProgress.model', () => ({
  ChallengeProgressModel: { find: vi.fn() },
}));

vi.mock('../models/Challenge.model', () => ({
  ChallengeModel: { find: vi.fn() },
}));

import { AchievementModel, UserAchievementModel } from '../models/Achievement.model';
import { ProgressModel } from '../models/Progress.model';
import { LessonModel } from '../models/Lesson.model';
import { ChallengeProgressModel } from '../models/ChallengeProgress.model';
import { ChallengeModel } from '../models/Challenge.model';

const USER_ID = '507f1f77bcf86cd799439011';

const MOCK_ACHIEVEMENT = {
  _id: { toString: () => 'ach-1' },
  key: 'first_lesson',
  title: 'Primera lección',
  description: 'Completa tu primera lección',
  iconEmoji: '🎉',
  condition: { type: 'lessons_completed', threshold: 1 },
};

/** Wire up all the parallel-batch mocks for checkAchievements. */
function setupCheckMocks() {
  const mockUser = {
    _id: USER_ID,
    streak: 5,
    xp: 200,
    lastActiveDate: new Date(),
  };

  // Batch 1
  vi.mocked(UserModel.findById).mockResolvedValue(mockUser as any);
  vi.mocked(UserAchievementModel.find).mockReturnValue({
    select: vi.fn().mockResolvedValue([]),
  } as any);
  vi.mocked(AchievementModel.find).mockResolvedValue([MOCK_ACHIEVEMENT] as any);

  // Batch 2 — 1 completed lesson satisfies `lessons_completed >= 1`
  vi.mocked(ProgressModel.find).mockResolvedValue([
    { lessonId: { toString: () => 'l1' }, hintsUsed: 0, completedAt: new Date(), status: 'completed' },
  ] as any);
  vi.mocked(LessonModel.find).mockResolvedValue([
    { _id: { toString: () => 'l1' }, moduleId: { toString: () => 'm1' } },
  ] as any);
  vi.mocked(ChallengeProgressModel.find).mockResolvedValue([] as any);
  vi.mocked(ChallengeModel.find).mockResolvedValue([] as any);
}

describe('checkAchievements — idempotent upsert', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the achievement when findOneAndUpdate inserts it (null pre-image)', async () => {
    setupCheckMocks();
    // null means the document didn't exist before → we just created it
    vi.mocked(UserAchievementModel.findOneAndUpdate).mockResolvedValue(null);

    const result = await checkAchievements(USER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('first_lesson');
    expect(UserAchievementModel.findOneAndUpdate).toHaveBeenCalledOnce();
  });

  it('does NOT return the achievement when findOneAndUpdate finds a pre-existing doc (race condition)', async () => {
    setupCheckMocks();
    // non-null means the document already existed → concurrent insert beat us to it
    vi.mocked(UserAchievementModel.findOneAndUpdate).mockResolvedValue({
      _id: 'existing-doc',
    } as any);

    const result = await checkAchievements(USER_ID);

    expect(result).toHaveLength(0);
    expect(UserAchievementModel.findOneAndUpdate).toHaveBeenCalledOnce();
  });

  it('skips achievements already in earnedIds without calling findOneAndUpdate', async () => {
    // Achievement is in earnedIds → the loop short-circuits before the upsert
    vi.mocked(UserModel.findById).mockResolvedValue({ streak: 0, xp: 0, lastActiveDate: new Date() } as any);
    vi.mocked(UserAchievementModel.find).mockReturnValue({
      select: vi.fn().mockResolvedValue([
        { achievementId: { toString: () => 'ach-1' } },
      ]),
    } as any);
    vi.mocked(AchievementModel.find).mockResolvedValue([MOCK_ACHIEVEMENT] as any);
    vi.mocked(ProgressModel.find).mockResolvedValue([] as any);
    vi.mocked(LessonModel.find).mockResolvedValue([] as any);
    vi.mocked(ChallengeProgressModel.find).mockResolvedValue([] as any);
    vi.mocked(ChallengeModel.find).mockResolvedValue([] as any);

    const result = await checkAchievements(USER_ID);

    expect(result).toHaveLength(0);
    expect(UserAchievementModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('returns empty array when user is not found', async () => {
    vi.mocked(UserModel.findById).mockResolvedValue(null);
    vi.mocked(UserAchievementModel.find).mockReturnValue({
      select: vi.fn().mockResolvedValue([]),
    } as any);
    vi.mocked(AchievementModel.find).mockResolvedValue([] as any);

    const result = await checkAchievements(USER_ID);

    expect(result).toHaveLength(0);
    expect(UserAchievementModel.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
