import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { registerSchema, loginSchema, refreshTokenSchema } from '@senatic/shared';
import { UserModel } from '../models/User.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { validate } from '../middleware/validate.middleware';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { updateStreak } from '../services/gamification.service';

export const authRouter = Router();

// Rate limit más estricto para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Demasiados intentos de autenticación. Intenta en 15 minutos.' },
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────

authRouter.post('/register', authLimiter, validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;

    const exists = await UserModel.findOne({ email });
    if (exists) {
      res.status(409).json({ success: false, error: 'Ya existe una cuenta con ese email.' });
      return;
    }

    const user = new UserModel({
      email,
      passwordHash: password, // el pre-save hook hashea esto
      displayName,
    });
    await user.save();

    const payload = { userId: user._id.toString(), email: user.email };
    const tokens = {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          displayName: user.displayName,
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          lastActiveDate: user.lastActiveDate,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        tokens,
      },
    });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ success: false, error: 'Error al registrar el usuario.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

authRouter.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email }).select('+passwordHash');
    if (!user) {
      res.status(401).json({ success: false, error: 'Credenciales incorrectas.' });
      return;
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Credenciales incorrectas.' });
      return;
    }

    // Actualizar racha al hacer login (usa UTC — mismo algoritmo que en /progress)
    const { streak: updatedStreak } = await updateStreak(user._id.toString());

    const payload = { userId: user._id.toString(), email: user.email };
    const tokens = {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          displayName: user.displayName,
          xp: user.xp,
          level: user.level,
          streak: updatedStreak,
          lastActiveDate: new Date().toISOString(),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        tokens,
      },
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ success: false, error: 'Error al iniciar sesión.' });
  }
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

authRouter.post('/refresh', validate(refreshTokenSchema), async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const payload = verifyRefreshToken(refreshToken);

    const user = await UserModel.findById(payload.userId);
    if (!user) {
      res.status(401).json({ success: false, error: 'Usuario no encontrado.' });
      return;
    }

    const newPayload = { userId: user._id.toString(), email: user.email };
    res.json({
      success: true,
      data: {
        accessToken: signAccessToken(newPayload),
      },
    });
  } catch {
    res.status(401).json({ success: false, error: 'Refresh token inválido o expirado.' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

authRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
      return;
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        lastActiveDate: user.lastActiveDate,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error('[auth/me]', err);
    res.status(500).json({ success: false, error: 'Error al obtener perfil.' });
  }
});
