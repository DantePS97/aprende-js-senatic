import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import {
  getCurrentWeekStatus,
  getWeeklyLeague,
  getUserLeagueHistory,
} from '../services/league.service';

export const leaguesRouter = Router();

// ─── GET /api/leagues/current ─────────────────────────────────────────────────
// Live XP and tier for the requesting user in the current week (no DB write).

leaguesRouter.get('/current', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const status = await getCurrentWeekStatus(req.user!.userId);
    res.json({ success: true, data: status });
  } catch (err) {
    console.error('[leagues/current]', err);
    res.status(500).json({ success: false, error: 'Error al obtener el estado de la liga.' });
  }
});

// ─── GET /api/leagues/weekly ──────────────────────────────────────────────────
// Live leaderboard for the current week, grouped by tier (top 20 each).

leaguesRouter.get('/weekly', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const data = await getWeeklyLeague();
    res.json({ success: true, data });
  } catch (err) {
    console.error('[leagues/weekly]', err);
    res.status(500).json({ success: false, error: 'Error al obtener el ranking de ligas.' });
  }
});

// ─── GET /api/leagues/history ─────────────────────────────────────────────────
// Last 8 weekly snapshots for the requesting user.

leaguesRouter.get('/history', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const history = await getUserLeagueHistory(req.user!.userId);
    res.json({ success: true, data: history });
  } catch (err) {
    console.error('[leagues/history]', err);
    res.status(500).json({ success: false, error: 'Error al obtener el historial de ligas.' });
  }
});
