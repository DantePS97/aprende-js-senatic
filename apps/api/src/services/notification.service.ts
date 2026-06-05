// Despachador centralizado de notificaciones. Todas las funciones son fire-and-forget
// (nunca lanzan excepciones al caller) y loggean errores internamente.

import { UserModel, IUser } from '../models/User.model';
import { UserAchievementModel } from '../models/Achievement.model';
import { ProgressModel } from '../models/Progress.model';
import { PushSubscription } from '../models/PushSubscription.model';
import { emailService } from './email.service';
import { pushDedup } from '../lib/pushDedup';
import { sendToUser } from './push.service';
import type { Achievement, PushEventType, PushNotificationPayload } from '@senatic/shared';

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
    }).select('email displayName streak lastStreakReminderSentAt preferences');

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

            await dispatchNotification(user, 'streak_reminder', {
              title: 'Tu racha está en riesgo',
              body: `Tu racha de ${user.streak} días peligra. ¡Practica hoy!`,
              tag: 'streak-reminder',
              data: { url: '/', type: 'streak_reminder' },
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

// ─── dispatchNotification ─────────────────────────────────────────────────────
// Tries push first; falls back to email when push is disabled, no subscriptions,
// or all sends fail. Fire-and-forget safe — never throws.

const PREF_KEY_MAP: Record<PushEventType, keyof NonNullable<IUser['preferences']['push']>> = {
  achievement_unlocked: 'achievements',
  level_up: 'levelUp',
  streak_reminder: 'streakReminder',
};

export async function dispatchNotification(
  user: IUser,
  type: PushEventType,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    const userId = String(user._id);
    const prefKey = PREF_KEY_MAP[type];
    const pushEnabled = user.preferences?.push?.[prefKey] ?? false;

    if (!pushEnabled) {
      await emailFallback(user, type, payload);
      return;
    }

    const subCount = await PushSubscription.countDocuments({ userId });
    if (subCount === 0) {
      await emailFallback(user, type, payload);
      return;
    }

    if (type === 'achievement_unlocked') {
      if (pushDedup.shouldSkip(userId, type)) return;
      pushDedup.mark(userId, type);
    }

    const { successCount } = await sendToUser(userId, payload, type);

    if (successCount < 1) {
      await emailFallback(user, type, payload);
    }
  } catch (err) {
    console.error('[notify/dispatch]', err);
  }
}

async function emailFallback(
  user: IUser,
  type: PushEventType,
  payload: PushNotificationPayload
): Promise<void> {
  const userId = String(user._id);
  try {
    if (type === 'level_up') {
      const level = typeof payload.data.level === 'number' ? payload.data.level : undefined;
      if (level !== undefined) {
        await notifyLevelUp(userId, level);
      }
    } else if (type === 'streak_reminder') {
      await emailService.sendStreakReminderEmail({
        to: user.email,
        displayName: user.displayName,
        streakDays: user.streak,
      });
    } else if (type === 'achievement_unlocked') {
      // achievement email requires the full Achievement object — skip gracefully
      console.info('[notify/dispatch] achievement_unlocked email fallback skipped (no achievement object)');
    }
  } catch (err) {
    console.error('[notify/emailFallback]', err);
  }
}
