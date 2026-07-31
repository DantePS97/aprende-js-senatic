import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Module-level mocks ───────────────────────────────────────────────────────

vi.mock('../models/Achievement.model', () => ({
  AchievementModel: {
    findOneAndUpdate: vi.fn(),
    findById: vi.fn(),
  },
  UserAchievementModel: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('../models/User.model', () => ({
  UserModel: {
    findById: vi.fn(),
  },
}));

vi.mock('./audit.service', () => ({
  writeAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./notification.service', () => ({
  dispatchNotification: vi.fn().mockResolvedValue(undefined),
}));

import { AchievementModel, UserAchievementModel } from '../models/Achievement.model';
import { UserModel } from '../models/User.model';
import { writeAudit } from './audit.service';
import { dispatchNotification } from './notification.service';
import { provisionModuleBadge, grantAchievement } from './reward.service';

const MODULE_ID = '507f1f77bcf86cd799439011';
const MODULE_TITLE = 'Funciones y Scope';

// ─── provisionModuleBadge ─────────────────────────────────────────────────────

describe('provisionModuleBadge', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates one Achievement on first call with the derived key and condition', async () => {
    vi.mocked(AchievementModel.findOneAndUpdate).mockResolvedValue({
      _id: 'ach-1',
      key: `module-completed-${MODULE_ID}`,
      condition: { type: 'module_completed_specific', threshold: 1, moduleId: MODULE_ID },
    } as any);

    await provisionModuleBadge(MODULE_ID, MODULE_TITLE);

    expect(AchievementModel.findOneAndUpdate).toHaveBeenCalledOnce();
    const [filter, update, options] = vi.mocked(AchievementModel.findOneAndUpdate).mock.calls[0];
    expect(filter).toEqual({ key: `module-completed-${MODULE_ID}` });
    expect(options).toMatchObject({ upsert: true, new: true });

    // $setOnInsert semantics — must not use $set (would clobber instructor edits on repeat calls)
    expect(update).toHaveProperty('$setOnInsert');
    expect((update as any).$set).toBeUndefined();

    const inserted = (update as any).$setOnInsert;
    expect(inserted.key).toBe(`module-completed-${MODULE_ID}`);
    expect(inserted.condition).toEqual({
      type: 'module_completed_specific',
      threshold: 1,
      moduleId: MODULE_ID,
    });
    expect(inserted.title).toBe(MODULE_TITLE);
  });

  it('is idempotent — second call does not throw and issues the same upsert-by-key query', async () => {
    vi.mocked(AchievementModel.findOneAndUpdate).mockResolvedValue({ _id: 'ach-1' } as any);

    await provisionModuleBadge(MODULE_ID, MODULE_TITLE);
    await provisionModuleBadge(MODULE_ID, MODULE_TITLE);

    expect(AchievementModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
    const firstCallFilter = vi.mocked(AchievementModel.findOneAndUpdate).mock.calls[0][0];
    const secondCallFilter = vi.mocked(AchievementModel.findOneAndUpdate).mock.calls[1][0];
    expect(firstCallFilter).toEqual(secondCallFilter);
  });

  it('does not overwrite instructor-edited title on repeat calls ($setOnInsert only, never $set)', async () => {
    vi.mocked(AchievementModel.findOneAndUpdate).mockResolvedValue({
      _id: 'ach-1',
      title: 'Título editado por el instructor',
    } as any);

    await provisionModuleBadge(MODULE_ID, 'Nuevo título distinto');

    const [, update] = vi.mocked(AchievementModel.findOneAndUpdate).mock.calls[0];
    expect((update as any).$set).toBeUndefined();
    expect((update as any).$setOnInsert.title).toBe('Nuevo título distinto');
  });

  it('swallows errors — never throws so publish can never 500', async () => {
    vi.mocked(AchievementModel.findOneAndUpdate).mockRejectedValue(new Error('DB down'));

    await expect(provisionModuleBadge(MODULE_ID, MODULE_TITLE)).resolves.not.toThrow();
  });
});

// ─── grantAchievement ──────────────────────────────────────────────────────────

describe('grantAchievement', () => {
  beforeEach(() => vi.clearAllMocks());

  const USER_ID = '507f1f77bcf86cd799439022';
  const ACHIEVEMENT_ID = '507f1f77bcf86cd799439033';
  const ADMIN_ID = '507f1f77bcf86cd799439099';

  function mockUser(overrides: Record<string, unknown> = {}) {
    const user = { _id: USER_ID, email: 'student@example.com', preferences: {}, ...overrides };
    vi.mocked(UserModel.findById).mockReturnValue({ select: vi.fn().mockResolvedValue(user) } as any);
    return user;
  }

  function mockAchievement(overrides: Record<string, unknown> = {}) {
    const achievement = { _id: ACHIEVEMENT_ID, key: 'module-completed-x', title: 'Badge', ...overrides };
    vi.mocked(AchievementModel.findById).mockResolvedValue(achievement as any);
    return achievement;
  }

  it('grants a new achievement: inserts source manual + grantedBy, writes audit, dispatches notification', async () => {
    const user = mockUser();
    const achievement = mockAchievement();
    vi.mocked(UserAchievementModel.findOneAndUpdate).mockResolvedValue(null as any);

    const result = await grantAchievement({ userId: USER_ID, achievementId: ACHIEVEMENT_ID, grantedBy: ADMIN_ID });

    expect(result).toEqual({ status: 'GRANTED', achievement });

    const [filter, update, options] = vi.mocked(UserAchievementModel.findOneAndUpdate).mock.calls[0];
    expect(filter).toEqual({ userId: USER_ID, achievementId: ACHIEVEMENT_ID });
    expect((update as any).$set).toBeUndefined();
    expect((update as any).$setOnInsert).toMatchObject({
      userId: USER_ID,
      achievementId: ACHIEVEMENT_ID,
      source: 'manual',
      grantedBy: ADMIN_ID,
    });
    expect(options).toMatchObject({ upsert: true, new: false });

    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: ADMIN_ID,
        action: 'grant',
        entityType: 'achievement',
        entityId: achievement._id,
      })
    );
    expect(dispatchNotification).toHaveBeenCalledWith(user, 'achievement_unlocked', expect.any(Object));
  });

  it('is idempotent when already earned — still writes an audit record, but no notification, no overwrite', async () => {
    mockUser();
    const achievement = mockAchievement();
    vi.mocked(UserAchievementModel.findOneAndUpdate).mockResolvedValue({
      _id: 'existing-row',
      source: 'auto',
    } as any);

    const result = await grantAchievement({ userId: USER_ID, achievementId: ACHIEVEMENT_ID, grantedBy: ADMIN_ID });

    expect(result).toEqual({ status: 'ALREADY_EARNED', achievement });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: ADMIN_ID,
        action: 'grant',
        entityType: 'achievement',
        entityId: achievement._id,
      })
    );
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it('returns USER_NOT_FOUND when the user does not exist', async () => {
    vi.mocked(UserModel.findById).mockReturnValue({ select: vi.fn().mockResolvedValue(null) } as any);

    const result = await grantAchievement({ userId: USER_ID, achievementId: ACHIEVEMENT_ID, grantedBy: ADMIN_ID });

    expect(result).toEqual({ status: 'USER_NOT_FOUND' });
    expect(AchievementModel.findById).not.toHaveBeenCalled();
    expect(UserAchievementModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('returns ACHIEVEMENT_NOT_FOUND when the achievement does not exist', async () => {
    mockUser();
    vi.mocked(AchievementModel.findById).mockResolvedValue(null as any);

    const result = await grantAchievement({ userId: USER_ID, achievementId: ACHIEVEMENT_ID, grantedBy: ADMIN_ID });

    expect(result).toEqual({ status: 'ACHIEVEMENT_NOT_FOUND' });
    expect(UserAchievementModel.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
