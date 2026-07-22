import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Module-level mocks ───────────────────────────────────────────────────────

vi.mock('../models/Achievement.model', () => ({
  AchievementModel: {
    findOneAndUpdate: vi.fn(),
  },
}));

import { AchievementModel } from '../models/Achievement.model';
import { provisionModuleBadge } from './reward.service';

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
