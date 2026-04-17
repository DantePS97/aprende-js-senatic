import { Router, Response } from 'express';
import { ProgressModel } from '../models/Progress.model';
import { UserModel } from '../models/User.model';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';

export const leaderboardRouter = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Devuelve el inicio (lunes 00:00 UTC) y fin (próximo lunes 00:00 UTC)
 * de la semana calendario actual.
 */
function getWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Dom, 1=Lun … 6=Sáb
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - daysFromMonday);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7); // lunes siguiente

  return { start, end };
}

/**
 * Fórmula de puntuación semanal:
 *   score = weeklyXp + weeklyLessons × 5 + streak × 10
 *
 * - weeklyXp        → XP ganado completando lecciones esta semana (peso principal)
 * - weeklyLessons×5 → bonus por volumen de lecciones completadas
 * - streak×10       → bonus por consistencia diaria
 */
function calcScore(weeklyXp: number, weeklyLessons: number, streak: number): number {
  return weeklyXp + weeklyLessons * 5 + streak * 10;
}

// ─── GET /api/leaderboard/weekly ─────────────────────────────────────────────

leaderboardRouter.get('/weekly', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { start, end } = getWeekBounds();

    // 1. Agregar XP y lecciones completadas esta semana por usuario
    const weeklyProgress = await ProgressModel.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: '$userId',
          weeklyXp: { $sum: '$xpEarned' },
          weeklyLessons: { $sum: 1 },
        },
      },
    ]);

    // 2. Traer datos de usuario para cada entrada
    const userIds = weeklyProgress.map((p) => p._id);
    const users = await UserModel.find({ _id: { $in: userIds } }).select(
      'displayName avatarUrl level streak'
    );
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // 3. Construir entradas y calcular score
    const entries = weeklyProgress
      .map((p) => {
        const user = userMap.get(p._id.toString());
        if (!user) return null;
        return {
          userId: p._id.toString(),
          displayName: user.displayName,
          avatarUrl: user.avatarUrl ?? null,
          level: user.level,
          streak: user.streak,
          weeklyXp: p.weeklyXp,
          weeklyLessons: p.weeklyLessons,
          score: calcScore(p.weeklyXp, p.weeklyLessons, user.streak),
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a, b) => b.score - a.score);

    // 4. Top 20 con rank
    const rankings = entries.slice(0, 20).map((entry, i) => ({
      rank: i + 1,
      ...entry,
    }));

    // 5. Posición del usuario actual (aunque no esté en el top 20)
    const currentIndex = entries.findIndex((e) => e.userId === userId);
    let currentUser = null;

    if (currentIndex !== -1) {
      currentUser = { rank: currentIndex + 1, ...entries[currentIndex] };
    } else {
      // Sin actividad esta semana — aparece fuera del ranking con score 0
      const user = await UserModel.findById(userId).select(
        'displayName avatarUrl level streak'
      );
      if (user) {
        currentUser = {
          rank: entries.length + 1,
          userId,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl ?? null,
          level: user.level,
          streak: user.streak,
          weeklyXp: 0,
          weeklyLessons: 0,
          score: 0,
        };
      }
    }

    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    res.json({
      success: true,
      data: {
        weekStart: fmt(start),
        weekEnd: fmt(new Date(end.getTime() - 86_400_000)), // último día (domingo)
        rankings,
        currentUser,
      },
    });
  } catch (err) {
    console.error('[leaderboard/weekly]', err);
    res.status(500).json({ success: false, error: 'Error al obtener el ranking.' });
  }
});
