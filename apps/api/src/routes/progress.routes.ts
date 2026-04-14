import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { submitProgressSchema } from '@senatic/shared';
import { ProgressModel } from '../models/Progress.model';
import { LessonModel } from '../models/Lesson.model';
import { UserModel } from '../models/User.model';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { awardXp, calculateXpReward, checkAchievements } from '../services/gamification.service';

export const progressRouter = Router();

// ─── POST /api/progress ───────────────────────────────────────────────────────

progressRouter.post('/', requireAuth, validate(submitProgressSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId, passed, hintsUsed, completedAt } = req.body;
    const userId = req.user!.userId;

    const lesson = await LessonModel.findById(lessonId);
    if (!lesson) {
      res.status(404).json({ success: false, error: 'Lección no encontrada.' });
      return;
    }

    let xpEarned = 0;
    const isFirstCompletion = !(await ProgressModel.findOne({
      userId,
      lessonId: new mongoose.Types.ObjectId(lessonId),
      status: 'completed',
    }));

    if (passed && isFirstCompletion) {
      xpEarned = calculateXpReward(lesson.xpReward, hintsUsed);
    }

    const progress = await ProgressModel.findOneAndUpdate(
      { userId, lessonId: new mongoose.Types.ObjectId(lessonId) },
      {
        $set: {
          status: passed ? 'completed' : 'in_progress',
          xpEarned: passed && isFirstCompletion ? xpEarned : undefined,
          hintsUsed,
          completedAt: passed ? new Date(completedAt) : undefined,
          syncedAt: new Date(),
        },
        $inc: { attempts: 1 },
      },
      { upsert: true, new: true }
    );

    let leveledUp = false;
    let newLevel: number | undefined;

    if (passed && isFirstCompletion && xpEarned > 0) {
      const result = await awardXp(userId, xpEarned);
      leveledUp = result.leveledUp;
      newLevel = result.newLevel;
    }

    const newAchievements = await checkAchievements(userId);

    res.json({
      success: true,
      data: {
        progress: {
          _id: progress._id,
          userId: progress.userId,
          lessonId: progress.lessonId,
          status: progress.status,
          xpEarned: progress.xpEarned,
          attempts: progress.attempts,
          hintsUsed: progress.hintsUsed,
          completedAt: progress.completedAt?.toISOString(),
        },
        xpEarned,
        leveledUp,
        newLevel,
        newAchievements,
      },
    });
  } catch (err) {
    console.error('[progress/submit]', err);
    res.status(500).json({ success: false, error: 'Error al guardar progreso.' });
  }
});

// ─── GET /api/progress/me ─────────────────────────────────────────────────────

progressRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const progress = await ProgressModel.find({ userId });
    res.json({ success: true, data: progress });
  } catch (err) {
    console.error('[progress/me]', err);
    res.status(500).json({ success: false, error: 'Error al obtener progreso.' });
  }
});

// ─── GET /api/progress/stats ──────────────────────────────────────────────────

progressRouter.get('/stats', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const [user, completedCount, totalLessons] = await Promise.all([
      UserModel.findById(userId),
      ProgressModel.countDocuments({ userId, status: 'completed' }),
      LessonModel.countDocuments({ isPublished: true }),
    ]);

    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
      return;
    }

    res.json({
      success: true,
      data: {
        totalXp: user.xp,
        level: user.level,
        streak: user.streak,
        completedLessons: completedCount,
        totalLessons,
        percentageComplete: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
        lastActiveDate: user.lastActiveDate.toISOString(),
      },
    });
  } catch (err) {
    console.error('[progress/stats]', err);
    res.status(500).json({ success: false, error: 'Error al obtener estadísticas.' });
  }
});
