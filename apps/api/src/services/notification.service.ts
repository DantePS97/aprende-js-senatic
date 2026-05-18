// Despachador centralizado de notificaciones. Todas las funciones son fire-and-forget
// (nunca lanzan excepciones al caller) y loggean errores internamente.

import { UserModel } from '../models/User.model';
import { UserAchievementModel } from '../models/Achievement.model';
import { ProgressModel } from '../models/Progress.model';
import { emailService } from './email.service';
import type { Achievement } from '@senatic/shared';

// ─── Achievement notification ─────────────────────────────────────────────────

export async function notifyAchievementUnlocked(
  userId: string,
  achievement: Achievement
): Promise<void> {
  try {
    // Dedup: skip if email was already sent for this user+achievement combo
    const userAchievement = await UserAchievementModel.findOne({
      userId,
      achievementId: achievement._id,
    });
    if (userAchievement?.emailSentAt != null) return;

    const user = await UserModel.findById(userId).select('email displayName');
    if (!user) return;

    await emailService.sendAchievementEmail({
      to: user.email,
      displayName: user.displayName,
      achievementTitle: achievement.title,
      achievementEmoji: achievement.iconEmoji,
      achievementDescription: achievement.description,
    });

    if (userAchievement) {
      userAchievement.emailSentAt = new Date();
      await userAchievement.save();
    }
  } catch (err) {
    console.error('[notify/achievement]', err);
  }
}

// ─── Level-up notification ────────────────────────────────────────────────────

export async function notifyLevelUp(userId: string, newLevel: number): Promise<void> {
  try {
    const user = await UserModel.findById(userId).select('email displayName lastLevelUpEmailDate');
    if (!user) return;

    // Dedup: only one level-up email per UTC day
    if (user.lastLevelUpEmailDate != null) {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      if (user.lastLevelUpEmailDate >= todayStart) return;
    }

    await emailService.sendLevelUpEmail({
      to: user.email,
      displayName: user.displayName,
      newLevel,
    });

    user.lastLevelUpEmailDate = new Date();
    await user.save();
  } catch (err) {
    console.error('[notify/levelup]', err);
  }
}

// ─── Streak milestone notification ───────────────────────────────────────────

const STREAK_MILESTONES = [7, 14, 30];

export async function notifyStreakMilestone(userId: string, streakDays: number): Promise<void> {
  if (!STREAK_MILESTONES.includes(streakDays)) return;

  try {
    const user = await UserModel.findById(userId).select('email displayName');
    if (!user) return;

    await emailService.sendStreakMilestoneEmail({
      to: user.email,
      displayName: user.displayName,
      streakDays,
    });
  } catch (err) {
    console.error('[notify/streak-milestone]', err);
  }
}

// ─── Streak reminder (cron) ───────────────────────────────────────────────────

const BATCH_SIZE = 50;

export async function sendStreakReminders(): Promise<void> {
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // Find users with an active streak who haven't received a reminder today
    const usersToCheck = await UserModel.find({
      streak: { $gt: 0 },
      $or: [
        { lastStreakReminderSentAt: null },
        { lastStreakReminderSentAt: { $lt: todayStart } },
      ],
    }).select('email displayName streak lastStreakReminderSentAt');

    let remindersSent = 0;

    for (let i = 0; i < usersToCheck.length; i += BATCH_SIZE) {
      const batch = usersToCheck.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (user) => {
          try {
            // Check if the user already completed a lesson today
            const completedToday = await ProgressModel.findOne({
              userId: user._id,
              status: 'completed',
              completedAt: { $gte: todayStart },
            });

            if (completedToday) return;

            await emailService.sendStreakReminderEmail({
              to: user.email,
              displayName: user.displayName,
              streakDays: user.streak,
            });

            user.lastStreakReminderSentAt = new Date();
            await user.save();
            remindersSent++;
          } catch (err) {
            console.error('[notify/streak-reminder] user', user._id, err);
          }
        })
      );
    }

    console.log(`[cron/streak-reminder] ${remindersSent} recordatorios enviados`);
  } catch (err) {
    console.error('[notify/streak-reminder]', err);
  }
}
