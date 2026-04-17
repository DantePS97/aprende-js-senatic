import { Router, Response } from 'express';
import { UserModel } from '../../models/User.model';
import { validateBody } from '../../middleware/validate.middleware';
import { writeAudit } from '../../services/audit.service';
import { PromoteDemoteSchema } from '@senatic/shared';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();

// ─── POST /promote ────────────────────────────────────────────────────────────
// Grant admin role by email

router.post('/promote', validateBody(PromoteDemoteSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
      return;
    }

    user.isAdmin = true;
    await user.save();

    writeAudit({
      adminId: req.user!.userId,
      action: 'promote',
      entityType: 'user',
      entityId: user._id,
      metadata: { email },
    });

    res.json({ success: true, data: { _id: user._id, email: user.email, isAdmin: user.isAdmin } });
  } catch (err) {
    console.error('[admin/users/promote]', err);
    res.status(500).json({ success: false, error: 'Error al promover el usuario.' });
  }
});

// ─── POST /demote ─────────────────────────────────────────────────────────────
// Revoke admin role by email (guards last admin)

router.post('/demote', validateBody(PromoteDemoteSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
      return;
    }

    // Guard: must not demote the last admin
    const adminCount = await UserModel.countDocuments({ isAdmin: true });
    if (adminCount <= 1) {
      res.status(409).json({
        success: false,
        error: 'LAST_ADMIN',
        message: 'No puedes degradar al único administrador.',
      });
      return;
    }

    user.isAdmin = false;
    await user.save();

    writeAudit({
      adminId: req.user!.userId,
      action: 'demote',
      entityType: 'user',
      entityId: user._id,
      metadata: { email },
    });

    res.json({ success: true, data: { _id: user._id, email: user.email, isAdmin: user.isAdmin } });
  } catch (err) {
    console.error('[admin/users/demote]', err);
    res.status(500).json({ success: false, error: 'Error al degradar el usuario.' });
  }
});

export default router;
