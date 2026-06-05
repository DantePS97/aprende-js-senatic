import mongoose from 'mongoose';
import { AchievementModel } from '../models/Achievement.model';

const defaults = [
  { key: 'first_lesson', title: 'Primera Línea', description: 'Completaste tu primera lección', iconEmoji: '🌱', condition: { type: 'lessons_completed', threshold: 1 } },
  { key: 'five_lessons', title: 'En Ritmo', description: 'Completaste 5 lecciones', iconEmoji: '🔥', condition: { type: 'lessons_completed', threshold: 5 } },
  { key: 'ten_lessons', title: 'Persistencia', description: 'Completaste 10 lecciones', iconEmoji: '⚡', condition: { type: 'lessons_completed', threshold: 10 } },
  { key: 'twenty_lessons', title: 'Constante', description: 'Completaste 20 lecciones', iconEmoji: '🏃', condition: { type: 'lessons_completed', threshold: 20 } },
  { key: 'thirty_lessons', title: 'Dedicado', description: 'Completaste 30 lecciones', iconEmoji: '🎯', condition: { type: 'lessons_completed', threshold: 30 } },
  { key: 'graduate', title: 'Graduado JavaScript', description: 'Completaste todas las lecciones del curso', iconEmoji: '🎓', condition: { type: 'lessons_completed', threshold: 37 } },
  { key: 'streak_3', title: 'Fuego x3', description: '3 días seguidos de aprendizaje', iconEmoji: '🔥', condition: { type: 'streak', threshold: 3 } },
  { key: 'streak_7', title: 'Semana Imparable', description: '7 días seguidos de aprendizaje', iconEmoji: '🚀', condition: { type: 'streak', threshold: 7 } },
  { key: 'streak_14', title: 'Dos Semanas', description: '14 días seguidos de aprendizaje', iconEmoji: '🌟', condition: { type: 'streak', threshold: 14 } },
  { key: 'streak_30', title: 'Mes Imparable', description: '30 días seguidos de aprendizaje', iconEmoji: '🏆', condition: { type: 'streak', threshold: 30 } },
  { key: 'xp_100', title: 'Explorador', description: 'Alcanzaste 100 XP', iconEmoji: '🔵', condition: { type: 'xp', threshold: 100 } },
  { key: 'xp_500', title: 'Desarrollador', description: 'Alcanzaste 500 XP', iconEmoji: '🟣', condition: { type: 'xp', threshold: 500 } },
  { key: 'xp_1000', title: 'Alto Rendimiento', description: 'Alcanzaste 1000 XP', iconEmoji: '💎', condition: { type: 'xp', threshold: 1000 } },
  { key: 'xp_2000', title: 'Leyenda', description: 'Alcanzaste 2000 XP', iconEmoji: '👑', condition: { type: 'xp', threshold: 2000 } },
  { key: 'xp_3000', title: 'Elite', description: 'Alcanzaste 3000 XP', iconEmoji: '💫', condition: { type: 'xp', threshold: 3000 } },
  { key: 'no_hints_1', title: 'Sin Pistas', description: 'Completaste una lección sin usar ninguna pista', iconEmoji: '🧠', condition: { type: 'no_hints', threshold: 1 } },
  { key: 'no_hints_3', title: 'Cerebro Frío', description: 'Completaste 3 lecciones sin usar ninguna pista', iconEmoji: '🧊', condition: { type: 'no_hints', threshold: 3 } },
  { key: 'no_hints_5', title: 'Mente Afilada', description: 'Completaste 5 lecciones sin usar ninguna pista', iconEmoji: '🔮', condition: { type: 'no_hints', threshold: 5 } },
  { key: 'no_hints_10', title: 'Sin Mapa', description: 'Completaste 10 lecciones sin usar ninguna pista', iconEmoji: '🗺️', condition: { type: 'no_hints', threshold: 10 } },
  { key: 'module_completed_1', title: 'Módulo Completo', description: 'Completaste todas las lecciones de un módulo', iconEmoji: '📦', condition: { type: 'module_completed', threshold: 1 } },
  { key: 'module_completed_3', title: 'Maestro de Módulos', description: 'Completaste todas las lecciones de 3 módulos', iconEmoji: '🎓', condition: { type: 'module_completed', threshold: 3 } },
  { key: 'module_completed_5', title: 'Explorador Profundo', description: 'Completaste todas las lecciones de 5 módulos', iconEmoji: '🏗️', condition: { type: 'module_completed', threshold: 5 } },
  { key: 'module_completed_11', title: 'Maestro del Curso', description: 'Completaste todos los módulos del curso', iconEmoji: '🏅', condition: { type: 'module_completed', threshold: 11 } },
  { key: 'turbo_day', title: 'Modo Turbo', description: 'Completaste 3 lecciones en un solo día', iconEmoji: '⚡', condition: { type: 'lessons_in_day', threshold: 3 } },
  { key: 'marathon_day', title: 'Maratón de Código', description: 'Completaste 5 lecciones en un solo día', iconEmoji: '🏃', condition: { type: 'lessons_in_day', threshold: 5 } },
  { key: 'primer_reto', title: 'Primer Reto', description: 'Resolviste tu primer reto de JavaScript', iconEmoji: '⚔️', condition: { type: 'challenges_solved', threshold: 1 } },
  { key: 'maestro_dificil', title: 'Maestro del Desafío', description: 'Resolviste un reto de nivel difícil', iconEmoji: '🧗', condition: { type: 'challenges_solved_difficulty', threshold: 1, difficulty: 'dificil' } },
  { key: 'react-first-component', title: 'Primer Componente React', description: 'Completaste tu primera lección de React', iconEmoji: '⚛️', condition: { type: 'lessons_completed', threshold: 1 } },
  { key: 'react-state-master', title: 'Maestro del Estado', description: 'Completaste el módulo de Estado en React Básico', iconEmoji: '🎣', condition: { type: 'module_completed', threshold: 1 } },
  { key: 'react-basico-graduate', title: 'Graduado React Básico', description: 'Completaste las 35 lecciones del curso React Básico', iconEmoji: '🎓', condition: { type: 'lessons_completed', threshold: 35 } },
];

export async function seedAchievements(): Promise<void> {
  for (const achievement of defaults) {
    await AchievementModel.updateOne(
      { key: achievement.key },
      { $setOnInsert: achievement },
      { upsert: true },
    );
  }
  console.log('✅  Logros de base sembrados');
}

if (require.main === module) {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI is required'); process.exit(1); }
  mongoose.connect(uri)
    .then(() => seedAchievements())
    .then(() => mongoose.disconnect())
    .catch((err) => { console.error(err); process.exit(1); });
}
