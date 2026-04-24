import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { calculateLevel, calculateXpReward, updateStreak } from './gamification.service';

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

  it('returns level 5 for very high XP', () => {
    expect(calculateLevel(99999)).toBe(5);
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
