import { UserModel, IUser } from '../models/User.model';
import { AchievementModel, UserAchievementModel } from '../models/Achievement.model';
import { ProgressModel } from '../models/Progress.model';
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
 * - diffDays === 0 → mismo día, no modificar racha
 * - diffDays === 1 → día siguiente consecutivo, incrementar
 * - diffDays  > 1 → se saltó días, resetear a 1
 */
export async function updateStreak(
  userId: string
): Promise<{ streak: number; streakIncremented: boolean }> {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');

  // Normalizar a inicio del día en UTC para comparación correcta
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);

  const lastActiveUTC = new Date(user.lastActiveDate);
  lastActiveUTC.setUTCHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (todayUTC.getTime() - lastActiveUTC.getTime()) / 86_400_000
  );

  let streakIncremented = false;

  if (diffDays === 1) {
    user.streak += 1;
    streakIncremented = true;
  } else if (diffDays > 1) {
    user.streak = 1; // racha rota
  }
  // diffDays === 0 → mismo día, la racha no cambia

  user.lastActiveDate = new Date();
  await user.save();

  return { streak: user.streak, streakIncremented };
}

// ─── XP award by hints used ───────────────────────────────────────────────────

export function calculateXpReward(baseXp: number, hintsUsed: number): number {
  if (hintsUsed === 0) return baseXp;
  if (hintsUsed === 1) return Math.round(baseXp * 0.67);
  return Math.round(baseXp * 0.33);
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
      case 'no_hints': {
        // Se maneja en el controller de progress directamente
        break;
      }
      case 'module_completed': {
        // Se chequea en el controller de progress
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
        condition: achievement.condition,
      });
    }
  }

  return newAchievements;
}

// ─── Seed default achievements ────────────────────────────────────────────────

export async function seedAchievements(): Promise<void> {
  const defaults = [
    {
      key: 'first_lesson',
      title: 'Primera Línea',
      description: 'Completaste tu primera lección',
      iconEmoji: '🌱',
      condition: { type: 'lessons_completed', threshold: 1 },
    },
    {
      key: 'five_lessons',
      title: 'En Ritmo',
      description: 'Completaste 5 lecciones',
      iconEmoji: '🔥',
      condition: { type: 'lessons_completed', threshold: 5 },
    },
    {
      key: 'ten_lessons',
      title: 'Persistencia',
      description: 'Completaste 10 lecciones',
      iconEmoji: '⚡',
      condition: { type: 'lessons_completed', threshold: 10 },
    },
    {
      key: 'streak_3',
      title: 'Fuego x3',
      description: '3 días seguidos de aprendizaje',
      iconEmoji: '🔥',
      condition: { type: 'streak', threshold: 3 },
    },
    {
      key: 'streak_7',
      title: 'Semana Imparable',
      description: '7 días seguidos de aprendizaje',
      iconEmoji: '🚀',
      condition: { type: 'streak', threshold: 7 },
    },
    {
      key: 'xp_100',
      title: 'Explorador',
      description: 'Alcanzaste 100 XP',
      iconEmoji: '🔵',
      condition: { type: 'xp', threshold: 100 },
    },
    {
      key: 'xp_500',
      title: 'Desarrollador',
      description: 'Alcanzaste 500 XP',
      iconEmoji: '🟣',
      condition: { type: 'xp', threshold: 500 },
    },
  ];

  for (const achievement of defaults) {
    await AchievementModel.updateOne(
      { key: achievement.key },
      { $setOnInsert: achievement },
      { upsert: true }
    );
  }

  console.log('✅  Logros de base sembrados');
}
