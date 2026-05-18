import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { submitProgressSchema } from '@senatic/shared';
import { ProgressModel } from '../models/Progress.model';
import { LessonModel } from '../models/Lesson.model';
import { ModuleModel } from '../models/Module.model';
import { CourseModel } from '../models/Course.model';
import { UserModel } from '../models/User.model';
import { ExerciseAttemptModel } from '../models/ExerciseAttempt.model';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { awardXp, calculateXpReward, checkAchievements, updateStreak } from '../services/gamification.service';
import { notifyAchievementUnlocked, notifyLevelUp, notifyStreakMilestone } from '../services/notification.service';

export const progressRouter = Router();

// ─── POST /api/progress ───────────────────────────────────────────────────────

progressRouter.post('/', requireAuth, validateBody(submitProgressSchema), async (req: AuthRequest, res: Response) => {
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
      const currentUser = await UserModel.findById(userId);
      xpEarned = calculateXpReward(lesson.xpReward, hintsUsed, currentUser?.streak ?? 0);
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
    let newStreak: number | undefined;

    if (passed && isFirstCompletion) {
      // Actualizar racha — siempre que la lección se pase por primera vez
      const streakResult = await updateStreak(userId);
      newStreak = streakResult.streak;

      if (xpEarned > 0) {
        const xpResult = await awardXp(userId, xpEarned);
        leveledUp = xpResult.leveledUp;
        newLevel = xpResult.newLevel;
      }
    }

    const newAchievements = await checkAchievements(userId);

    // Notificaciones — fire and forget, no bloquean el response
    if (newAchievements.length > 0) {
      for (const ach of newAchievements) {
        notifyAchievementUnlocked(userId, ach).catch(() => {});
      }
    }
    if (leveledUp && newLevel !== undefined) {
      notifyLevelUp(userId, newLevel).catch(() => {});
    }
    if (newStreak !== undefined) {
      notifyStreakMilestone(userId, newStreak).catch(() => {});
    }

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
        newStreak,
        newAchievements,
      },
    });
  } catch (err) {
    console.error('[progress/submit]', err);
    res.status(500).json({ success: false, error: 'Error al guardar progreso.' });
  }
});

// ─── POST /api/progress/exercise (telemetría de ejercicio) ───────────────────

progressRouter.post('/exercise', requireAuth, async (req: AuthRequest, res: Response) => {
  // Responder inmediatamente — el cliente no espera
  res.json({ success: true });

  try {
    const { lessonId, exerciseIndex, exerciseTitle, passed, hintsUsed } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const lessonOid = new mongoose.Types.ObjectId(String(lessonId));
    const idx = Number(exerciseIndex ?? 0);

    await ExerciseAttemptModel.findOneAndUpdate(
      { userId, lessonId: lessonOid, exerciseIndex: idx },
      {
        $inc: { attempts: 1 },
        $set: {
          exerciseTitle: String(exerciseTitle ?? ''),
          hintsUsed: Number(hintsUsed ?? 0),
          lastAttemptAt: new Date(),
        },
        // $max preserves true: once passed=true, subsequent failed runs don't revert it
        $max: { passed: Boolean(passed) },
        $setOnInsert: { firstAttemptAt: new Date() },
      },
      { upsert: true },
    );
  } catch (err) {
    // Telemetría: errores silenciosos — no afectan al estudiante
    console.error('[progress/exercise]', err);
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

// ─── GET /api/progress/courses ────────────────────────────────────────────────

progressRouter.get('/courses', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // 1. Fetch all published courses
    const courses = await CourseModel.find({ isPublished: true }).sort({ order: 1 });

    // 2. For each course, get published modules → published lessons → completed count (parallel)
    const courseProgress = await Promise.all(
      courses.map(async (course) => {
        const modules = await ModuleModel.find({ courseId: course._id, isPublished: true });
        const moduleIds = modules.map((m) => m._id);

        const lessons = await LessonModel.find({
          moduleId: { $in: moduleIds },
          isPublished: true,
        });
        const lessonIds = lessons.map((l) => l._id);
        const totalLessons = lessonIds.length;

        const completedLessons = totalLessons > 0
          ? await ProgressModel.countDocuments({
              userId,
              lessonId: { $in: lessonIds },
              status: 'completed',
            })
          : 0;

        const percentageComplete = totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

        return {
          courseId: (course._id as mongoose.Types.ObjectId).toString(),
          courseSlug: course.slug,
          courseTitle: course.title,
          iconEmoji: course.iconEmoji,
          completedLessons,
          totalLessons,
          percentageComplete,
        };
      })
    );

    res.json({ success: true, data: courseProgress });
  } catch (err) {
    console.error('[progress/courses]', err);
    res.status(500).json({ success: false, error: 'Error al obtener progreso por curso.' });
  }
});
