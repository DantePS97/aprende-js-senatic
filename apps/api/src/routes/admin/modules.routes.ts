import { Router, Response } from 'express';
import { ModuleModel } from '../../models/Module.model';
import { LessonModel } from '../../models/Lesson.model';
import { validateBody } from '../../middleware/validate.middleware';
import { writeAudit } from '../../services/audit.service';
import { reorderEntity } from '../../services/reorder.service';
import {
  ModuleCreateSchema,
  ModuleUpdateSchema,
  ReorderSchema,
} from '@senatic/shared';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();

// ─── GET / ────────────────────────────────────────────────────────────────────
// List modules by courseId (required)

router.get('/', async (req, res: Response) => {
  try {
    const { courseId } = req.query;

    if (!courseId || typeof courseId !== 'string') {
      res.status(400).json({ success: false, error: 'El parámetro courseId es obligatorio.' });
      return;
    }

    const modules = await ModuleModel.find({ courseId }).sort({ order: 1 });
    res.json({ success: true, data: modules });
  } catch (err) {
    console.error('[admin/modules/list]', err);
    res.status(500).json({ success: false, error: 'Error al obtener módulos.' });
  }
});

// ─── POST / ───────────────────────────────────────────────────────────────────
// Create module

router.post('/', validateBody(ModuleCreateSchema), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;
    const { courseId } = body;

    // order = max in course + 1
    const last = await ModuleModel.findOne({ courseId }).sort({ order: -1 }).select('order');
    const order = last ? last.order + 1 : 1;

    const module = await ModuleModel.create({ ...body, order });

    writeAudit({
      adminId: req.user!.userId,
      action: 'create',
      entityType: 'module',
      entityId: module._id,
      metadata: { courseId, title: module.title },
    });

    res.status(201).json({ success: true, data: module });
  } catch (err) {
    console.error('[admin/modules/create]', err);
    res.status(500).json({ success: false, error: 'Error al crear el módulo.' });
  }
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────
// Module detail + lessonCount

router.get('/:id', async (req, res: Response) => {
  try {
    const module = await ModuleModel.findById(req.params.id);
    if (!module) {
      res.status(404).json({ success: false, error: 'Módulo no encontrado.' });
      return;
    }

    const lessonCount = await LessonModel.countDocuments({ moduleId: req.params.id });

    res.json({ success: true, data: { ...module.toObject(), lessonCount } });
  } catch (err) {
    console.error('[admin/modules/detail]', err);
    res.status(500).json({ success: false, error: 'Error al obtener el módulo.' });
  }
});

// ─── PUT /:id ─────────────────────────────────────────────────────────────────
// Update module (optimistic lock, courseId immutable)

router.put('/:id', validateBody(ModuleUpdateSchema), async (req: AuthRequest, res: Response) => {
  try {
    const module = await ModuleModel.findById(req.params.id);
    if (!module) {
      res.status(404).json({ success: false, error: 'Módulo no encontrado.' });
      return;
    }

    const body = req.body;

    // Optimistic lock check
    if (body.updatedAt && module.updatedAt.toISOString() !== body.updatedAt) {
      res.status(409).json({ success: false, error: 'STALE_ENTITY', serverUpdatedAt: module.updatedAt });
      return;
    }

    // Strip courseId — immutable; strip updatedAt — not a model field
    const { courseId: _courseId, updatedAt: _updatedAt, ...updateData } = body;

    Object.assign(module, updateData);
    await module.save();

    writeAudit({
      adminId: req.user!.userId,
      action: 'update',
      entityType: 'module',
      entityId: module._id,
      metadata: { title: module.title },
    });

    res.json({ success: true, data: module });
  } catch (err) {
    console.error('[admin/modules/update]', err);
    res.status(500).json({ success: false, error: 'Error al actualizar el módulo.' });
  }
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────
// Soft-block delete: 409 if lessons exist

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const module = await ModuleModel.findById(req.params.id);
    if (!module) {
      res.status(404).json({ success: false, error: 'Módulo no encontrado.' });
      return;
    }

    const count = await LessonModel.countDocuments({ moduleId: req.params.id });
    if (count > 0) {
      res.status(409).json({
        success: false,
        error: `El módulo tiene ${count} lección(es). Elimínalas primero.`,
        count,
      });
      return;
    }

    await ModuleModel.findByIdAndDelete(req.params.id);

    writeAudit({
      adminId: req.user!.userId,
      action: 'delete',
      entityType: 'module',
      entityId: module._id,
      metadata: { courseId: module.courseId.toString(), title: module.title },
    });

    res.json({ success: true, data: null });
  } catch (err) {
    console.error('[admin/modules/delete]', err);
    res.status(500).json({ success: false, error: 'Error al eliminar el módulo.' });
  }
});

// ─── POST /:id/reorder ────────────────────────────────────────────────────────

router.post('/:id/reorder', validateBody(ReorderSchema), async (req: AuthRequest, res: Response) => {
  try {
    const module = await ModuleModel.findById(req.params.id);
    if (!module) {
      res.status(404).json({ success: false, error: 'Módulo no encontrado.' });
      return;
    }

    const id = String(req.params.id);
    const { direction } = req.body as { direction: 'up' | 'down' };
    const result = await reorderEntity(ModuleModel, id, direction, {
      courseId: module.courseId,
    });

    if (result === null) {
      res.status(400).json({ success: false, error: 'Ya está en el límite.' });
      return;
    }

    writeAudit({
      adminId: req.user!.userId,
      action: 'reorder',
      entityType: 'module',
      entityId: id,
      metadata: { direction, courseId: module.courseId.toString() },
    });

    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const typed = err as { status?: number; code?: string };
    if (typed?.status === 404) {
      res.status(404).json({ success: false, error: 'Módulo no encontrado.' });
      return;
    }
    console.error('[admin/modules/reorder]', err);
    res.status(500).json({ success: false, error: 'Error al reordenar el módulo.' });
  }
});

export default router;
