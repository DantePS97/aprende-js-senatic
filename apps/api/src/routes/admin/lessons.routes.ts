import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { LessonModel } from '../../models/Lesson.model';
import { LessonContentModel } from '../../models/LessonContent.model';
import { validateBody } from '../../middleware/validate.middleware';
import { writeAudit } from '../../services/audit.service';
import { reorderEntity } from '../../services/reorder.service';
import {
  LessonCreateSchema,
  LessonUpdateSchema,
  LessonContentSchema,
  ReorderSchema,
} from '@senatic/shared';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();

// ─── GET / ────────────────────────────────────────────────────────────────────
// List lessons by moduleId (required)

router.get('/', async (req, res: Response) => {
  try {
    const { moduleId } = req.query;

    if (!moduleId || typeof moduleId !== 'string') {
      res.status(400).json({ success: false, error: 'El parámetro moduleId es obligatorio.' });
      return;
    }

    const lessons = await LessonModel.find({ moduleId }).sort({ order: 1 });
    res.json({ success: true, data: lessons });
  } catch (err) {
    console.error('[admin/lessons/list]', err);
    res.status(500).json({ success: false, error: 'Error al obtener lecciones.' });
  }
});

// ─── POST / ───────────────────────────────────────────────────────────────────
// Create lesson + auto-create empty LessonContent

router.post('/', validateBody(LessonCreateSchema), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;
    const { moduleId } = body;

    // order = max in module + 1
    const last = await LessonModel.findOne({ moduleId }).sort({ order: -1 }).select('order');
    const order = last ? last.order + 1 : 1;

    const lesson = await LessonModel.create({
      ...body,
      order,
      isPublished: body.isPublished ?? false,
    });

    // Auto-create empty LessonContent (1:1 with lesson)
    await LessonContentModel.create({
      lessonId: lesson._id,
      theory: { markdown: '', examples: [] },
      exercises: [],
      version: 1,
    });

    writeAudit({
      adminId: req.user!.userId,
      action: 'create',
      entityType: 'lesson',
      entityId: lesson._id,
      metadata: { moduleId, title: lesson.title },
    });

    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    console.error('[admin/lessons/create]', err);
    res.status(500).json({ success: false, error: 'Error al crear la lección.' });
  }
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────
// Lesson metadata only

router.get('/:id', async (req, res: Response) => {
  try {
    const lesson = await LessonModel.findById(req.params.id);
    if (!lesson) {
      res.status(404).json({ success: false, error: 'Lección no encontrada.' });
      return;
    }
    res.json({ success: true, data: lesson });
  } catch (err) {
    console.error('[admin/lessons/detail]', err);
    res.status(500).json({ success: false, error: 'Error al obtener la lección.' });
  }
});

// ─── PUT /:id ─────────────────────────────────────────────────────────────────
// Update lesson metadata (optimistic lock, moduleId immutable)

router.put('/:id', validateBody(LessonUpdateSchema), async (req: AuthRequest, res: Response) => {
  try {
    const lesson = await LessonModel.findById(req.params.id);
    if (!lesson) {
      res.status(404).json({ success: false, error: 'Lección no encontrada.' });
      return;
    }

    const body = req.body;

    // Optimistic lock check
    if (body.updatedAt && lesson.updatedAt.toISOString() !== body.updatedAt) {
      res.status(409).json({ success: false, error: 'STALE_ENTITY', serverUpdatedAt: lesson.updatedAt });
      return;
    }

    // Strip moduleId — immutable; strip updatedAt — not a model field
    const { moduleId: _moduleId, updatedAt: _updatedAt, ...updateData } = body;

    Object.assign(lesson, updateData);
    await lesson.save();

    writeAudit({
      adminId: req.user!.userId,
      action: 'update',
      entityType: 'lesson',
      entityId: lesson._id,
      metadata: { title: lesson.title },
    });

    res.json({ success: true, data: lesson });
  } catch (err) {
    console.error('[admin/lessons/update]', err);
    res.status(500).json({ success: false, error: 'Error al actualizar la lección.' });
  }
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────
// Cascade delete: lesson + LessonContent in Mongo transaction

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const lesson = await LessonModel.findById(req.params.id);
    if (!lesson) {
      res.status(404).json({ success: false, error: 'Lección no encontrada.' });
      return;
    }

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await LessonModel.findByIdAndDelete(req.params.id, { session });
      await LessonContentModel.deleteOne({ lessonId: req.params.id }, { session });
    });
    await session.endSession();

    writeAudit({
      adminId: req.user!.userId,
      action: 'delete',
      entityType: 'lesson',
      entityId: lesson._id,
      metadata: { moduleId: lesson.moduleId.toString(), title: lesson.title },
    });

    res.json({ success: true, data: null });
  } catch (err) {
    console.error('[admin/lessons/delete]', err);
    res.status(500).json({ success: false, error: 'Error al eliminar la lección.' });
  }
});

// ─── POST /:id/reorder ────────────────────────────────────────────────────────

router.post('/:id/reorder', validateBody(ReorderSchema), async (req: AuthRequest, res: Response) => {
  try {
    const lesson = await LessonModel.findById(req.params.id);
    if (!lesson) {
      res.status(404).json({ success: false, error: 'Lección no encontrada.' });
      return;
    }

    const { direction } = req.body;
    const result = await reorderEntity(LessonModel, req.params.id, direction, {
      moduleId: lesson.moduleId,
    });

    if (result === null) {
      res.status(400).json({ success: false, error: 'Ya está en el límite.' });
      return;
    }

    writeAudit({
      adminId: req.user!.userId,
      action: 'reorder',
      entityType: 'lesson',
      entityId: req.params.id,
      metadata: { direction, moduleId: lesson.moduleId.toString() },
    });

    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const typed = err as { status?: number; code?: string };
    if (typed?.status === 404) {
      res.status(404).json({ success: false, error: 'Lección no encontrada.' });
      return;
    }
    console.error('[admin/lessons/reorder]', err);
    res.status(500).json({ success: false, error: 'Error al reordenar la lección.' });
  }
});

// ─── GET /:id/content ─────────────────────────────────────────────────────────
// Return LessonContent doc

router.get('/:id/content', async (req, res: Response) => {
  try {
    const content = await LessonContentModel.findOne({ lessonId: req.params.id });
    if (!content) {
      res.status(404).json({ success: false, error: 'Contenido de lección no encontrado.' });
      return;
    }
    res.json({ success: true, data: content });
  } catch (err) {
    console.error('[admin/lessons/content/get]', err);
    res.status(500).json({ success: false, error: 'Error al obtener el contenido.' });
  }
});

// ─── PUT /:id/content ─────────────────────────────────────────────────────────
// Update LessonContent, bump version via $inc

router.put('/:id/content', validateBody(LessonContentSchema), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;

    const content = await LessonContentModel.findOneAndUpdate(
      { lessonId: req.params.id },
      {
        $set: { theory: body.theory, exercises: body.exercises },
        $inc: { version: 1 },
      },
      { new: true, runValidators: true }
    );

    if (!content) {
      res.status(404).json({ success: false, error: 'Contenido de lección no encontrado.' });
      return;
    }

    writeAudit({
      adminId: req.user!.userId,
      action: 'update',
      entityType: 'lessonContent',
      entityId: content._id,
      metadata: { lessonId: req.params.id, version: content.version },
    });

    res.json({ success: true, data: content });
  } catch (err) {
    console.error('[admin/lessons/content/update]', err);
    res.status(500).json({ success: false, error: 'Error al actualizar el contenido.' });
  }
});

export default router;
