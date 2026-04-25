import { Router, Response } from 'express';
import { updatePreferencesSchema } from '@senatic/shared';
import { UserModel } from '../models/User.model';
import { validate } from '../middleware/validate.middleware';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';

export const usersRouter = Router();

// ─── PATCH /api/users/me/preferences ─────────────────────────────────────────
// Actualiza parcialmente las preferencias del usuario autenticado.
// Usa dot-notation $set para no sobreescribir campos no enviados.

usersRouter.patch(
  '/me/preferences',
  requireAuth,
  validate(updatePreferencesSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      // Construir $set con dot-notation: { 'preferences.theme': 'dark', ... }
      const updates: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.body)) {
        updates[`preferences.${key}`] = value as string;
      }

      const user = await UserModel.findByIdAndUpdate(
        req.user!.userId,
        { $set: updates },
        { new: true, runValidators: true },
      );

      if (!user) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        return;
      }

      res.json({
        success: true,
        data: { preferences: user.preferences },
      });
    } catch (err) {
      console.error('[users/me/preferences]', err);
      res.status(500).json({ success: false, error: 'Error al actualizar preferencias.' });
    }
  },
);
