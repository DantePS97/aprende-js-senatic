import { Router, Response } from 'express';
import { validateBody } from '../../middleware/validate.middleware';
import { grantAchievement } from '../../services/reward.service';
import { GrantRewardSchema } from '@senatic/shared';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();

// ─── POST /grant ───────────────────────────────────────────────────────────────
// Manually grant an existing catalog Achievement to a student (admin/instructor only)

router.post('/grant', validateBody(GrantRewardSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { userId, achievementId } = req.body;

    const result = await grantAchievement({
      userId,
      achievementId,
      grantedBy: req.user!.userId,
    });

    switch (result.status) {
      case 'USER_NOT_FOUND':
        res.status(404).json({ success: false, error: 'USER_NOT_FOUND' });
        return;
      case 'ACHIEVEMENT_NOT_FOUND':
        res.status(404).json({ success: false, error: 'ACHIEVEMENT_NOT_FOUND' });
        return;
      case 'ALREADY_EARNED':
        res.json({
          success: true,
          data: { granted: false, alreadyEarned: true, achievement: result.achievement },
        });
        return;
      case 'GRANTED':
        res.json({
          success: true,
          data: { granted: true, alreadyEarned: false, achievement: result.achievement },
        });
        return;
    }
  } catch (err) {
    console.error('[admin/rewards/grant]', err);
    res.status(500).json({ success: false, error: 'Error al otorgar el logro.' });
  }
});

export default router;
