import { Router, Request, Response } from 'express';
import { pushSubscribeSchema, pushUnsubscribeSchema, updatePushPreferencesSchema } from '@senatic/shared';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { subscribe, unsubscribe, updatePreferences } from '../services/push.service';

export const pushRouter = Router();

// ─── GET /api/push/vapid-public-key ──────────────────────────────────────────

pushRouter.get('/vapid-public-key', (_req: Request, res: Response) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// ─── POST /api/push/subscribe ─────────────────────────────────────────────────

pushRouter.post(
  '/subscribe',
  requireAuth,
  validateBody(pushSubscribeSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      await subscribe(userId, req.body);
      res.status(201).json({ subscribed: true });
    } catch (err) {
      console.error('[push/subscribe]', err);
      res.status(500).json({ message: 'Error al registrar suscripción.' });
    }
  }
);

// ─── DELETE /api/push/subscribe ───────────────────────────────────────────────

pushRouter.delete(
  '/subscribe',
  requireAuth,
  validateBody(pushUnsubscribeSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      await unsubscribe(userId, req.body.endpoint);
      res.status(204).send();
    } catch (err) {
      console.error('[push/unsubscribe]', err);
      res.status(500).json({ message: 'Error al eliminar suscripción.' });
    }
  }
);

// ─── PUT /api/push/preferences ────────────────────────────────────────────────

pushRouter.put(
  '/preferences',
  requireAuth,
  validateBody(updatePushPreferencesSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const result = await updatePreferences(userId, req.body);
      res.json(result);
    } catch (err) {
      console.error('[push/preferences]', err);
      res.status(500).json({ message: 'Error al actualizar preferencias.' });
    }
  }
);
