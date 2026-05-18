import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// ─── Module-level mocks ───────────────────────────────────────────────────────

// UserModel.findById is called with .select() chained in awardChallengeXp.
// We mock findById to return a thenable with a .select() method that resolves
// to the configured value — same pattern used in the real Mongoose query builder.
vi.mock('../models/User.model', () => ({
  UserModel: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock('../models/ChallengeProgress.model', () => ({
  ChallengeProgressModel: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('../models/WeeklyLeagueResult.model', () => ({
  WeeklyLeagueResultModel: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('./gamification.service', () => ({
  calculateLevel: vi.fn(),
}));

import { UserModel } from '../models/User.model';
import { ChallengeProgressModel } from '../models/ChallengeProgress.model';
import { WeeklyLeagueResultModel } from '../models/WeeklyLeagueResult.model';
import { calculateLevel } from './gamification.service';
import { awardChallengeXp } from './challengeXp.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USER_ID = '507f1f77bcf86cd799439011';
const CHALLENGE_ID = new mongoose.Types.ObjectId('507f1f77bcf86cd799439022');

/**
 * Creates a chainable mock for UserModel.findById(id).select(fields).
 * Mongoose query methods return `this` until awaited — we replicate the
 * minimal shape needed by the service.
 */
function mockFindById(resolvedValue: object | null) {
  const queryLike = {
    select: vi.fn().mockResolvedValue(resolvedValue),
  };
  vi.mocked(UserModel.findById).mockReturnValue(queryLike as any);
}

// ─── awardChallengeXp ─────────────────────────────────────────────────────────

describe('awardChallengeXp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: WeeklyLeagueResult update succeeds silently
    vi.mocked(WeeklyLeagueResultModel.findOneAndUpdate).mockResolvedValue({});
  });

  // ─── Primera vez: XP se otorga ────────────────────────────────────────────

  it('awards XP on first submission and returns correct xpAwarded', async () => {
    vi.mocked(ChallengeProgressModel.findOne).mockResolvedValue(null);
    mockFindById({ xp: 200, level: 2 });
    vi.mocked(calculateLevel).mockReturnValue(2);
    vi.mocked(UserModel.findByIdAndUpdate).mockResolvedValue({ xp: 300, level: 2 });
    vi.mocked(ChallengeProgressModel.findOneAndUpdate).mockResolvedValue({});

    const result = await awardChallengeXp(USER_ID, 100, CHALLENGE_ID);

    expect(result.xpAwarded).toBe(100);
    expect(result.newXp).toBe(300);
    expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ $inc: { xp: 100 } }),
      expect.any(Object)
    );
  });

  it('marks XP as awarded in ChallengeProgress after granting', async () => {
    vi.mocked(ChallengeProgressModel.findOne).mockResolvedValue(null);
    mockFindById({ xp: 0, level: 1 });
    vi.mocked(calculateLevel).mockReturnValue(1);
    vi.mocked(UserModel.findByIdAndUpdate).mockResolvedValue({ xp: 50, level: 1 });
    vi.mocked(ChallengeProgressModel.findOneAndUpdate).mockResolvedValue({});

    await awardChallengeXp(USER_ID, 50, CHALLENGE_ID);

    expect(ChallengeProgressModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: USER_ID, challengeId: CHALLENGE_ID },
      { $set: { xpAwarded: 50 } }
    );
  });

  // ─── Idempotencia: XP ya otorgado ────────────────────────────────────────

  it('returns xpAwarded=0 without modifying user when XP was already granted', async () => {
    vi.mocked(ChallengeProgressModel.findOne).mockResolvedValue({
      xpAwarded: 100,
    } as any);
    // idempotency path uses findById without .select() — but the real code
    // calls findById(userId).select('xp level'), so we still need to mock it
    mockFindById({ xp: 300, level: 2 });

    const result = await awardChallengeXp(USER_ID, 100, CHALLENGE_ID);

    expect(result.xpAwarded).toBe(0);
    expect(result.newXp).toBe(300);
    expect(UserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(ChallengeProgressModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('awards XP when progress exists but xpAwarded is 0 (not yet solved)', async () => {
    // xpAwarded=0 is falsy → the idempotency check passes → XP should be granted
    vi.mocked(ChallengeProgressModel.findOne).mockResolvedValue({
      xpAwarded: 0,
    } as any);
    mockFindById({ xp: 0, level: 1 });
    vi.mocked(calculateLevel).mockReturnValue(1);
    vi.mocked(UserModel.findByIdAndUpdate).mockResolvedValue({ xp: 50, level: 1 });
    vi.mocked(ChallengeProgressModel.findOneAndUpdate).mockResolvedValue({});

    const result = await awardChallengeXp(USER_ID, 50, CHALLENGE_ID);

    expect(result.xpAwarded).toBe(50);
  });

  // ─── Level up ────────────────────────────────────────────────────────────

  it('detects level up when XP crosses a level threshold', async () => {
    vi.mocked(ChallengeProgressModel.findOne).mockResolvedValue(null);
    mockFindById({ xp: 90, level: 1 });
    vi.mocked(calculateLevel).mockReturnValue(2); // crosses from 1 → 2
    vi.mocked(UserModel.findByIdAndUpdate).mockResolvedValue({ xp: 190, level: 2 });
    vi.mocked(ChallengeProgressModel.findOneAndUpdate).mockResolvedValue({});

    const result = await awardChallengeXp(USER_ID, 100, CHALLENGE_ID);

    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(2);
  });

  it('leveledUp is false when XP does not cross a threshold', async () => {
    vi.mocked(ChallengeProgressModel.findOne).mockResolvedValue(null);
    mockFindById({ xp: 200, level: 2 });
    vi.mocked(calculateLevel).mockReturnValue(2); // stays at level 2
    vi.mocked(UserModel.findByIdAndUpdate).mockResolvedValue({ xp: 250, level: 2 });
    vi.mocked(ChallengeProgressModel.findOneAndUpdate).mockResolvedValue({});

    const result = await awardChallengeXp(USER_ID, 50, CHALLENGE_ID);

    expect(result.leveledUp).toBe(false);
    expect(result.newLevel).toBe(2);
  });

  // ─── Level cap: nivel máximo 5 ───────────────────────────────────────────

  it('leveledUp is false when user is already at max level (5)', async () => {
    vi.mocked(ChallengeProgressModel.findOne).mockResolvedValue(null);
    mockFindById({ xp: 1500, level: 5 });
    vi.mocked(calculateLevel).mockReturnValue(5); // calculateLevel caps at 5
    vi.mocked(UserModel.findByIdAndUpdate).mockResolvedValue({ xp: 1600, level: 5 });
    vi.mocked(ChallengeProgressModel.findOneAndUpdate).mockResolvedValue({});

    const result = await awardChallengeXp(USER_ID, 100, CHALLENGE_ID);

    expect(result.leveledUp).toBe(false);
    expect(result.newLevel).toBe(5);
  });

  // ─── Usuario no encontrado ────────────────────────────────────────────────

  it('throws error when user is not found in idempotency check path', async () => {
    // XP already granted → goes to idempotency path that also calls findById
    vi.mocked(ChallengeProgressModel.findOne).mockResolvedValue({
      xpAwarded: 50,
    } as any);
    mockFindById(null); // user not found

    await expect(awardChallengeXp(USER_ID, 100, CHALLENGE_ID)).rejects.toThrow('Usuario no encontrado');
  });

  it('throws error when user is not found in fresh award path', async () => {
    vi.mocked(ChallengeProgressModel.findOne).mockResolvedValue(null);
    mockFindById(null); // user not found

    await expect(awardChallengeXp(USER_ID, 100, CHALLENGE_ID)).rejects.toThrow('Usuario no encontrado');
  });

  // ─── WeeklyLeagueResult falla (non-fatal) ────────────────────────────────

  it('does not propagate error when WeeklyLeagueResult update fails', async () => {
    vi.mocked(ChallengeProgressModel.findOne).mockResolvedValue(null);
    mockFindById({ xp: 100, level: 1 });
    vi.mocked(calculateLevel).mockReturnValue(1);
    vi.mocked(UserModel.findByIdAndUpdate).mockResolvedValue({ xp: 200, level: 1 });
    vi.mocked(ChallengeProgressModel.findOneAndUpdate).mockResolvedValue({});
    vi.mocked(WeeklyLeagueResultModel.findOneAndUpdate).mockRejectedValue(
      new Error('MongoDB constraint error')
    );

    // Non-fatal: the service catches the error and continues
    await expect(awardChallengeXp(USER_ID, 100, CHALLENGE_ID)).resolves.toMatchObject({
      xpAwarded: 100,
    });
  });

  // ─── findByIdAndUpdate falla ──────────────────────────────────────────────

  it('throws error when UserModel.findByIdAndUpdate returns null', async () => {
    vi.mocked(ChallengeProgressModel.findOne).mockResolvedValue(null);
    mockFindById({ xp: 100, level: 1 });
    vi.mocked(calculateLevel).mockReturnValue(1);
    vi.mocked(UserModel.findByIdAndUpdate).mockResolvedValue(null); // update failed

    await expect(awardChallengeXp(USER_ID, 100, CHALLENGE_ID)).rejects.toThrow(
      'Error actualizando XP del usuario'
    );
  });
});
