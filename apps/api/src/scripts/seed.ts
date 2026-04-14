/**
 * Script de seed inicial para poblar la base de datos con cursos,
 * módulos, lecciones y logros base.
 *
 * Uso: npx tsx src/scripts/seed.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { CourseModel } from '../models/Course.model';
import { ModuleModel } from '../models/Module.model';
import { LessonModel } from '../models/Lesson.model';
import { seedAchievements } from '../services/gamification.service';

const MONGODB_URI = process.env.MONGODB_URI || '';

async function seed() {
  if (!MONGODB_URI) {
    console.error('❌  MONGODB_URI no configurado');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('✅  Conectado a MongoDB');

  // ─── Curso: JavaScript Básico ─────────────────────────────────────────────

  let course = await CourseModel.findOne({ slug: 'javascript-basico' });
  if (!course) {
    course = await CourseModel.create({
      slug: 'javascript-basico',
      title: 'JavaScript Básico',
      description: 'Aprende los fundamentos de JavaScript: variables, condicionales, bucles y funciones',
      level: 'basic',
      iconEmoji: '🟨',
      order: 1,
    });
    console.log('✅  Curso "JavaScript Básico" creado');
  }

  // ─── Módulo 1: Variables ──────────────────────────────────────────────────

  let mod1 = await ModuleModel.findOne({ courseId: course._id, order: 1 });
  if (!mod1) {
    mod1 = await ModuleModel.create({
      courseId: course._id,
      order: 1,
      title: 'Variables y Tipos de Datos',
      description: 'Aprende a almacenar y manejar información en JavaScript',
    });
    console.log('✅  Módulo 1 creado');
  }

  const mod1Lessons = [
    { order: 1, title: '¿Qué es una variable?', xpReward: 15, contentId: 'javascript-basico/module-01-variables/lesson-01-que-es-variable' },
    { order: 2, title: 'Tipos de datos', xpReward: 15, contentId: 'javascript-basico/module-01-variables/lesson-02-tipos-de-datos' },
    { order: 3, title: 'let vs const', xpReward: 20, contentId: 'javascript-basico/module-01-variables/lesson-03-const-y-let' },
  ];

  for (const lessonData of mod1Lessons) {
    const exists = await LessonModel.findOne({ moduleId: mod1._id, order: lessonData.order });
    if (!exists) {
      await LessonModel.create({ moduleId: mod1._id, ...lessonData });
    }
  }
  console.log('✅  Lecciones del Módulo 1 creadas');

  // ─── Módulo 2: Condicionales ──────────────────────────────────────────────

  let mod2 = await ModuleModel.findOne({ courseId: course._id, order: 2 });
  if (!mod2) {
    mod2 = await ModuleModel.create({
      courseId: course._id,
      order: 2,
      title: 'Condicionales',
      description: 'Enseña a tu programa a tomar decisiones con if, else y más',
    });
    console.log('✅  Módulo 2 creado');
  }

  const mod2Lessons = [
    { order: 1, title: 'Condicionales: if y else', xpReward: 20, contentId: 'javascript-basico/module-02-condicionales/lesson-01-if-else' },
    { order: 2, title: 'Múltiples condiciones: else if', xpReward: 25, contentId: 'javascript-basico/module-02-condicionales/lesson-02-else-if' },
  ];

  for (const lessonData of mod2Lessons) {
    const exists = await LessonModel.findOne({ moduleId: mod2._id, order: lessonData.order });
    if (!exists) {
      await LessonModel.create({ moduleId: mod2._id, ...lessonData });
    }
  }
  console.log('✅  Lecciones del Módulo 2 creadas');

  // ─── Logros ───────────────────────────────────────────────────────────────

  await seedAchievements();

  console.log('\n🎉  Seed completado exitosamente!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌  Error en seed:', err);
  process.exit(1);
});
