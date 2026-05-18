import mongoose from 'mongoose';
import { UserModel } from '../models/User.model';
import { WeeklyLeagueResultModel } from '../models/WeeklyLeagueResult.model';
import { ChallengeProgressModel } from '../models/ChallengeProgress.model';
import { calculateLevel } from './gamification.service';

function getCurrentWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

export interface AwardChallengeXpResult {
  xpAwarded: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
}

export async function awardChallengeXp(
  userId: string,
  xpAmount: number,
  challengeId: mongoose.Types.ObjectId | string
): Promise<AwardChallengeXpResult> {
  // Idempotency: only award if XP not already granted for this challenge
  const progress = await ChallengeProgressModel.findOne({ userId, challengeId });
  if (progress?.xpAwarded && progress.xpAwarded > 0) {
    const user = await UserModel.findById(userId).select('xp level');
    if (!user) throw new Error('Usuario no encontrado');
    return { xpAwarded: 0, newXp: user.xp, newLevel: user.level, leveledUp: false };
  }

  const prevUser = await UserModel.findById(userId).select('xp level');
  if (!prevUser) throw new Error('Usuario no encontrado');

  const previousLevel = prevUser.level;
  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    {
      $inc: { xp: xpAmount },
      $set: { level: calculateLevel(prevUser.xp + xpAmount) },
    },
    { new: true }
  );
  if (!updatedUser) throw new Error('Error actualizando XP del usuario');

  // Mark XP as awarded (idempotency anchor — set AFTER User.xp update)
  await ChallengeProgressModel.findOneAndUpdate(
    { userId, challengeId },
    { $set: { xpAwarded: xpAmount } }
  );

  // Upsert WeeklyLeagueResult using aggregation pipeline to handle min:1 constraint on insert
  const weekStart = getCurrentWeekStart();
  try {
    await WeeklyLeagueResultModel.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId), weekStart },
      [
        {
          $set: {
            weeklyXp: { $add: [{ $ifNull: ['$weeklyXp', 0] }, xpAmount] },
            tier:     { $ifNull: ['$tier', 'bronze'] },
            rank:     { $ifNull: ['$rank', 0] },
          },
        },
      ],
      { upsert: true, new: true }
    );
  } catch (err) {
    // Non-fatal: User.xp is the source of truth
    console.error('[awardChallengeXp] WeeklyLeagueResult update failed:', err);
  }

  return {
    xpAwarded: xpAmount,
    newXp: updatedUser.xp,
    newLevel: updatedUser.level,
    leveledUp: updatedUser.level > previousLevel,
  };
}
