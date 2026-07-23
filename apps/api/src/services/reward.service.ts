import { AchievementModel, IAchievement, UserAchievementModel } from '../models/Achievement.model';
import { UserModel } from '../models/User.model';
import { writeAudit } from './audit.service';
import { dispatchNotification } from './notification.service';

// ─── Module publish auto-provisioning ─────────────────────────────────────────

/**
 * Idempotently ensures exactly one per-module Achievement document exists.
 * Fire-and-forget (mirrors writeAudit) — swallows its own errors so a
 * module publish can never 500 because of badge provisioning.
 *
 * `$setOnInsert` (not `$set`) is used so re-provisioning on republish never
 * clobbers an instructor-edited title/description/icon.
 */
export async function provisionModuleBadge(moduleId: string, moduleTitle: string): Promise<void> {
  try {
    const key = `module-completed-${moduleId}`;

    await AchievementModel.findOneAndUpdate(
      { key },
      {
        $setOnInsert: {
          key,
          title: moduleTitle,
          description: `Completaste el módulo "${moduleTitle}"`,
          iconEmoji: '📦',
          condition: {
            type: 'module_completed_specific',
            threshold: 1,
            moduleId,
          },
        },
      },
      { upsert: true, new: true },
    );
  } catch (err) {
    // Provisioning must never surface to the publish caller — log only.
    console.error('[reward.service] provisionModuleBadge failed:', err);
  }
}

// ─── Manual grant ──────────────────────────────────────────────────────────────

export type GrantAchievementResult =
  | { status: 'USER_NOT_FOUND' }
  | { status: 'ACHIEVEMENT_NOT_FOUND' }
  | { status: 'GRANTED'; achievement: IAchievement }
  | { status: 'ALREADY_EARNED'; achievement: IAchievement };

/**
 * Grants an existing catalog Achievement to a student on an admin's behalf.
 *
 * Uses the SAME `findOneAndUpdate` + `$setOnInsert` upsert-by-key pattern as
 * the auto path (gamification.service.ts checkAchievements) on the shared
 * `{userId, achievementId}` unique index, so a concurrent natural completion
 * and a manual grant converge on one row (first-writer-wins on provenance
 * fields — see design's race resolution). Already-earned is treated as an
 * idempotent success, not an error, mirroring how checkAchievements treats
 * already-earned as a no-op for the student (no duplicate notification, no
 * overwrite). Unlike checkAchievements, the already-earned branch here still
 * writes an audit record (metadata.alreadyEarned:true) so instructors can
 * always tell whether they already attempted this grant.
 */
export async function grantAchievement(params: {
  userId: string;
  achievementId: string;
  grantedBy: string;
}): Promise<GrantAchievementResult> {
  const { userId, achievementId, grantedBy } = params;

  const user = await UserModel.findById(userId).select(
    'email displayName preferences level streak lastLevelUpEmailDate'
  );
  if (!user) {
    return { status: 'USER_NOT_FOUND' };
  }

  const achievement = await AchievementModel.findById(achievementId);
  if (!achievement) {
    return { status: 'ACHIEVEMENT_NOT_FOUND' };
  }

  const existing = await UserAchievementModel.findOneAndUpdate(
    { userId, achievementId },
    { $setOnInsert: { userId, achievementId, earnedAt: new Date(), source: 'manual', grantedBy } },
    { upsert: true, new: false }
  );

  if (existing !== null) {
    writeAudit({
      adminId: grantedBy,
      action: 'grant',
      entityType: 'achievement',
      entityId: achievement._id,
      metadata: { userId, key: achievement.key, alreadyEarned: true },
    });

    return { status: 'ALREADY_EARNED', achievement };
  }

  writeAudit({
    adminId: grantedBy,
    action: 'grant',
    entityType: 'achievement',
    entityId: achievement._id,
    metadata: { userId, key: achievement.key },
  });

  dispatchNotification(user, 'achievement_unlocked', {
    title: 'Logro desbloqueado',
    body: `Has desbloqueado: ${achievement.title}`,
    tag: `achievement-${String(achievement._id)}`,
    data: { url: '/achievements', type: 'achievement_unlocked', achievementId: String(achievement._id) },
  }).catch(() => {});

  return { status: 'GRANTED', achievement };
}
