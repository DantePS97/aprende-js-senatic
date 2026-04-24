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

  // ─── Módulo 7: DOM y Eventos ──────────────────────────────────────────────

  let mod7 = await ModuleModel.findOne({ courseId: course._id, order: 7 });
  if (!mod7) {
    mod7 = await ModuleModel.create({
      courseId: course._id,
      order: 7,
      title: 'DOM y Eventos',
      description: 'Haz tus páginas interactivas manipulando el DOM y respondiendo a eventos',
    });
  }

  for (const l of [
    { order: 1, title: '¿Qué es el DOM?',               xpReward: 40, contentId: 'javascript-basico/module-07-dom/lesson-01-que-es-el-dom' },
    { order: 2, title: 'Seleccionar elementos del DOM', xpReward: 45, contentId: 'javascript-basico/module-07-dom/lesson-02-seleccionar-elementos' },
    { order: 3, title: 'Modificar el DOM',              xpReward: 50, contentId: 'javascript-basico/module-07-dom/lesson-03-modificar-dom' },
    { order: 4, title: 'Eventos: páginas interactivas', xpReward: 55, contentId: 'javascript-basico/module-07-dom/lesson-04-eventos' },
  ]) await upsertLesson(mod7._id, l);
  console.log('✅  Módulo 7 listo (4 lecciones)');

  // ─── Módulo 8: Asincronismo ────────────────────────────────────────────────

  let mod8 = await ModuleModel.findOne({ courseId: course._id, order: 8 });
  if (!mod8) {
    mod8 = await ModuleModel.create({
      courseId: course._id,
      order: 8,
      title: 'Asincronismo',
      description: 'Entiende cómo JavaScript maneja operaciones que toman tiempo',
    });
  }

  for (const l of [
    { order: 1, title: 'Callbacks y temporizadores',          xpReward: 50, contentId: 'javascript-basico/module-08-async/lesson-01-callbacks-y-timers' },
    { order: 2, title: 'Promesas',                            xpReward: 55, contentId: 'javascript-basico/module-08-async/lesson-02-promesas' },
    { order: 3, title: 'async/await',                         xpReward: 60, contentId: 'javascript-basico/module-08-async/lesson-03-async-await' },
  ]) await upsertLesson(mod8._id, l);
  console.log('✅  Módulo 8 listo (3 lecciones)');

  // ─── Módulo 9: Manejo de Errores ─────────────────────────────────────────

  let mod9 = await ModuleModel.findOne({ courseId: course._id, order: 9 });
  if (!mod9) {
    mod9 = await ModuleModel.create({
      courseId: course._id,
      order: 9,
      title: 'Manejo de Errores',
      description: 'Aprende a anticipar y manejar fallos en tu código de forma elegante',
    });
  }

  for (const l of [
    { order: 1, title: 'try/catch: capturar errores',    xpReward: 45, contentId: 'javascript-basico/module-09-errores/lesson-01-try-catch' },
    { order: 2, title: 'Tipos de error en JavaScript',   xpReward: 45, contentId: 'javascript-basico/module-09-errores/lesson-02-tipos-de-error' },
    { order: 3, title: 'Errores en código asíncrono',    xpReward: 50, contentId: 'javascript-basico/module-09-errores/lesson-03-errores-async' },
  ]) await upsertLesson(mod9._id, l);
  console.log('✅  Módulo 9 listo (3 lecciones)');

  // ─── Módulo 10: JSON y Fetch API ──────────────────────────────────────────

  let mod10 = await ModuleModel.findOne({ courseId: course._id, order: 10 });
  if (!mod10) {
    mod10 = await ModuleModel.create({
      courseId: course._id,
      order: 10,
      title: 'JSON y Fetch API',
      description: 'Conecta tu app con el mundo: consume APIs y maneja datos JSON',
    });
  }

  for (const l of [
    { order: 1, title: 'JSON: el lenguaje de los datos',                   xpReward: 45, contentId: 'javascript-basico/module-10-json-fetch/lesson-01-json' },
    { order: 2, title: 'Fetch API: conectar con el mundo real',            xpReward: 60, contentId: 'javascript-basico/module-10-json-fetch/lesson-02-fetch' },
    { order: 3, title: 'Fetch avanzado: headers y autenticación',          xpReward: 65, contentId: 'javascript-basico/module-10-json-fetch/lesson-03-fetch-avanzado' },
  ]) await upsertLesson(mod10._id, l);
  console.log('✅  Módulo 10 listo (3 lecciones)');

  // ─── Módulo 11: localStorage ──────────────────────────────────────────────

  let mod11 = await ModuleModel.findOne({ courseId: course._id, order: 11 });
  if (!mod11) {
    mod11 = await ModuleModel.create({
      courseId: course._id,
      order: 11,
      title: 'localStorage',
      description: 'Persiste datos en el navegador para crear experiencias que se recuerdan',
    });
  }

  for (const l of [
    { order: 1, title: '¿Qué es localStorage?',          xpReward: 40, contentId: 'javascript-basico/module-11-localstorage/lesson-01-que-es-localstorage' },
    { order: 2, title: 'CRUD con localStorage',           xpReward: 50, contentId: 'javascript-basico/module-11-localstorage/lesson-02-crud-localstorage' },
    { order: 3, title: 'Patrones avanzados de storage',   xpReward: 55, contentId: 'javascript-basico/module-11-localstorage/lesson-03-patrones-storage' },
  ]) await upsertLesson(mod11._id, l);
  console.log('✅  Módulo 11 listo (3 lecciones)');

  // ─── Curso: HTML y CSS Básico ─────────────────────────────────────────────

  let courseHtml = await CourseModel.findOne({ slug: 'html-css-basico' });
  if (!courseHtml) {
    courseHtml = await CourseModel.create({
      slug: 'html-css-basico',
      title: 'HTML y CSS Básico',
      description: 'Aprende a construir páginas web desde cero con HTML y CSS',
      level: 'basic',
      iconEmoji: '🎨',
      order: 2,
    });
    console.log('✅  Curso "HTML y CSS Básico" creado');
  }

  // ─── Módulo 1: Estructura HTML ────────────────────────────────────────────

  let htmlMod1 = await ModuleModel.findOne({ courseId: courseHtml._id, order: 1 });
  if (!htmlMod1) {
    htmlMod1 = await ModuleModel.create({
      courseId: courseHtml._id,
      order: 1,
      title: 'Estructura HTML',
      description: 'Aprende la estructura fundamental de cualquier página web',
    });
  }

  for (const l of [
    { order: 1, title: '¿Qué es HTML?',       xpReward: 15, contentId: 'html-css-basico/module-01-estructura/lesson-01-que-es-html' },
    { order: 2, title: 'Headings y párrafos', xpReward: 15, contentId: 'html-css-basico/module-01-estructura/lesson-02-headings-parrafos' },
    { order: 3, title: 'Listas en HTML',      xpReward: 20, contentId: 'html-css-basico/module-01-estructura/lesson-03-listas' },
  ]) await upsertLesson(htmlMod1._id, l);
  console.log('✅  Módulo HTML 1 listo (3 lecciones)');

  // ─── Módulo 2: Texto y Enlaces ────────────────────────────────────────────

  let htmlMod2 = await ModuleModel.findOne({ courseId: courseHtml._id, order: 2 });
  if (!htmlMod2) {
    htmlMod2 = await ModuleModel.create({
      courseId: courseHtml._id,
      order: 2,
      title: 'Texto y Enlaces',
      description: 'Da formato al texto y conecta páginas con hipervínculos',
    });
  }

  for (const l of [
    { order: 1, title: 'Énfasis en texto', xpReward: 15, contentId: 'html-css-basico/module-02-texto-enlaces/lesson-01-enfasis-texto' },
    { order: 2, title: 'Hipervínculos',    xpReward: 20, contentId: 'html-css-basico/module-02-texto-enlaces/lesson-02-hipervinculos' },
  ]) await upsertLesson(htmlMod2._id, l);
  console.log('✅  Módulo HTML 2 listo (2 lecciones)');

  // ─── Módulo 3: Introducción a CSS ─────────────────────────────────────────

  let htmlMod3 = await ModuleModel.findOne({ courseId: courseHtml._id, order: 3 });
  if (!htmlMod3) {
    htmlMod3 = await ModuleModel.create({
      courseId: courseHtml._id,
      order: 3,
      title: 'Introducción a CSS',
      description: 'Añade estilo y color a tus páginas web',
    });
  }

  for (const l of [
    { order: 1, title: 'Selectores CSS',    xpReward: 20, contentId: 'html-css-basico/module-03-css/lesson-01-selectores' },
    { order: 2, title: 'Colores y texto',   xpReward: 25, contentId: 'html-css-basico/module-03-css/lesson-02-colores-texto' },
    { order: 3, title: 'El modelo de caja', xpReward: 30, contentId: 'html-css-basico/module-03-css/lesson-03-box-model' },
  ]) await upsertLesson(htmlMod3._id, l);
  console.log('✅  Módulo HTML 3 listo (3 lecciones)');

  // ─── Logros ───────────────────────────────────────────────────────────────

  await seedAchievements();

  const totalLecciones = 3 + 4 + 4 + 4 + 5 + 4 + 4 + 3 + 3 + 3 + 3 + 3 + 2 + 3;
  const totalXP = 15+15+20 + 20+25+25+30 + 25+25+30+35 + 30+35+35+40 + 35+40+45+45+50 + 40+40+50+45 + 40+45+50+55 + 50+55+60 + 45+45+50 + 45+60+65 + 40+50+55 + 15+15+20 + 15+20 + 20+25+30;
  console.log(`\n🎉  Seed completado!`);
  console.log(`    ${totalLecciones} lecciones · ${totalXP} XP total disponible`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌  Error en seed:', err);
  process.exit(1);
});
