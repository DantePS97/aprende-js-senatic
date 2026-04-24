import { Router, Response } from 'express';
import { CourseModel } from '../models/Course.model';
import { ModuleModel } from '../models/Module.model';
import { LessonModel } from '../models/Lesson.model';
import { LessonContentModel, ILessonContent } from '../models/LessonContent.model';
import { ProgressModel } from '../models/Progress.model';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import path from 'path';
import fs from 'fs';

/**
 * Attempts to JSON.parse a raw tests string (stored as serialized JSON array
 * in the DB after migration). Falls back to an empty array on any error.
 */
function safeParseTests(raw: string): unknown[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const coursesRouter = Router();

// Ruta base donde viven los JSONs de contenido (relativa al monorepo root)
const CONTENT_DIR = path.resolve(__dirname, '../../../../content');

// ─── GET /api/courses ─────────────────────────────────────────────────────────

coursesRouter.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const courses = await CourseModel.find({ isPublished: true }).sort({ order: 1 });
    res.json({ success: true, data: courses });
  } catch (err) {
    console.error('[courses/list]', err);
    res.status(500).json({ success: false, error: 'Error al obtener cursos.' });
  }
});

// ─── GET /api/courses/:id ─────────────────────────────────────────────────────

coursesRouter.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) {
      res.status(404).json({ success: false, error: 'Curso no encontrado.' });
      return;
    }

    const modules = await ModuleModel.find({ courseId: course._id, isPublished: true }).sort({ order: 1 });

    const modulesWithLessons = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await LessonModel.find({ moduleId: mod._id, isPublished: true }).sort({ order: 1 });
        return {
          _id: mod._id,
          courseId: mod.courseId,
          order: mod.order,
          title: mod.title,
          description: mod.description,
          lessons: lessons.map((l) => ({
            _id: l._id,
            moduleId: l.moduleId,
            order: l.order,
            title: l.title,
            xpReward: l.xpReward,
          })),
        };
      })
    );

    res.json({
      success: true,
      data: {
        ...course.toObject(),
        modules: modulesWithLessons,
        totalLessons: modulesWithLessons.reduce((acc, m) => acc + m.lessons.length, 0),
      },
    });
  } catch (err) {
    console.error('[courses/detail]', err);
    res.status(500).json({ success: false, error: 'Error al obtener el curso.' });
  }
});

// ─── GET /api/modules/:id/lessons ─────────────────────────────────────────────

coursesRouter.get('/modules/:moduleId/lessons', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const lessons = await LessonModel.find({
      moduleId: req.params.moduleId,
      isPublished: true,
    }).sort({ order: 1 });

    // Progreso del usuario para este módulo
    const lessonIds = lessons.map((l) => l._id);
    const progress = await ProgressModel.find({
      userId: req.user!.userId,
      lessonId: { $in: lessonIds },
    });

    const progressMap = new Map(progress.map((p) => [p.lessonId.toString(), p.status]));

    const data = lessons.map((l) => ({
      _id: l._id,
      moduleId: l.moduleId,
      order: l.order,
      title: l.title,
      xpReward: l.xpReward,
      status: progressMap.get(l._id.toString()) ?? 'not_started',
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error('[modules/lessons]', err);
    res.status(500).json({ success: false, error: 'Error al obtener lecciones.' });
  }
});

// ─── GET /api/courses/lessons/:id ─────────────────────────────────────────────

coursesRouter.get('/lessons/:lessonId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const lesson = await LessonModel.findById(req.params.lessonId);
    if (!lesson) {
      res.status(404).json({ success: false, error: 'Lección no encontrada.' });
      return;
    }

    // ─── Dual-read: DB first, filesystem fallback ─────────────────────────────
    // 1. Try the LessonContent collection (populated by migrate-content-to-db.ts)
    // 2. Fall back to filesystem if not yet migrated (lesson.contentId present)
    // 3. 404 if neither source has content

    let content: unknown;

    const dbContent = await LessonContentModel.findOne({ lessonId: lesson._id }).lean<ILessonContent>();

    if (dbContent) {
      // Adapt to the runtime shape the frontend expects.
      // The DB stores startCode + tests:string; the runtime contract uses starterCode + tests:array.
      content = {
        id: lesson.contentId ?? String(lesson._id),
        title: lesson.title,
        xpReward: lesson.xpReward,
        theory: dbContent.theory,
        exercises: dbContent.exercises.map((ex) => ({
          title: ex.title,
          type: ex.type,
          prompt: ex.prompt,
          starterCode: ex.startCode,                                    // runtime contract field
          tests: safeParseTests(ex.tests),                              // deserialize back to array
          hints: ex.hints,
        })),
      };
    } else if (lesson.contentId) {
      // Fallback: read from filesystem (migration not yet run for this lesson)
      console.warn(
        `[dual-read] Falling back to filesystem for lesson ${lesson._id} (contentId: ${lesson.contentId})`
      );
      const contentPath = path.join(CONTENT_DIR, `${lesson.contentId}.json`);
      if (!fs.existsSync(contentPath)) {
        res.status(404).json({ success: false, error: 'Contenido de lección no disponible.' });
        return;
      }
      try {
        content = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
      } catch {
        res.status(500).json({ success: false, error: 'Error al leer el contenido de la lección.' });
        return;
      }
    } else {
      res.status(404).json({ success: false, error: 'Contenido de lección no disponible.' });
      return;
    }
    // ──────────────────────────────────────────────────────────────────────────

    // Progreso del usuario para esta lección
    const progress = await ProgressModel.findOne({
      userId: req.user!.userId,
      lessonId: lesson._id,
    });

    // ─── Calcular lección siguiente ──────────────────────────────────────────
    const mod = await ModuleModel.findById(lesson.moduleId);
    const courseId = mod?.courseId?.toString() ?? null;

    const siblingsInModule = await LessonModel.find({
      moduleId: lesson.moduleId,
      isPublished: true,
    }).sort({ order: 1 });

    const currentIdx = siblingsInModule.findIndex((l) => l._id.equals(lesson._id));
    let nextLessonId: string | null = null;

    if (currentIdx !== -1 && currentIdx < siblingsInModule.length - 1) {
      // Siguiente lección en el mismo módulo
      nextLessonId = siblingsInModule[currentIdx + 1]._id.toString();
    } else if (mod) {
      // Última lección del módulo: buscar la primera lección del módulo siguiente
      const nextMod = await ModuleModel.findOne({
        courseId: mod.courseId,
        order: mod.order + 1,
        isPublished: true,
      });
      if (nextMod) {
        const firstOfNext = await LessonModel.findOne({
          moduleId: nextMod._id,
          isPublished: true,
        }).sort({ order: 1 });
        nextLessonId = firstOfNext?._id.toString() ?? null;
      }
    }

    res.json({
      success: true,
      data: {
        lesson: {
          _id: lesson._id,
          moduleId: lesson.moduleId,
          courseId,
          order: lesson.order,
          title: lesson.title,
          xpReward: lesson.xpReward,
          nextLessonId,
        },
        content,
        progress: progress
          ? {
              status: progress.status,
              xpEarned: progress.xpEarned,
              attempts: progress.attempts,
              hintsUsed: progress.hintsUsed,
            }
          : null,
      },
    });
  } catch (err) {
    console.error('[lessons/detail]', err);
    res.status(500).json({ success: false, error: 'Error al obtener la lección.' });
  }
});
