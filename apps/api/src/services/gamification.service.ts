import { UserModel, IUser } from '../models/User.model';
import { MS_PER_DAY, BOGOTA_TZ } from '../lib/constants';
import { AchievementModel, UserAchievementModel } from '../models/Achievement.model';
import { ProgressModel } from '../models/Progress.model';
import { LessonModel } from '../models/Lesson.model';
import { ChallengeProgressModel } from '../models/ChallengeProgress.model';
import { ChallengeModel } from '../models/Challenge.model';
import type { Achievement } from '@senatic/shared';
import { LEVEL_THRESHOLDS } from '@senatic/shared';

export function calculateLevel(xp: number): number {
  let level = 1;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.minXp) level = threshold.level;
  }
  return level;
}

// ─── Streak update ────────────────────────────────────────────────────────────

/**
 * Actualiza la racha del usuario basada en la actividad actual.
 * Usa fechas UTC para evitar problemas de zona horaria del servidor.
 *
 * Reglas:
 * - diffDays === 0 + streak > 0 → mismo día, ya contado, no modificar
 * - diffDays === 0 + streak = 0 → primer día activo, iniciar racha en 1
 * - diffDays === 1              → día consecutivo, incrementar
 * - diffDays  > 1              → racha rota, resetear a 1
 */
export async function updateStreak(
  userId: string,
  activityDate: Date = new Date()
): Promise<{ streak: number; streakIncremented: boolean }> {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');

  // Normalizar ambas fechas a inicio del día en UTC
  const activityUTC = new Date(activityDate);
  activityUTC.setUTCHours(0, 0, 0, 0);

  const lastActiveUTC = new Date(user.lastActiveDate);
  lastActiveUTC.setUTCHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (activityUTC.getTime() - lastActiveUTC.getTime()) / MS_PER_DAY
  );

  let streakIncremented = false;

  if (diffDays === 1) {
    user.streak += 1;
    streakIncremented = true;
  } else if (diffDays > 1) {
    user.streak = 1; // racha rota
  } else {
    // diffDays === 0 → mismo día
    if (user.streak === 0) {
      user.streak = 1;
      streakIncremented = true;
    }
    // Si ya tiene racha activa, no modificar — ya se contó este día
  }

  user.lastActiveDate = activityDate;
  await user.save();

  return { streak: user.streak, streakIncremented };
}

// ─── Streak bonus ─────────────────────────────────────────────────────────────

function streakBonus(streak: number): number {
  if (streak >= 30) return 0.20;
  if (streak >= 14) return 0.10;
  if (streak >= 7)  return 0.05;
  return 0;
}

// ─── XP award by hints used + streak bonus ────────────────────────────────────

/**
 * Calcula el XP real que recibe el usuario por completar una lección.
 *
 * Penalización por pistas:
 *   0 pistas → 100 %
 *   1 pista  →  75 %
 *   2+ pistas →  50 %  (piso — siempre vale la pena intentar)
 *
 * Bonus por racha (se aplica sobre el XP ya penalizado):
 *   streak  7–13 →  +5 %
 *   streak 14–29 → +10 %
 *   streak  30+  → +20 %
 */
export function calculateXpReward(baseXp: number, hintsUsed: number, streak: number = 0): number {
  const ratio = hintsUsed === 0 ? 1.00
              : hintsUsed === 1 ? 0.75
              : 0.50;

  return Math.round(baseXp * ratio * (1 + streakBonus(streak)));
}

// ─── Award XP and update user ─────────────────────────────────────────────────

export async function awardXp(
  userId: string,
  xpAmount: number
): Promise<{ newXp: number; newLevel: number; leveledUp: boolean }> {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');

  const previousLevel = user.level;
  user.xp += xpAmount;
  user.level = calculateLevel(user.xp);
  await user.save();

  return {
    newXp: user.xp,
    newLevel: user.level,
    leveledUp: user.level > previousLevel,
  };
}

// ─── Check and award achievements ─────────────────────────────────────────────

export async function checkAchievements(userId: string): Promise<Achievement[]> {
  // ─── Batch 1: user, earned ids, achievement definitions ──────────────────────
  const [user, earned, allAchievements] = await Promise.all([
    UserModel.findById(userId),
    UserAchievementModel.find({ userId }).select('achievementId'),
    AchievementModel.find(),
  ]);
  if (!user) return [];

  const earnedIds = new Set(earned.map((e) => e.achievementId.toString()));

  // Today bounds (Colombia TZ — offset derived from BOGOTA_TZ)
  const now = new Date();
  const utcMs   = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  const bogotaMs = new Date(now.toLocaleString('en-US', { timeZone: BOGOTA_TZ })).getTime();
  const offsetMs = utcMs - bogotaMs;
  const todayStart = new Date(Math.floor((now.getTime() - offsetMs) / MS_PER_DAY) * MS_PER_DAY + offsetMs);
  const todayEnd   = new Date(todayStart.getTime() + MS_PER_DAY);

  // ─── Batch 2: all reads in parallel — no per-module loop ─────────────────────
  const [userCompletedProgress, allPublishedLessons, userSolvedChallenges, allPublishedChallenges] =
    await Promise.all([
      ProgressModel.find({ userId, status: 'completed' }, 'lessonId hintsUsed completedAt'),
      LessonModel.find({ isPublished: true }, '_id moduleId'),
      ChallengeProgressModel.find({ userId, status: 'solved' }, 'challengeId'),
      ChallengeModel.find({ published: true }, '_id difficulty'),
    ]);

  // ─── Derive scalar stats from documents (zero extra queries) ─────────────────
  const completedCount       = userCompletedProgress.length;
  const noHintsCount         = userCompletedProgress.filter((p) => p.hintsUsed === 0).length;
  const lessonsToday         = userCompletedProgress.filter(
    (p) => p.completedAt && p.completedAt >= todayStart && p.completedAt < todayEnd,
  ).length;
  const challengesSolvedCount = userSolvedChallenges.length;

  // ─── Module completion — in-memory grouping ───────────────────────────────────
  const completedLessonIdSet = new Set(userCompletedProgress.map((p) => p.lessonId.toString()));

  const lessonsByModule = new Map<string, string[]>();
  for (const lesson of allPublishedLessons) {
    const moduleId = lesson.moduleId.toString();
    if (!lessonsByModule.has(moduleId)) lessonsByModule.set(moduleId, []);
    lessonsByModule.get(moduleId)!.push(lesson._id.toString());
  }

  let completedModulesCount = 0;
  for (const lessonIds of lessonsByModule.values()) {
    if (lessonIds.length > 0 && lessonIds.every((id) => completedLessonIdSet.has(id))) {
      completedModulesCount++;
    }
  }

  // ─── Challenges by difficulty — in-memory grouping ───────────────────────────
  const solvedChallengeIdSet = new Set(userSolvedChallenges.map((cp) => cp.challengeId.toString()));

  const solvedByDifficulty = new Map<string, number>();
  for (const c of allPublishedChallenges) {
    if (solvedChallengeIdSet.has(c._id.toString())) {
      const diff = c.difficulty;
      solvedByDifficulty.set(diff, (solvedByDifficulty.get(diff) ?? 0) + 1);
    }
  }

  // ─── Evaluate and award achievements ─────────────────────────────────────────
  const newAchievements: Achievement[] = [];

  for (const achievement of allAchievements) {
    if (earnedIds.has(achievement._id.toString())) continue;

    let isEarned = false;
    const { type, threshold } = achievement.condition;

    switch (type) {
      case 'lessons_completed':        isEarned = completedCount >= threshold; break;
      case 'streak':                   isEarned = user.streak >= threshold; break;
      case 'xp':                       isEarned = user.xp >= threshold; break;
      case 'no_hints':                 isEarned = noHintsCount >= threshold; break;
      case 'module_completed':         isEarned = completedModulesCount >= threshold; break;
      case 'lessons_in_day':           isEarned = lessonsToday >= threshold; break;
      case 'challenges_solved':        isEarned = challengesSolvedCount >= threshold; break;
      case 'challenges_solved_difficulty': {
        const diff = achievement.condition.difficulty!;
        isEarned = (solvedByDifficulty.get(diff) ?? 0) >= threshold;
        break;
      }
    }

    if (isEarned) {
      // Idempotent upsert: safe against concurrent checkAchievements calls for the same user.
      // findOneAndUpdate with new:false returns null only when the document was JUST created;
      // if another concurrent call already inserted it, we get the pre-existing doc back and
      // skip adding it to newAchievements — no E11000 crash, no duplicate notification.
      const existing = await UserAchievementModel.findOneAndUpdate(
        { userId, achievementId: achievement._id },
        { $setOnInsert: { userId, achievementId: achievement._id, earnedAt: new Date() } },
        { upsert: true, new: false },
      );

      if (existing === null) {
        newAchievements.push({
          _id: achievement._id.toString(),
          key: achievement.key,
          title: achievement.title,
          description: achievement.description,
          iconEmoji: achievement.iconEmoji,
          condition: achievement.condition as import('@senatic/shared').AchievementCondition,
        });
      }
    }
  }

  return newAchievements;
}
