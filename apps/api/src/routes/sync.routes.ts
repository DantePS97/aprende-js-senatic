import { Router, Response } from 'express';
import { syncRequestSchema } from '@senatic/shared';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { processSyncEvents } from '../services/sync.service';

export const syncRouter = Router();

// ─── POST /api/sync ───────────────────────────────────────────────────────────

syncRouter.post('/', requireAuth, validate(syncRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { events } = req.body;
    const result = await processSyncEvents(req.user!.userId, events);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[sync]', err);
    res.status(500).json({ success: false, error: 'Error al sincronizar progreso.' });
  }
});
