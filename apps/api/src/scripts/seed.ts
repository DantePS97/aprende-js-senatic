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
import { seedAchievements } from './seed-achievements';

const MONGODB_URI = process.env.MONGODB_URI || '';

async function upsertLesson(moduleId: mongoose.Types.ObjectId, data: {
  order: number; title: string; xpReward: number; contentId: string;
}) {
  await LessonModel.findOneAndUpdate(
    { moduleId, order: data.order },
    { $set: { title: data.title, xpReward: data.xpReward, contentId: data.contentId } },
    { upsert: true, new: true }
  );
}

async function seedModule(
  courseId: mongoose.Types.ObjectId,
  order: number,
  title: string,
  description: string,
  lessons: { order: number; title: string; xpReward: number; contentId: string }[]
) {
  const mod = await ModuleModel.findOneAndUpdate(
    { courseId, order },
    { $set: { title, description } },
    { upsert: true, new: true }
  );
  for (const lesson of lessons) {
    await upsertLesson(mod._id as mongoose.Types.ObjectId, lesson);
  }
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
    { order: 4, title: 'Imágenes',            xpReward: 20, contentId: 'html-css-basico/module-01-estructura/lesson-04-imagenes' },
    { order: 5, title: 'Formularios',         xpReward: 25, contentId: 'html-css-basico/module-01-estructura/lesson-05-formularios' },
    { order: 6, title: 'HTML semántico',      xpReward: 25, contentId: 'html-css-basico/module-01-estructura/lesson-06-semantica' },
  ]) await upsertLesson(htmlMod1._id, l);
  console.log('✅  Módulo HTML 1 listo (6 lecciones)');

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
    { order: 3, title: 'Rutas y anclas',   xpReward: 20, contentId: 'html-css-basico/module-02-texto-enlaces/lesson-03-rutas-y-anclas' },
  ]) await upsertLesson(htmlMod2._id, l);
  console.log('✅  Módulo HTML 2 listo (3 lecciones)');

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
    { order: 4, title: 'Unidades CSS',      xpReward: 25, contentId: 'html-css-basico/module-03-css/lesson-04-unidades' },
    { order: 5, title: 'Display',           xpReward: 30, contentId: 'html-css-basico/module-03-css/lesson-05-display' },
    { order: 6, title: 'Flexbox',           xpReward: 35, contentId: 'html-css-basico/module-03-css/lesson-06-flexbox' },
    { order: 7, title: 'Pseudo-clases',     xpReward: 30, contentId: 'html-css-basico/module-03-css/lesson-07-pseudoclases' },
  ]) await upsertLesson(htmlMod3._id, l);
  console.log('✅  Módulo HTML 3 listo (7 lecciones)');

  // ─── Módulo 4: Layout ─────────────────────────────────────────────────────

  let htmlMod4 = await ModuleModel.findOne({ courseId: courseHtml._id, order: 4 });
  if (!htmlMod4) {
    htmlMod4 = await ModuleModel.create({
      courseId: courseHtml._id,
      order: 4,
      title: 'Layout',
      description: 'Controla la posición y el apilamiento de los elementos en la página',
    });
  }

  for (const l of [
    { order: 1, title: 'Position',  xpReward: 35, contentId: 'html-css-basico/module-04-layout/lesson-01-position' },
    { order: 2, title: 'z-index',   xpReward: 40, contentId: 'html-css-basico/module-04-layout/lesson-02-z-index' },
  ]) await upsertLesson(htmlMod4._id, l);
  console.log('✅  Módulo HTML 4 listo (2 lecciones)');

  // ─── Módulo 5: Responsive ─────────────────────────────────────────────────

  let htmlMod5 = await ModuleModel.findOne({ courseId: courseHtml._id, order: 5 });
  if (!htmlMod5) {
    htmlMod5 = await ModuleModel.create({
      courseId: courseHtml._id,
      order: 5,
      title: 'Diseño Responsive',
      description: 'Haz que tus páginas se vean bien en cualquier dispositivo',
    });
  }

  for (const l of [
    { order: 1, title: 'Viewport y meta tag', xpReward: 25, contentId: 'html-css-basico/module-05-responsive/lesson-01-viewport-meta' },
    { order: 2, title: 'Media Queries',       xpReward: 35, contentId: 'html-css-basico/module-05-responsive/lesson-02-media-queries' },
  ]) await upsertLesson(htmlMod5._id, l);
  console.log('✅  Módulo HTML 5 listo (2 lecciones)');

  // ─── Curso: JavaScript Intermedio ────────────────────────────────────────────
  let jsIntermedio = await CourseModel.findOne({ slug: 'javascript-intermedio' });
  if (!jsIntermedio) {
    jsIntermedio = await CourseModel.create({
      slug: 'javascript-intermedio',
      title: 'JavaScript Intermedio',
      description: 'Closures, OOP, el Event Loop, módulos ES y patrones de diseño',
      level: 'intermediate',
      iconEmoji: '⚙️',
      order: 2,
      isPublished: true,
      prerequisiteSlug: 'javascript-basico',
    });
    console.log('✅  Curso "JavaScript Intermedio" creado');
  }

  // Módulo 1 — Closures y funciones avanzadas
  await seedModule(jsIntermedio._id, 1, 'Closures y funciones avanzadas', 'Domina el mecanismo de cierre y los patrones funcionales', [
    { order: 1, title: '¿Qué es un closure?',               xpReward: 40, contentId: 'javascript-intermedio/module-01-closures/lesson-01-que-es-un-closure' },
    { order: 2, title: 'Casos de uso de closures',          xpReward: 45, contentId: 'javascript-intermedio/module-01-closures/lesson-02-casos-de-uso' },
    { order: 3, title: 'IIFE: funciones autoejecutadas',    xpReward: 40, contentId: 'javascript-intermedio/module-01-closures/lesson-03-iife' },
    { order: 4, title: 'Funciones de orden superior',       xpReward: 45, contentId: 'javascript-intermedio/module-01-closures/lesson-04-higher-order' },
    { order: 5, title: 'Currying y composición',            xpReward: 55, contentId: 'javascript-intermedio/module-01-closures/lesson-05-currying' },
  ]);
  console.log('✅  Módulo JS-I 1 listo (5 lecciones)');

  // Módulo 2 — Prototipos y cadena de herencia
  await seedModule(jsIntermedio._id, 2, 'Prototipos y cadena de herencia', 'Entiende el motor real detrás de la OOP en JavaScript', [
    { order: 1, title: 'El prototype chain',                xpReward: 45, contentId: 'javascript-intermedio/module-02-prototipos/lesson-01-prototype-chain' },
    { order: 2, title: 'Object.create()',                   xpReward: 45, contentId: 'javascript-intermedio/module-02-prototipos/lesson-02-object-create' },
    { order: 3, title: 'Herencia prototípica manual',       xpReward: 50, contentId: 'javascript-intermedio/module-02-prototipos/lesson-03-herencia-manual' },
    { order: 4, title: 'hasOwnProperty e instanceof',       xpReward: 40, contentId: 'javascript-intermedio/module-02-prototipos/lesson-04-hasownproperty' },
  ]);
  console.log('✅  Módulo JS-I 2 listo (4 lecciones)');

  // Módulo 3 — Clases y OOP
  await seedModule(jsIntermedio._id, 3, 'Clases y Programación Orientada a Objetos', 'OOP moderna con clases ES6 y encapsulación', [
    { order: 1, title: 'Clases ES6: constructor y métodos',  xpReward: 45, contentId: 'javascript-intermedio/module-03-clases/lesson-01-clases-basicas' },
    { order: 2, title: 'Herencia con extends y super',       xpReward: 50, contentId: 'javascript-intermedio/module-03-clases/lesson-02-herencia' },
    { order: 3, title: 'Getters y setters',                  xpReward: 45, contentId: 'javascript-intermedio/module-03-clases/lesson-03-getters-setters' },
    { order: 4, title: 'Métodos y propiedades estáticos',    xpReward: 45, contentId: 'javascript-intermedio/module-03-clases/lesson-04-static' },
    { order: 5, title: 'Campos privados con #',              xpReward: 50, contentId: 'javascript-intermedio/module-03-clases/lesson-05-privados' },
  ]);
  console.log('✅  Módulo JS-I 3 listo (5 lecciones)');

  // Módulo 4 — El Event Loop
  await seedModule(jsIntermedio._id, 4, 'El Event Loop', 'Cómo JavaScript ejecuta código asíncrono bajo el capó', [
    { order: 1, title: 'Call Stack y Memory Heap',           xpReward: 50, contentId: 'javascript-intermedio/module-04-event-loop/lesson-01-call-stack' },
    { order: 2, title: 'Macrotasks vs Microtasks',           xpReward: 55, contentId: 'javascript-intermedio/module-04-event-loop/lesson-02-macro-micro' },
    { order: 3, title: 'setTimeout vs Promise: ¿quién gana?', xpReward: 60, contentId: 'javascript-intermedio/module-04-event-loop/lesson-03-orden-ejecucion' },
    { order: 4, title: 'queueMicrotask y requestAnimationFrame', xpReward: 60, contentId: 'javascript-intermedio/module-04-event-loop/lesson-04-queue-raf' },
  ]);
  console.log('✅  Módulo JS-I 4 listo (4 lecciones)');

  // Módulo 5 — Módulos ES
  await seedModule(jsIntermedio._id, 5, 'Módulos ES', 'Organiza tu código con el sistema de módulos nativo', [
    { order: 1, title: 'export e import: named y default',   xpReward: 40, contentId: 'javascript-intermedio/module-05-modulos/lesson-01-import-export' },
    { order: 2, title: 'Re-exportación y barrel files',      xpReward: 40, contentId: 'javascript-intermedio/module-05-modulos/lesson-02-reexportacion' },
    { order: 3, title: 'Importación dinámica con import()',  xpReward: 50, contentId: 'javascript-intermedio/module-05-modulos/lesson-03-dynamic-import' },
    { order: 4, title: 'ESM vs CommonJS',                    xpReward: 45, contentId: 'javascript-intermedio/module-05-modulos/lesson-04-esm-vs-cjs' },
  ]);
  console.log('✅  Módulo JS-I 5 listo (4 lecciones)');

  // Módulo 6 — Colecciones avanzadas
  await seedModule(jsIntermedio._id, 6, 'Colecciones avanzadas', 'Map, Set, WeakMap y WeakSet', [
    { order: 1, title: 'Map: el objeto mejorado',            xpReward: 45, contentId: 'javascript-intermedio/module-06-colecciones/lesson-01-map' },
    { order: 2, title: 'Set: valores únicos',                xpReward: 40, contentId: 'javascript-intermedio/module-06-colecciones/lesson-02-set' },
    { order: 3, title: 'WeakMap y WeakSet',                  xpReward: 45, contentId: 'javascript-intermedio/module-06-colecciones/lesson-03-weakmap-weakset' },
    { order: 4, title: 'Iteración avanzada sobre colecciones', xpReward: 40, contentId: 'javascript-intermedio/module-06-colecciones/lesson-04-iteracion-avanzada' },
  ]);
  console.log('✅  Módulo JS-I 6 listo (4 lecciones)');

  // Módulo 7 — Iteradores y Generadores
  await seedModule(jsIntermedio._id, 7, 'Iteradores y Generadores', 'El protocolo iterable, generadores y evaluación lazy', [
    { order: 1, title: 'El protocolo de iteración',          xpReward: 50, contentId: 'javascript-intermedio/module-07-iteradores/lesson-01-protocolo-iteracion' },
    { order: 2, title: 'Generadores: function* y yield',     xpReward: 55, contentId: 'javascript-intermedio/module-07-iteradores/lesson-02-generadores' },
    { order: 3, title: 'Generadores asíncronos',             xpReward: 60, contentId: 'javascript-intermedio/module-07-iteradores/lesson-03-generadores-async' },
    { order: 4, title: 'Casos de uso avanzados',             xpReward: 55, contentId: 'javascript-intermedio/module-07-iteradores/lesson-04-casos-de-uso' },
  ]);
  console.log('✅  Módulo JS-I 7 listo (4 lecciones)');

  // Módulo 8 — Patrones de diseño
  await seedModule(jsIntermedio._id, 8, 'Patrones de diseño en JavaScript', 'Singleton, Factory, Observer, Strategy, Decorator, Proxy y Reflect', [
    { order: 1, title: 'Singleton y Factory',                xpReward: 50, contentId: 'javascript-intermedio/module-08-patrones/lesson-01-singleton-factory' },
    { order: 2, title: 'Observer y Pub/Sub',                 xpReward: 55, contentId: 'javascript-intermedio/module-08-patrones/lesson-02-observer-pubsub' },
    { order: 3, title: 'Strategy y Decorator',               xpReward: 50, contentId: 'javascript-intermedio/module-08-patrones/lesson-03-strategy-decorator' },
    { order: 4, title: 'Proxy y Reflect',                    xpReward: 55, contentId: 'javascript-intermedio/module-08-patrones/lesson-04-proxy-reflect' },
  ]);
  console.log('✅  Módulo JS-I 8 listo (4 lecciones)');

  // Módulo 9 — Expresiones regulares
  await seedModule(jsIntermedio._id, 9, 'Expresiones regulares', 'Busca, valida y transforma texto con regex', [
    { order: 1, title: 'Fundamentos de regex',                     xpReward: 50, contentId: 'javascript-intermedio/module-09-regex/lesson-01-fundamentos-regex' },
    { order: 2, title: 'Grupos de captura y reemplazos',           xpReward: 50, contentId: 'javascript-intermedio/module-09-regex/lesson-02-grupos-reemplazo' },
    { order: 3, title: 'Regex avanzado: lookahead y rendimiento',  xpReward: 55, contentId: 'javascript-intermedio/module-09-regex/lesson-03-regex-avanzado' },
  ]);
  console.log('✅  Módulo JS-I 9 listo (3 lecciones)');

  // Módulo 10 — APIs del navegador avanzadas
  await seedModule(jsIntermedio._id, 10, 'APIs del navegador avanzadas', 'IntersectionObserver, Storage, Web Workers y Performance API', [
    { order: 1, title: 'IntersectionObserver: lazy loading',  xpReward: 50, contentId: 'javascript-intermedio/module-10-apis-navegador/lesson-01-intersection-observer' },
    { order: 2, title: 'Storage y Cache API',                 xpReward: 45, contentId: 'javascript-intermedio/module-10-apis-navegador/lesson-02-storage-cache' },
    { order: 3, title: 'Web Workers: paralelismo en el navegador', xpReward: 55, contentId: 'javascript-intermedio/module-10-apis-navegador/lesson-03-web-workers' },
    { order: 4, title: 'Performance API y optimización',      xpReward: 50, contentId: 'javascript-intermedio/module-10-apis-navegador/lesson-04-performance-apis' },
  ]);
  console.log('✅  Módulo JS-I 10 listo (4 lecciones)');

  // ─── Curso: HTML/CSS Intermedio ──────────────────────────────────────────

  const htmlCssIntermedio = await CourseModel.findOneAndUpdate(
    { slug: 'html-css-intermedio' },
    {
      $setOnInsert: {
        slug: 'html-css-intermedio',
        title: 'HTML/CSS Intermedio',
        description: 'Domina CSS Grid, variables, animaciones, selectores avanzados y diseño responsive moderno',
        level: 'intermediate',
        iconEmoji: '🎨',
        order: 4,
      },
    },
    { upsert: true, new: true }
  );
  console.log('✅  Curso "HTML/CSS Intermedio" listo');

  // Módulo 1 — CSS Grid
  await seedModule(htmlCssIntermedio._id, 1, 'CSS Grid', 'Domina el sistema de grid bidimensional de CSS', [
    { order: 1, title: 'Grid básico: columnas y filas',          xpReward: 25, contentId: 'html-css-intermedio/module-01-grid/lesson-01-grid-basico' },
    { order: 2, title: 'Grid areas nombradas',                   xpReward: 30, contentId: 'html-css-intermedio/module-01-grid/lesson-02-grid-areas' },
    { order: 3, title: 'Grid responsive: auto-fill y auto-fit',  xpReward: 35, contentId: 'html-css-intermedio/module-01-grid/lesson-03-grid-responsive' },
    { order: 4, title: 'Alineación en Grid',                     xpReward: 30, contentId: 'html-css-intermedio/module-01-grid/lesson-04-grid-alineacion' },
  ]);
  console.log('✅  Módulo CSS-I 1 listo (4 lecciones)');

  // Módulo 2 — Variables CSS
  await seedModule(htmlCssIntermedio._id, 2, 'Variables CSS', 'Custom properties, temas dinámicos y cálculos', [
    { order: 1, title: 'Variables CSS: custom properties',       xpReward: 25, contentId: 'html-css-intermedio/module-02-variables/lesson-01-variables-css' },
    { order: 2, title: 'Temas con variables CSS',                xpReward: 30, contentId: 'html-css-intermedio/module-02-variables/lesson-02-variables-temas' },
    { order: 3, title: 'Variables y calc()',                     xpReward: 30, contentId: 'html-css-intermedio/module-02-variables/lesson-03-variables-calc' },
  ]);
  console.log('✅  Módulo CSS-I 2 listo (3 lecciones)');

  // Módulo 3 — Transiciones y Transforms
  await seedModule(htmlCssIntermedio._id, 3, 'Transiciones y Transforms', 'Anima con transition, transform 2D y 3D', [
    { order: 1, title: 'Transiciones CSS',                       xpReward: 25, contentId: 'html-css-intermedio/module-03-transiciones/lesson-01-transiciones' },
    { order: 2, title: 'Transform 2D',                           xpReward: 30, contentId: 'html-css-intermedio/module-03-transiciones/lesson-02-transform-2d' },
    { order: 3, title: 'Transform 3D y perspective',             xpReward: 35, contentId: 'html-css-intermedio/module-03-transiciones/lesson-03-transform-3d' },
    { order: 4, title: 'Transiciones prácticas: hover effects',  xpReward: 35, contentId: 'html-css-intermedio/module-03-transiciones/lesson-04-transiciones-practicas' },
  ]);
  console.log('✅  Módulo CSS-I 3 listo (4 lecciones)');

  // Módulo 4 — Animaciones CSS
  await seedModule(htmlCssIntermedio._id, 4, 'Animaciones CSS', '@keyframes, fill-mode, play-state y patrones prácticos', [
    { order: 1, title: '@keyframes y animation',                 xpReward: 30, contentId: 'html-css-intermedio/module-04-animaciones/lesson-01-keyframes' },
    { order: 2, title: 'Propiedades avanzadas de animation',     xpReward: 35, contentId: 'html-css-intermedio/module-04-animaciones/lesson-02-animacion-propiedades' },
    { order: 3, title: 'Animaciones prácticas: skeleton y más',  xpReward: 40, contentId: 'html-css-intermedio/module-04-animaciones/lesson-03-animaciones-practicas' },
  ]);
  console.log('✅  Módulo CSS-I 4 listo (3 lecciones)');

  // Módulo 5 — Selectores Avanzados
  await seedModule(htmlCssIntermedio._id, 5, 'Selectores Avanzados', 'Combinadores, atributos, pseudo-clases modernas y especificidad', [
    { order: 1, title: 'Combinadores CSS',                        xpReward: 25, contentId: 'html-css-intermedio/module-05-selectores/lesson-01-combinadores' },
    { order: 2, title: 'Selectores de atributo',                  xpReward: 25, contentId: 'html-css-intermedio/module-05-selectores/lesson-02-selectores-atributo' },
    { order: 3, title: 'Pseudo-clases avanzadas: :is(), :has()',  xpReward: 35, contentId: 'html-css-intermedio/module-05-selectores/lesson-03-pseudo-clases-avanzadas' },
    { order: 4, title: 'Especificidad y la cascada CSS',          xpReward: 35, contentId: 'html-css-intermedio/module-05-selectores/lesson-04-especificidad' },
  ]);
  console.log('✅  Módulo CSS-I 5 listo (4 lecciones)');

  // Módulo 6 — Diseño Responsive Moderno
  await seedModule(htmlCssIntermedio._id, 6, 'Diseño Responsive Moderno', 'clamp(), container queries e imágenes adaptativas', [
    { order: 1, title: 'Layout fluido con clamp(), min() y max()', xpReward: 35, contentId: 'html-css-intermedio/module-06-responsive/lesson-01-fluid-layout' },
    { order: 2, title: 'Container Queries',                        xpReward: 40, contentId: 'html-css-intermedio/module-06-responsive/lesson-02-container-queries' },
    { order: 3, title: 'Imágenes adaptativas',                     xpReward: 35, contentId: 'html-css-intermedio/module-06-responsive/lesson-03-imagenes-adaptativas' },
  ]);
  console.log('✅  Módulo CSS-I 6 listo (3 lecciones)');

  // Módulo 7 — Formularios Avanzados
  await seedModule(htmlCssIntermedio._id, 7, 'Formularios Avanzados', 'Validación HTML5, pseudo-estados y estilos personalizados', [
    { order: 1, title: 'Validación HTML5 nativa',                 xpReward: 30, contentId: 'html-css-intermedio/module-07-formularios/lesson-01-validacion-html5' },
    { order: 2, title: 'Pseudo-estados de formulario',            xpReward: 30, contentId: 'html-css-intermedio/module-07-formularios/lesson-02-pseudo-estados-form' },
    { order: 3, title: 'Estilos personalizados de inputs',        xpReward: 35, contentId: 'html-css-intermedio/module-07-formularios/lesson-03-estilos-personalizados' },
  ]);
  console.log('✅  Módulo CSS-I 7 listo (3 lecciones)');

  // Módulo 8 — Efectos Visuales
  await seedModule(htmlCssIntermedio._id, 8, 'Efectos Visuales', 'filter, clip-path y blend modes', [
    { order: 1, title: 'filter: blur, brightness y más',         xpReward: 30, contentId: 'html-css-intermedio/module-08-efectos/lesson-01-filter-css' },
    { order: 2, title: 'clip-path: formas y recortes',           xpReward: 35, contentId: 'html-css-intermedio/module-08-efectos/lesson-02-clip-path' },
    { order: 3, title: 'Blend modes y efectos de composición',   xpReward: 35, contentId: 'html-css-intermedio/module-08-efectos/lesson-03-blend-modes' },
  ]);
  console.log('✅  Módulo CSS-I 8 listo (3 lecciones)');

  // ─── Curso: React Básico ─────────────────────────────────────────────────

  const reactBasico = await CourseModel.findOneAndUpdate(
    { slug: 'react-basico' },
    {
      $setOnInsert: {
        slug: 'react-basico',
        title: 'React Básico',
        description: 'Aprende a construir interfaces modernas con React 18: componentes, props, estado, efectos y organización de proyectos',
        level: 'basic',
        iconEmoji: '⚛️',
        order: 5,
        isPublished: false,
        prerequisiteSlug: 'javascript-basico',
      },
    },
    { upsert: true, new: true }
  );
  console.log('✅  Curso "React Básico" listo');

  await seedModule(reactBasico._id, 1, 'Fundamentos de React', 'Qué es React, cómo funciona JSX y cómo crear tus primeros componentes', [
    { order: 1, title: '¿Qué es React y por qué existe?',    xpReward: 10, contentId: 'react-basico/module-01-fundamentos/lesson-01-que-es-react' },
    { order: 2, title: 'Tu primer componente',               xpReward: 20, contentId: 'react-basico/module-01-fundamentos/lesson-02-primer-componente' },
    { order: 3, title: 'JSX: HTML dentro de JavaScript',     xpReward: 20, contentId: 'react-basico/module-01-fundamentos/lesson-03-jsx' },
    { order: 4, title: 'Expresiones y atributos en JSX',     xpReward: 20, contentId: 'react-basico/module-01-fundamentos/lesson-04-expresiones-jsx' },
    { order: 5, title: 'Múltiples componentes y Fragmentos', xpReward: 10, contentId: 'react-basico/module-01-fundamentos/lesson-05-fragmentos' },
  ]);

  await seedModule(reactBasico._id, 2, 'Props y composición', 'Pasa datos entre componentes con props y compón interfaces complejas', [
    { order: 1, title: '¿Qué son las props?',          xpReward: 10, contentId: 'react-basico/module-02-props/lesson-01-que-son-props' },
    { order: 2, title: 'Pasar y recibir props',        xpReward: 20, contentId: 'react-basico/module-02-props/lesson-02-pasar-props' },
    { order: 3, title: 'La prop children',             xpReward: 20, contentId: 'react-basico/module-02-props/lesson-03-prop-children' },
    { order: 4, title: 'Props como funciones',         xpReward: 20, contentId: 'react-basico/module-02-props/lesson-04-props-funciones' },
    { order: 5, title: 'Composición de componentes',   xpReward: 10, contentId: 'react-basico/module-02-props/lesson-05-composicion' },
  ]);

  await seedModule(reactBasico._id, 3, 'Estado con useState', 'Haz que tus componentes recuerden y actualicen información con el hook useState', [
    { order: 1, title: '¿Qué es el estado?',              xpReward: 10, contentId: 'react-basico/module-03-estado/lesson-01-que-es-estado' },
    { order: 2, title: 'useState: el hook de estado',     xpReward: 20, contentId: 'react-basico/module-03-estado/lesson-02-usestate' },
    { order: 3, title: 'Actualizar estado correctamente', xpReward: 20, contentId: 'react-basico/module-03-estado/lesson-03-actualizar-estado' },
    { order: 4, title: 'Estado con objetos y arrays',     xpReward: 20, contentId: 'react-basico/module-03-estado/lesson-04-estado-objetos' },
    { order: 5, title: 'Elevar el estado',                xpReward: 10, contentId: 'react-basico/module-03-estado/lesson-05-elevar-estado' },
  ]);

  await seedModule(reactBasico._id, 4, 'Efectos con useEffect', 'Sincroniza tu componente con el mundo exterior: timers, fetch y limpieza', [
    { order: 1, title: '¿Qué es useEffect?',              xpReward: 10, contentId: 'react-basico/module-04-efectos/lesson-01-que-es-useeffect' },
    { order: 2, title: 'Fetch de datos con useEffect',    xpReward: 20, contentId: 'react-basico/module-04-efectos/lesson-02-useeffect-fetch' },
    { order: 3, title: 'Array de dependencias',           xpReward: 20, contentId: 'react-basico/module-04-efectos/lesson-03-dependencias' },
    { order: 4, title: 'Limpieza de efectos (cleanup)',   xpReward: 20, contentId: 'react-basico/module-04-efectos/lesson-04-cleanup' },
    { order: 5, title: 'Reglas de los hooks',             xpReward: 10, contentId: 'react-basico/module-04-efectos/lesson-05-reglas-hooks' },
  ]);

  await seedModule(reactBasico._id, 5, 'Formularios', 'Maneja entradas del usuario con inputs controlados, validación y submit', [
    { order: 1, title: 'Inputs controlados',               xpReward: 10, contentId: 'react-basico/module-05-formularios/lesson-01-inputs-controlados' },
    { order: 2, title: 'Formularios con múltiples campos', xpReward: 20, contentId: 'react-basico/module-05-formularios/lesson-02-multiples-campos' },
    { order: 3, title: 'Validación de formularios',        xpReward: 20, contentId: 'react-basico/module-05-formularios/lesson-03-validacion' },
    { order: 4, title: 'Select, checkbox y radio',         xpReward: 20, contentId: 'react-basico/module-05-formularios/lesson-04-select-checkbox' },
    { order: 5, title: 'Formulario completo',              xpReward: 10, contentId: 'react-basico/module-05-formularios/lesson-05-formulario-completo' },
  ]);

  await seedModule(reactBasico._id, 6, 'Listas y renderizado condicional', 'Renderiza listas dinámicas, filtra contenido y muestra UI condicional', [
    { order: 1, title: 'Renderizar listas con map',        xpReward: 10, contentId: 'react-basico/module-06-listas/lesson-01-renderizar-listas' },
    { order: 2, title: 'Filtrar y transformar listas',     xpReward: 20, contentId: 'react-basico/module-06-listas/lesson-02-filtrar-listas' },
    { order: 3, title: 'Renderizado condicional',          xpReward: 20, contentId: 'react-basico/module-06-listas/lesson-03-renderizado-condicional' },
    { order: 4, title: 'Agregar y eliminar de listas',     xpReward: 20, contentId: 'react-basico/module-06-listas/lesson-04-agregar-eliminar' },
    { order: 5, title: 'Listas de componentes',            xpReward: 10, contentId: 'react-basico/module-06-listas/lesson-05-listas-componentes' },
  ]);

  await seedModule(reactBasico._id, 7, 'Organización de proyectos React', 'Estructura componentes, crea custom hooks y construye una Todo App como proyecto final', [
    { order: 1, title: 'Estructura de archivos',               xpReward: 10, contentId: 'react-basico/module-07-organizacion/lesson-01-estructura-archivos' },
    { order: 2, title: 'Custom hooks',                         xpReward: 20, contentId: 'react-basico/module-07-organizacion/lesson-02-custom-hooks' },
    { order: 3, title: 'Separar responsabilidades',            xpReward: 20, contentId: 'react-basico/module-07-organizacion/lesson-03-separar-responsabilidades' },
    { order: 4, title: 'Buenas prácticas en React',            xpReward: 20, contentId: 'react-basico/module-07-organizacion/lesson-04-buenas-practicas' },
    { order: 5, title: 'Proyecto final: Todo App',             xpReward: 30, contentId: 'react-basico/module-07-organizacion/lesson-05-proyecto-final' },
  ]);

  // ─── Logros ───────────────────────────────────────────────────────────────

  await seedAchievements();

  // JS básico: 3+4+4+4+5+4+4+3+3+3+3 = 40 lecciones
  // HTML/CSS básico: 6+3+7+2+2 = 20 lecciones
  // JS intermedio: 5+4+5+4+4+4+4+4+3+4 = 41 lecciones
  // HTML/CSS intermedio: 4+3+4+3+4+3+3+3 = 27 lecciones
  const totalLecciones = 40 + 20 + 41 + 27; // 128
  const totalXP =
    // JS básico
    15+15+20 + 20+25+25+30 + 25+25+30+35 + 30+35+35+40 + 35+40+45+45+50 +
    40+40+50+45 + 40+45+50+55 + 50+55+60 + 45+45+50 + 45+60+65 + 40+50+55 +
    // HTML/CSS básico
    15+15+20+20+25+25 + 15+20+20 + 20+25+30+25+30+35+30 + 35+40 + 25+35 +
    // JS intermedio
    40+45+40+45+55 + 45+45+50+40 + 45+50+45+45+50 + 50+55+60+60 + 40+40+50+45 +
    45+40+45+40 + 50+55+60+55 + 50+55+50+55 + 50+50+55 + 50+45+55+50 +
    // HTML/CSS intermedio
    25+30+35+30 + 25+30+30 + 25+30+35+35 + 30+35+40 + 25+25+35+35 + 35+40+35 + 30+30+35 + 30+35+35;
  console.log(`\n🎉  Seed completado!`);
  console.log(`    ${totalLecciones} lecciones · ${totalXP} XP total disponible`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌  Error en seed:', err);
  process.exit(1);
});
