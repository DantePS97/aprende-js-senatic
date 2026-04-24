import { Router, Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { cached } from '../../lib/cache';
import { dateRangeSchema } from '../../lib/validators/analytics';
import * as analytics from '../../services/analytics.service';

const router = Router();

function parseDateParams(query: Record<string, unknown>) {
  const result = dateRangeSchema.safeParse(query);
  if (!result.success) return { error: result.error.errors[0]?.message ?? 'Invalid params' };
  const { from, to, courseId } = result.data;
  return {
    params: {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      courseId,
    },
  };
}

router.get('/overview', async (req: AuthRequest, res: Response) => {
  const parsed = parseDateParams(req.query as Record<string, unknown>);
  if ('error' in parsed) { res.status(400).json({ success: false, error: parsed.error }); return; }

  const { from, to, courseId } = parsed.params;
  const key = `analytics:overview:${from?.toISOString() ?? ''}:${to?.toISOString() ?? ''}:${courseId ?? ''}`;
  const data = await cached(key, 300, () => analytics.getOverview({ from, to, courseId }));
  res.json({ success: true, data });
});

router.get('/lessons', async (req: AuthRequest, res: Response) => {
  const parsed = parseDateParams(req.query as Record<string, unknown>);
  if ('error' in parsed) { res.status(400).json({ success: false, error: parsed.error }); return; }

  const { from, to, courseId } = parsed.params;
  const key = `analytics:lessons:${from?.toISOString() ?? ''}:${to?.toISOString() ?? ''}:${courseId ?? ''}`;
  const data = await cached(key, 300, () => analytics.getLessonsStats({ from, to, courseId }));
  res.json({ success: true, data });
});

router.get('/retention', async (req: AuthRequest, res: Response) => {
  const parsed = parseDateParams(req.query as Record<string, unknown>);
  if ('error' in parsed) { res.status(400).json({ success: false, error: parsed.error }); return; }

  const { from, to, courseId } = parsed.params;
  const key = `analytics:retention:${from?.toISOString() ?? ''}:${to?.toISOString() ?? ''}`;
  const data = await cached(key, 300, () => analytics.getRetention({ from, to, courseId }));
  res.json({ success: true, data });
});

router.get('/funnel', async (req: AuthRequest, res: Response) => {
  const parsed = parseDateParams(req.query as Record<string, unknown>);
  if ('error' in parsed) { res.status(400).json({ success: false, error: parsed.error }); return; }

  const { from, to, courseId } = parsed.params;
  if (!courseId) { res.status(400).json({ success: false, error: 'courseId is required for funnel' }); return; }

  const key = `analytics:funnel:${courseId}:${from?.toISOString() ?? ''}:${to?.toISOString() ?? ''}`;
  const data = await cached(key, 300, () => analytics.getFunnel({ from, to, courseId }));
  res.json({ success: true, data });
});

// GET /admin/analytics/exercises[?lessonId=xxx]
router.get('/exercises', async (req: AuthRequest, res: Response) => {
  const lessonId = req.query.lessonId ? String(req.query.lessonId) : undefined;
  const key = `analytics:exercises:${lessonId ?? 'all'}`;
  const data = await cached(key, 180, () => analytics.getExercisesAnalytics(lessonId));
  res.json({ success: true, data });
});

// GET /admin/analytics/heatmap[?from=&to=]
router.get('/heatmap', async (req: AuthRequest, res: Response) => {
  const parsed = parseDateParams(req.query as Record<string, unknown>);
  if ('error' in parsed) { res.status(400).json({ success: false, error: parsed.error }); return; }

  const { from, to } = parsed.params;
  const key = `analytics:heatmap:${from?.toISOString() ?? ''}:${to?.toISOString() ?? ''}`;
  const data = await cached(key, 300, () => analytics.getActivityHeatmap({ from, to }));
  res.json({ success: true, data });
});

export default router;
