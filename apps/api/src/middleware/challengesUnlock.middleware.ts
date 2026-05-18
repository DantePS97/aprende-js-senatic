import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { computeUnlockStatus } from '../services/challengeUnlock.service';

export async function requireChallengesUnlocked(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'No autenticado.' });
    return;
  }
  try {
    const { unlocked } = await computeUnlockStatus(req.user.userId);
    if (!unlocked) {
      res.status(403).json({
        success: false,
        error: 'CHALLENGES_LOCKED',
        message: 'Debes completar el curso javascript-basico para acceder a los retos.',
      });
      return;
    }
    next();
  } catch (err) {
    console.error('[requireChallengesUnlocked]', err);
    res.status(500).json({ success: false, error: 'Error al verificar acceso a retos.' });
  }
}
