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

async function upsertLesson(moduleId: mongoose.Types.ObjectId, data: {
  order: number; title: string; xpReward: number; contentId: string;
}) {
  const exists = await LessonModel.findOne({ moduleId, order: data.order });
  if (!exists) await LessonModel.create({ moduleId, ...data });
}

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

  // ─── Módulo 1: Variables y Tipos de Datos ────────────────────────────────

  let mod1 = await ModuleModel.findOne({ courseId: course._id, order: 1 });
  if (!mod1) {
    mod1 = await ModuleModel.create({
      courseId: course._id,
      order: 1,
      title: 'Variables y Tipos de Datos',
      description: 'Aprende a almacenar y manejar información en JavaScript',
    });
  }

  for (const l of [
    { order: 1, title: '¿Qué es una variable?',  xpReward: 15, contentId: 'javascript-basico/module-01-variables/lesson-01-que-es-variable' },
    { order: 2, title: 'Tipos de datos',          xpReward: 15, contentId: 'javascript-basico/module-01-variables/lesson-02-tipos-de-datos' },
    { order: 3, title: 'let vs const',             xpReward: 20, contentId: 'javascript-basico/module-01-variables/lesson-03-const-y-let' },
  ]) await upsertLesson(mod1._id, l);
  console.log('✅  Módulo 1 listo (3 lecciones)');

  // ─── Módulo 2: Condicionales ──────────────────────────────────────────────

  let mod2 = await ModuleModel.findOne({ courseId: course._id, order: 2 });
  if (!mod2) {
    mod2 = await ModuleModel.create({
      courseId: course._id,
      order: 2,
      title: 'Condicionales',
      description: 'Enseña a tu programa a tomar decisiones con if, else y más',
    });
  }

  for (const l of [
    { order: 1, title: 'Condicionales: if y else',          xpReward: 20, contentId: 'javascript-basico/module-02-condicionales/lesson-01-if-else' },
    { order: 2, title: 'Múltiples condiciones: else if',    xpReward: 25, contentId: 'javascript-basico/module-02-condicionales/lesson-02-else-if' },
    { order: 3, title: 'Operador ternario',                 xpReward: 25, contentId: 'javascript-basico/module-02-condicionales/lesson-03-operador-ternario' },
    { order: 4, title: 'Switch: elegir entre muchas opciones', xpReward: 30, contentId: 'javascript-basico/module-02-condicionales/lesson-04-switch' },
  ]) await upsertLesson(mod2._id, l);
  console.log('✅  Módulo 2 listo (4 lecciones)');

  // ─── Módulo 3: Bucles ─────────────────────────────────────────────────────

  let mod3 = await ModuleModel.findOne({ courseId: course._id, order: 3 });
  if (!mod3) {
    mod3 = await ModuleModel.create({
      courseId: course._id,
      order: 3,
      title: 'Bucles',
      description: 'Haz que tu código se repita con for, while y más',
    });
  }

  for (const l of [
    { order: 1, title: 'El bucle for',           xpReward: 25, contentId: 'javascript-basico/module-03-bucles/lesson-01-bucle-for' },
    { order: 2, title: 'El bucle while',          xpReward: 25, contentId: 'javascript-basico/module-03-bucles/lesson-02-bucle-while' },
    { order: 3, title: 'break y continue',        xpReward: 30, contentId: 'javascript-basico/module-03-bucles/lesson-03-break-continue' },
    { order: 4, title: 'Arrays y bucle for...of', xpReward: 35, contentId: 'javascript-basico/module-03-bucles/lesson-04-arrays-y-for-of' },
  ]) await upsertLesson(mod3._id, l);
  console.log('✅  Módulo 3 listo (4 lecciones)');

  // ─── Módulo 4: Funciones ──────────────────────────────────────────────────

  let mod4 = await ModuleModel.findOne({ courseId: course._id, order: 4 });
  if (!mod4) {
    mod4 = await ModuleModel.create({
      courseId: course._id,
      order: 4,
      title: 'Funciones',
      description: 'Organiza tu código en bloques reutilizables',
    });
  }

  for (const l of [
    { order: 1, title: '¿Qué es una función?',         xpReward: 30, contentId: 'javascript-basico/module-04-funciones/lesson-01-que-es-una-funcion' },
    { order: 2, title: 'Parámetros y retorno',          xpReward: 35, contentId: 'javascript-basico/module-04-funciones/lesson-02-parametros-y-retorno' },
    { order: 3, title: 'Arrow functions: la forma moderna', xpReward: 35, contentId: 'javascript-basico/module-04-funciones/lesson-03-arrow-functions' },
    { order: 4, title: 'Scope: dónde viven las variables', xpReward: 40, contentId: 'javascript-basico/module-04-funciones/lesson-04-scope' },
  ]) await upsertLesson(mod4._id, l);
  console.log('✅  Módulo 4 listo (4 lecciones)');

  // ─── Módulo 5: Objetos ────────────────────────────────────────────────────

  let mod5 = await ModuleModel.findOne({ courseId: course._id, order: 5 });
  if (!mod5) {
    mod5 = await ModuleModel.create({
      courseId: course._id,
      order: 5,
      title: 'Objetos',
      description: 'Agrupa datos relacionados en estructuras con propiedades y métodos',
    });
  }

  for (const l of [
    { order: 1, title: '¿Qué es un objeto?',      xpReward: 35, contentId: 'javascript-basico/module-05-objetos/lesson-01-que-es-un-objeto' },
    { order: 2, title: 'Propiedades y métodos',   xpReward: 40, contentId: 'javascript-basico/module-05-objetos/lesson-02-propiedades-y-metodos' },
    { order: 3, title: 'this en objetos',          xpReward: 45, contentId: 'javascript-basico/module-05-objetos/lesson-03-this' },
    { order: 4, title: 'Destructuring de objetos', xpReward: 45, contentId: 'javascript-basico/module-05-objetos/lesson-04-destructuring' },
    { order: 5, title: 'Spread y rest en objetos', xpReward: 50, contentId: 'javascript-basico/module-05-objetos/lesson-05-spread-rest' },
  ]) await upsertLesson(mod5._id, l);
  console.log('✅  Módulo 5 listo (5 lecciones)');

  // ─── Módulo 6: Arrays avanzados ───────────────────────────────────────────

  let mod6 = await ModuleModel.findOne({ courseId: course._id, order: 6 });
  if (!mod6) {
    mod6 = await ModuleModel.create({
      courseId: course._id,
      order: 6,
      title: 'Arrays avanzados',
      description: 'Domina map, filter, reduce y otros métodos funcionales de arrays',
    });
  }

  for (const l of [
    { order: 1, title: 'Transformar arrays con map', xpReward: 40, contentId: 'javascript-basico/module-06-arrays/lesson-01-map' },
    { order: 2, title: 'Filtrar arrays con filter',  xpReward: 40, contentId: 'javascript-basico/module-06-arrays/lesson-02-filter' },
    { order: 3, title: 'Reducir arrays con reduce',  xpReward: 50, contentId: 'javascript-basico/module-06-arrays/lesson-03-reduce' },
    { order: 4, title: 'find, some y every',          xpReward: 45, contentId: 'javascript-basico/module-06-arrays/lesson-04-find-some-every' },
  ]) await upsertLesson(mod6._id, l);
  console.log('✅  Módulo 6 listo (4 lecciones)');

  // ─── Logros ───────────────────────────────────────────────────────────────

  await seedAchievements();

  const totalLecciones = 3 + 4 + 4 + 4 + 5 + 4;
  const totalXP = 15+15+20 + 20+25+25+30 + 25+25+30+35 + 30+35+35+40 + 35+40+45+45+50 + 40+40+50+45;
  console.log(`\n🎉  Seed completado!`);
  console.log(`    ${totalLecciones} lecciones · ${totalXP} XP total disponible`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌  Error en seed:', err);
  process.exit(1);
});
