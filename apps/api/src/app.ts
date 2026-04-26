import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { authRouter } from './routes/auth.routes';
import { usersRouter } from './routes/users.routes';
import { coursesRouter } from './routes/courses.routes';
import { progressRouter } from './routes/progress.routes';
import { achievementsRouter } from './routes/achievements.routes';
import { forumRouter } from './routes/forum.routes';
import { leaderboardRouter } from './routes/leaderboard.routes';
import { leaguesRouter } from './routes/leagues.routes';
import { syncRouter } from './routes/sync.routes';
import adminRouter from './routes/admin/index';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

export const app = express();

// ─── Security middleware ──────────────────────────────────────────────────────

app.use(helmet());

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Demasiadas solicitudes, intenta más tarde.' },
  })
);

app.use(express.json({ limit: '1mb' }));

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/progress', progressRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/forum', forumRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/leagues', leaguesRouter);
app.use('/api/sync', syncRouter);
app.use('/api/admin', adminRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada.' });
});

// ─── Error handler ────────────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, error: 'Error interno del servidor.' });
});
