import { Router, Response } from 'express';
import { submitChallengeSchema } from '@senatic/shared';
import { validateBody } from '../middleware/validate.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { requireChallengesUnlocked } from '../middleware/challengesUnlock.middleware';
import { computeUnlockStatus } from '../services/challengeUnlock.service';
import { listChallengesForUser, runChallenge, submitChallenge, getNextHint } from '../services/challenge.service';
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

    // Build safe challenge payload: strip hints text (served one-at-a-time via /hint),
    // add hintsCount so the frontend knows whether to show the hint button.
    const { hints, ...challengeRaw } = challenge.toObject();
    const challengeData = {
      ...challengeRaw,
      hintsCount: hints?.length ?? 0,
      testCases: challengeRaw.testCases.map((tc) =>
        tc.hidden ? { ...tc, description: undefined } : tc
      ),
    };

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
              hintsUsed: progress.hintsUsed ?? 0,
            }
          : null,
      },
    });
  } catch (err) {
    console.error('[challenges/detail]', err);
    res.status(500).json({ success: false, error: 'Error al obtener el reto.' });
  }
});

// ─── POST /:slug/hint ─────────────────────────────────────────────────────────

challengesRouter.post(
  '/:slug/hint',
  requireChallengesUnlocked,
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await getNextHint(req.user!.userId, String(req.params.slug));
      res.json({ success: true, data: result });
    } catch (err) {
      const typed = err as { code?: string };
      if (typed?.code === 'NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Reto no encontrado.' });
        return;
      }
      if (typed?.code === 'NO_HINTS' || typed?.code === 'NO_MORE_HINTS') {
        res.status(409).json({ success: false, error: 'No hay más pistas disponibles.' });
        return;
      }
      console.error('[challenges/hint]', err);
      res.status(500).json({ success: false, error: 'Error al obtener la pista.' });
    }
  }
);

// ─── POST /:slug/run ──────────────────────────────────────────────────────────

challengesRouter.post(
  '/:slug/run',
  requireChallengesUnlocked,
  validateBody(submitChallengeSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await runChallenge(req.user!.userId, String(req.params.slug), req.body.code);
      res.json({ success: true, data: result });
    } catch (err) {
      const typed = err as { code?: string };
      if (typed?.code === 'NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Reto no encontrado.' });
        return;
      }
      console.error('[challenges/run]', err);
      res.status(500).json({ success: false, error: 'Error al ejecutar el código.' });
    }
  }
);

// ─── POST /:slug/submit ───────────────────────────────────────────────────────

challengesRouter.post(
  '/:slug/submit',
  requireChallengesUnlocked,
  validateBody(submitChallengeSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await submitChallenge(req.user!.userId, String(req.params.slug), req.body.code);
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
