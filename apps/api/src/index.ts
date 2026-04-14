import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import { authRouter } from './routes/auth.routes';
import { coursesRouter } from './routes/courses.routes';
import { progressRouter } from './routes/progress.routes';
import { achievementsRouter } from './routes/achievements.routes';
import { forumRouter } from './routes/forum.routes';
import { syncRouter } from './routes/sync.routes';

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || '';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

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
    windowMs: 15 * 60 * 1000, // 15 minutos
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
app.use('/api/courses', coursesRouter);
app.use('/api/progress', progressRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/forum', forumRouter);
app.use('/api/sync', syncRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada.' });
});

// ─── Error handler ────────────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, error: 'Error interno del servidor.' });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
  if (!MONGODB_URI) {
    console.error('❌  MONGODB_URI no está configurado. Revisa tu archivo .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅  Conectado a MongoDB');
  } catch (err) {
    console.error('❌  Error conectando a MongoDB:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀  API corriendo en http://localhost:${PORT}`);
  });
}

bootstrap();
