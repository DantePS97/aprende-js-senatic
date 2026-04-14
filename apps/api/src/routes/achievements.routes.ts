import { Router, Response } from 'express';
import { AchievementModel, UserAchievementModel } from '../models/Achievement.model';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';

export const achievementsRouter = Router();

// ─── GET /api/achievements ────────────────────────────────────────────────────

achievementsRouter.get('/', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const achievements = await AchievementModel.find().sort({ 'condition.threshold': 1 });
    res.json({ success: true, data: achievements });
  } catch (err) {
    console.error('[achievements/list]', err);
    res.status(500).json({ success: false, error: 'Error al obtener logros.' });
  }
});

// ─── GET /api/achievements/me ─────────────────────────────────────────────────

achievementsRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userAchievements = await UserAchievementModel.find({ userId: req.user!.userId })
      .populate('achievementId')
      .sort({ earnedAt: -1 });

    const data = userAchievements.map((ua) => ({
      achievement: ua.achievementId,
      earnedAt: ua.earnedAt.toISOString(),
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error('[achievements/me]', err);
    res.status(500).json({ success: false, error: 'Error al obtener logros del usuario.' });
  }
});
