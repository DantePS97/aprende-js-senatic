import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTierForXp, snapshotWeek } from './league.service';

// ─── getTierForXp — boundary values ──────────────────────────────────────────

describe('getTierForXp', () => {
  it('returns null for 0 XP', () => {
    expect(getTierForXp(0)).toBeNull();
  });

  it('returns "bronze" for 1 XP (lower boundary)', () => {
    expect(getTierForXp(1)).toBe('bronze');
  });

  it('returns "bronze" for 299 XP (just below silver)', () => {
    expect(getTierForXp(299)).toBe('bronze');
  });

  it('returns "silver" for 300 XP (silver lower boundary)', () => {
    expect(getTierForXp(300)).toBe('silver');
  });

  it('returns "silver" for 699 XP (just below gold)', () => {
    expect(getTierForXp(699)).toBe('silver');
  });

  it('returns "gold" for 700 XP (gold lower boundary)', () => {
    expect(getTierForXp(700)).toBe('gold');
  });

  it('returns "gold" for very high XP', () => {
    expect(getTierForXp(99999)).toBe('gold');
  });
});

// ─── snapshotWeek — idempotency ───────────────────────────────────────────────

// Mock the models so no DB connection is needed
vi.mock('../models/Progress.model', () => ({
  ProgressModel: {
    aggregate: vi.fn(),
  },
}));

vi.mock('../models/WeeklyLeagueResult.model', () => ({
  WeeklyLeagueResultModel: {
    bulkWrite: vi.fn().mockResolvedValue({ ok: 1 }),
  },
}));

vi.mock('../models/User.model', () => ({
  UserModel: {
    find: vi.fn(),
  },
}));

describe('snapshotWeek — idempotency', () => {
  const weekStart = new Date('2026-04-20T00:00:00.000Z'); // a Monday

  const mockAggregateResult = [
    { _id: '000000000000000000000001', weeklyXp: 800 }, // gold
    { _id: '000000000000000000000002', weeklyXp: 400 }, // silver
    { _id: '000000000000000000000003', weeklyXp: 50  }, // bronze
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    const { ProgressModel } = await import('../models/Progress.model');
    (ProgressModel.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue(mockAggregateResult);
  });

  it('calls bulkWrite on the first invocation', async () => {
    const { WeeklyLeagueResultModel } = await import('../models/WeeklyLeagueResult.model');

    await snapshotWeek(weekStart);

    expect(WeeklyLeagueResultModel.bulkWrite).toHaveBeenCalledTimes(1);
  });

  it('produces the same operations array on two consecutive calls (idempotency)', async () => {
    const { WeeklyLeagueResultModel } = await import('../models/WeeklyLeagueResult.model');
    const bulkWrite = WeeklyLeagueResultModel.bulkWrite as ReturnType<typeof vi.fn>;

    await snapshotWeek(weekStart);
    await snapshotWeek(weekStart);

    expect(bulkWrite).toHaveBeenCalledTimes(2);

    // Both calls should receive identical operations
    const [call1Args] = bulkWrite.mock.calls[0] as [unknown[]];
    const [call2Args] = bulkWrite.mock.calls[1] as [unknown[]];
    expect(JSON.stringify(call1Args)).toBe(JSON.stringify(call2Args));
  });

  it('does not call bulkWrite when there are no eligible users (xp = 0)', async () => {
    const { ProgressModel } = await import('../models/Progress.model');
    const { WeeklyLeagueResultModel } = await import('../models/WeeklyLeagueResult.model');

    (ProgressModel.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await snapshotWeek(weekStart);

    expect(WeeklyLeagueResultModel.bulkWrite).not.toHaveBeenCalled();
  });
});
