import mongoose from 'mongoose';
import { ProgressModel } from '../models/Progress.model';
import { LessonModel } from '../models/Lesson.model';
import { awardXp, calculateXpReward, checkAchievements, updateStreak } from './gamification.service';
import type { SyncEvent, SyncResponse, Progress } from '@senatic/shared';

export async function processSyncEvents(
  userId: string,
  events: SyncEvent[]
): Promise<SyncResponse> {
  const acknowledged: string[] = [];
  const processedProgress: Progress[] = [];
  let totalNewXp = 0;

  for (const event of events) {
    try {
      const lesson = await LessonModel.findById(event.lessonId);
      if (!lesson) continue;

      const existing = await ProgressModel.findOne({
        userId,
        lessonId: new mongoose.Types.ObjectId(event.lessonId),
      });

      const completedAt = new Date(event.completedAt);

      // Conflict resolution: si ya existe y está completada, gana el timestamp más reciente
      if (existing && existing.status === 'completed') {
        const existingDate = existing.completedAt || new Date(0);
        if (completedAt <= existingDate) {
          // El server tiene el estado más reciente — ack igualmente
          acknowledged.push(event.localId);
          processedProgress.push(mapProgress(existing));
          continue;
        }
      }

      // Calcular XP a otorgar solo si el evento es "passed"
      let xpEarned = 0;
      if (event.passed) {
        xpEarned = calculateXpReward(lesson.xpReward, event.hintsUsed);
      }

      const progress = await ProgressModel.findOneAndUpdate(
        {
          userId,
          lessonId: new mongoose.Types.ObjectId(event.lessonId),
        },
        {
          $set: {
            status: event.passed ? 'completed' : 'in_progress',
            xpEarned,
            hintsUsed: event.hintsUsed,
            completedAt: event.passed ? completedAt : undefined,
            syncedAt: new Date(),
          },
          $inc: { attempts: 1 },
        },
        { upsert: true, new: true }
      );

      if (event.passed) {
        await updateStreak(userId);
        if (xpEarned > 0) {
          await awardXp(userId, xpEarned);
          totalNewXp += xpEarned;
        }
      }

      acknowledged.push(event.localId);
      processedProgress.push(mapProgress(progress));
    } catch (err) {
      console.error(`[sync] Error procesando evento ${event.localId}:`, err);
      // No hacer ack de este evento — el cliente reintentará
    }
  }

  const newAchievements = await checkAchievements(userId);

  // Obtener estado actual del usuario
  const { UserModel } = await import('../models/User.model');
  const user = await UserModel.findById(userId);

  return {
    acknowledged,
    progress: processedProgress,
    newAchievements,
    xpTotal: user?.xp ?? 0,
    level: user?.level ?? 1,
  };
}

function mapProgress(p: InstanceType<typeof ProgressModel>): Progress {
  return {
    _id: p._id.toString(),
    userId: p.userId.toString(),
    lessonId: p.lessonId.toString(),
    status: p.status,
    xpEarned: p.xpEarned,
    attempts: p.attempts,
    hintsUsed: p.hintsUsed,
    completedAt: p.completedAt?.toISOString(),
    syncedAt: p.syncedAt?.toISOString(),
  };
}
