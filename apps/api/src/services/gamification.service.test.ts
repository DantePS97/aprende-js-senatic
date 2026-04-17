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
  it('returns full XP when no hints used', () => {
    expect(calculateXpReward(100, 0)).toBe(100);
  });

  it('returns 67% of XP when 1 hint used', () => {
    expect(calculateXpReward(100, 1)).toBe(67);
  });

  it('returns 33% of XP when 2+ hints used', () => {
    expect(calculateXpReward(100, 2)).toBe(33);
    expect(calculateXpReward(100, 5)).toBe(33);
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
});
