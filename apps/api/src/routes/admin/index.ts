import { Router, Response } from 'express';
import { requireAuth, requireAdmin, AuthRequest } from '../../middleware/auth.middleware';
import coursesAdminRouter from './courses.routes';
import modulesAdminRouter from './modules.routes';
import lessonsAdminRouter from './lessons.routes';
import usersAdminRouter from './users.routes';
import auditAdminRouter from './audit.routes';

const router = Router();

// ─── Auth guard applied once at the parent level ──────────────────────────────
router.use(requireAuth, requireAdmin);

// ─── Sanity check ─────────────────────────────────────────────────────────────
router.get('/me', (req, res: Response) => {
  const authReq = req as AuthRequest;
  res.json({ userId: authReq.user!.userId, isAdmin: authReq.user!.isAdmin });
});

// ─── Sub-routers ──────────────────────────────────────────────────────────────
router.use('/courses', coursesAdminRouter);
router.use('/modules', modulesAdminRouter);
router.use('/lessons', lessonsAdminRouter);
router.use('/users', usersAdminRouter);
router.use('/audit', auditAdminRouter);

export default router;
