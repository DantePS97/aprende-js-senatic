import { UserModel, IUser } from '../models/User.model';
import { MS_PER_DAY, BOGOTA_TZ } from '../lib/constants';
import { AchievementModel, UserAchievementModel } from '../models/Achievement.model';
import { ProgressModel } from '../models/Progress.model';
import { LessonModel } from '../models/Lesson.model';
import { ModuleModel } from '../models/Module.model';
import { ChallengeProgressModel } from '../models/ChallengeProgress.model';
import { ChallengeModel } from '../models/Challenge.model';
import type { Achievement } from '@senatic/shared';

// ─── XP → Level mapping ───────────────────────────────────────────────────────

const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0,    title: 'Aprendiz' },
  { level: 2, minXp: 101,  title: 'Explorador' },
  { level: 3, minXp: 301,  title: 'Programador' },
  { level: 4, minXp: 601,  title: 'Desarrollador' },
  { level: 5, minXp: 1001, title: 'Experto' },
];

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
  const user = await UserModel.findById(userId);
  if (!user) return [];

  // Logros ya ganados
  const earned = await UserAchievementModel.find({ userId }).select('achievementId');
  const earnedIds = new Set(earned.map((e) => e.achievementId.toString()));

  // Todos los logros
  const allAchievements = await AchievementModel.find();

  // Progreso del usuario
  const completedCount = await ProgressModel.countDocuments({ userId, status: 'completed' });
  const noHintsCount = await ProgressModel.countDocuments({ userId, status: 'completed', hintsUsed: 0 });

  // Lecciones completadas hoy (hora Colombia — offset derivado de BOGOTA_TZ)
  const now = new Date();
  const utcMs = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  const bogotaMs = new Date(now.toLocaleString('en-US', { timeZone: BOGOTA_TZ })).getTime();
  const offsetMs = utcMs - bogotaMs;
  const todayStart = new Date(Math.floor((now.getTime() - offsetMs) / MS_PER_DAY) * MS_PER_DAY + offsetMs);
  const todayEnd   = new Date(todayStart.getTime() + MS_PER_DAY);
  const lessonsToday = await ProgressModel.countDocuments({
    userId,
    status: 'completed',
    completedAt: { $gte: todayStart, $lt: todayEnd },
  });

  // Módulos completados: módulos donde todas sus lecciones están completadas
  const allModules = await ModuleModel.find({}, '_id');
  let completedModulesCount = 0;
  for (const mod of allModules) {
    const totalLessons = await LessonModel.countDocuments({ moduleId: mod._id, isPublished: true });
    if (totalLessons === 0) continue;
    const completedInModule = await ProgressModel.countDocuments({
      userId,
      status: 'completed',
      lessonId: { $in: await LessonModel.find({ moduleId: mod._id, isPublished: true }, '_id').then(ls => ls.map(l => l._id)) },
    });
    if (completedInModule >= totalLessons) completedModulesCount++;
  }

  const newAchievements: Achievement[] = [];

  for (const achievement of allAchievements) {
    if (earnedIds.has(achievement._id.toString())) continue;

    let earned = false;
    const { type, threshold } = achievement.condition;

    switch (type) {
      case 'lessons_completed':
        earned = completedCount >= threshold;
        break;
      case 'streak':
        earned = user.streak >= threshold;
        break;
      case 'xp':
        earned = user.xp >= threshold;
        break;
      case 'no_hints':
        earned = noHintsCount >= threshold;
        break;
      case 'module_completed':
        earned = completedModulesCount >= threshold;
        break;
      case 'lessons_in_day':
        earned = lessonsToday >= threshold;
        break;
      case 'challenges_solved': {
        const solvedCount = await ChallengeProgressModel.countDocuments({ userId, status: 'solved' });
        earned = solvedCount >= threshold;
        break;
      }
      case 'challenges_solved_difficulty': {
        const diff = achievement.condition.difficulty;
        const matchingIds = await ChallengeModel.find({ difficulty: diff, published: true })
          .select('_id')
          .then((cs) => cs.map((c) => c._id));
        const solvedCount = await ChallengeProgressModel.countDocuments({
          userId,
          status: 'solved',
          challengeId: { $in: matchingIds },
        });
        earned = solvedCount >= threshold;
        break;
      }
    }

    if (earned) {
      await UserAchievementModel.create({
        userId,
        achievementId: achievement._id,
        earnedAt: new Date(),
      });
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

  return newAchievements;
}
