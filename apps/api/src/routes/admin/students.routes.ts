import { Router, Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { cached } from '../../lib/cache';
import { getStudentList, getStudentProfile } from '../../services/analytics.service';

const router = Router();

// GET /admin/students — lista paginada de estudiantes con stats básicas
router.get('/', async (_req: AuthRequest, res: Response) => {
  const data = await cached('admin:students:list', 120, () => getStudentList());
  res.json({ success: true, data });
});

// GET /admin/students/:id — perfil completo de un estudiante
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const key = `admin:students:profile:${id}`;
  const data = await cached(key, 120, () => getStudentProfile(id));

  if (!data) {
    res.status(404).json({ success: false, error: 'Estudiante no encontrado' });
    return;
  }

  res.json({ success: true, data });
});

export default router;
