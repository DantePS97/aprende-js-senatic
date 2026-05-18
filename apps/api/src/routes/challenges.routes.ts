import { Router, Response } from 'express';
import { submitChallengeSchema } from '@senatic/shared';
import { validateBody } from '../middleware/validate.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { requireChallengesUnlocked } from '../middleware/challengesUnlock.middleware';
import { computeUnlockStatus } from '../services/challengeUnlock.service';
import { listChallengesForUser, submitChallenge } from '../services/challenge.service';
import { ChallengeModel } from '../models/Challenge.model';
import { ChallengeProgressModel } from '../models/ChallengeProgress.model';

export const challengesRouter = Router();

// ─── GET /unlock-status — MUST be before /:slug ───────────────────────────────

challengesRouter.get('/unlock-status', async (req: AuthRequest, res: Response) => {
  try {
    const status = await computeUnlockStatus(req.user!.userId);
    res.json({ success: true, data: status });
  } catch (err) {
    console.error('[challenges/unlock-status]', err);
    res.status(500).json({ success: false, error: 'Error al verificar estado de acceso.' });
  }
});

// ─── GET / ────────────────────────────────────────────────────────────────────

challengesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await listChallengesForUser(req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[challenges/list]', err);
    res.status(500).json({ success: false, error: 'Error al obtener retos.' });
  }
});

// ─── GET /:slug ───────────────────────────────────────────────────────────────

challengesRouter.get('/:slug', requireChallengesUnlocked, async (req: AuthRequest, res: Response) => {
  try {
    const challenge = await ChallengeModel.findOne({ slug: req.params.slug, published: true });
    if (!challenge) {
      res.status(404).json({ success: false, error: 'Reto no encontrado.' });
      return;
    }

    const progress = await ChallengeProgressModel.findOne({
      userId: req.user!.userId,
      challengeId: challenge._id,
    });

    // Strip description from hidden test cases before sending to client
    const challengeData = challenge.toObject();
    challengeData.testCases = challengeData.testCases.map((tc) =>
      tc.hidden ? { ...tc, description: undefined } : tc
    );

    res.json({
      success: true,
      data: {
        challenge: challengeData,
        progress: progress
          ? {
              _id: progress._id,
              userId: progress.userId,
              challengeId: progress.challengeId,
              status: progress.status,
              firstSolvedAt: progress.firstSolvedAt?.toISOString() ?? null,
              xpAwarded: progress.xpAwarded,
            }
          : null,
      },
    });
  } catch (err) {
    console.error('[challenges/detail]', err);
    res.status(500).json({ success: false, error: 'Error al obtener el reto.' });
  }
});

// ─── POST /:slug/submit ───────────────────────────────────────────────────────

challengesRouter.post(
  '/:slug/submit',
  requireChallengesUnlocked,
  validateBody(submitChallengeSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await submitChallenge(req.user!.userId, req.params.slug, req.body.code);
      res.json({ success: true, data: result });
    } catch (err) {
      const typed = err as { code?: string };
      if (typed?.code === 'NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Reto no encontrado.' });
        return;
      }
      console.error('[challenges/submit]', err);
      res.status(500).json({ success: false, error: 'Error al procesar el reto.' });
    }
  }
);
