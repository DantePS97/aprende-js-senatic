import { AchievementModel } from '../models/Achievement.model';

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
