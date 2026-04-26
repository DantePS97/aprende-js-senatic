import 'dotenv/config';
import mongoose from 'mongoose';
import { app } from './app';
import { runLeagueCatchup, setupLeagueCron } from './lib/leagueCatchup';

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || '';

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

  // ─── League scheduler + boot catch-up ────────────────────────────────────
  await runLeagueCatchup();
  setupLeagueCron();

  app.listen(PORT, () => {
    console.log(`🚀  API corriendo en http://localhost:${PORT}`);
  });
}

bootstrap();
