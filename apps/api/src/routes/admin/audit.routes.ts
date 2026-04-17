import { Router, Request, Response } from 'express';
import { AdminAuditModel } from '../../models/AdminAudit.model';
import { validateQuery } from '../../middleware/validate.middleware';
import { AuditQuerySchema } from '@senatic/shared';

const router = Router();

// ─── GET / ────────────────────────────────────────────────────────────────────
// Paginated audit log

router.get('/', validateQuery(AuditQuerySchema), async (req: Request, res: Response) => {
  try {
    const { limit, offset } = req.query as unknown as { limit: number; offset: number };

    const [data, total] = await Promise.all([
      AdminAuditModel.find({}).sort({ timestamp: -1 }).skip(offset).limit(limit),
      AdminAuditModel.countDocuments({}),
    ]);

    res.json({ success: true, data, total, limit, offset });
  } catch (err) {
    console.error('[admin/audit/list]', err);
    res.status(500).json({ success: false, error: 'Error al obtener el registro de auditoría.' });
  }
});

export default router;
