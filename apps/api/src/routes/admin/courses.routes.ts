import { Router, Response } from 'express';
import { CourseModel } from '../../models/Course.model';
import { ModuleModel } from '../../models/Module.model';
import { validateBody } from '../../middleware/validate.middleware';
import { writeAudit } from '../../services/audit.service';
import { reorderEntity } from '../../services/reorder.service';
import { slugify } from '../../lib/slugify';
import {
  CourseCreateSchema,
  CourseUpdateSchema,
  ReorderSchema,
} from '@senatic/shared';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();

// ─── GET / ────────────────────────────────────────────────────────────────────
// List all courses sorted by order (admin sees all — no isPublished filter)

router.get('/', async (_req, res: Response) => {
  try {
    const courses = await CourseModel.find({}).sort({ order: 1 });
    res.json({ success: true, data: courses });
  } catch (err) {
    console.error('[admin/courses/list]', err);
    res.status(500).json({ success: false, error: 'Error al obtener cursos.' });
  }
});

// ─── POST / ───────────────────────────────────────────────────────────────────
// Create course

router.post('/', validateBody(CourseCreateSchema), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;

    // Auto-slugify if not provided
    const slug = body.slug ? body.slug : slugify(body.title);

    // Check slug uniqueness
    const existing = await CourseModel.findOne({ slug });
    if (existing) {
      res.status(409).json({ success: false, error: 'SLUG_CONFLICT', slug });
      return;
    }

    // order = max existing order + 1
    const last = await CourseModel.findOne({}).sort({ order: -1 }).select('order');
    const order = last ? last.order + 1 : 1;

    const course = await CourseModel.create({ ...body, slug, order });

    writeAudit({
      adminId: req.user!.userId,
      action: 'create',
      entityType: 'course',
      entityId: course._id,
      metadata: { slug: course.slug, title: course.title },
    });

    res.status(201).json({ success: true, data: course });
  } catch (err) {
    console.error('[admin/courses/create]', err);
    res.status(500).json({ success: false, error: 'Error al crear el curso.' });
  }
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────
// Course detail + moduleCount

router.get('/:id', async (req, res: Response) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) {
      res.status(404).json({ success: false, error: 'Curso no encontrado.' });
      return;
    }

    const moduleCount = await ModuleModel.countDocuments({ courseId: req.params.id });

    res.json({ success: true, data: { ...course.toObject(), moduleCount } });
  } catch (err) {
    console.error('[admin/courses/detail]', err);
    res.status(500).json({ success: false, error: 'Error al obtener el curso.' });
  }
});

// ─── PUT /:id ─────────────────────────────────────────────────────────────────
// Update course (optimistic lock, slug immutable)

router.put('/:id', validateBody(CourseUpdateSchema), async (req: AuthRequest, res: Response) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) {
      res.status(404).json({ success: false, error: 'Curso no encontrado.' });
      return;
    }

    const body = req.body;

    // Optimistic lock check
    if (body.updatedAt && course.updatedAt.toISOString() !== body.updatedAt) {
      res.status(409).json({ success: false, error: 'STALE_ENTITY', serverUpdatedAt: course.updatedAt });
      return;
    }

    // slug is immutable post-create — stripped server-side even if Zod already omits it
    const { slug: _slug, updatedAt: _updatedAt, ...updateData } = body;

    Object.assign(course, updateData);
    await course.save();

    writeAudit({
      adminId: req.user!.userId,
      action: 'update',
      entityType: 'course',
      entityId: course._id,
      metadata: { title: course.title },
    });

    res.json({ success: true, data: course });
  } catch (err) {
    console.error('[admin/courses/update]', err);
    res.status(500).json({ success: false, error: 'Error al actualizar el curso.' });
  }
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────
// Soft-block delete: 409 if modules exist

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) {
      res.status(404).json({ success: false, error: 'Curso no encontrado.' });
      return;
    }

    const count = await ModuleModel.countDocuments({ courseId: req.params.id });
    if (count > 0) {
      res.status(409).json({
        success: false,
        error: `El curso tiene ${count} módulo(s). Elimínalos primero.`,
        count,
      });
      return;
    }

    await CourseModel.findByIdAndDelete(req.params.id);

    writeAudit({
      adminId: req.user!.userId,
      action: 'delete',
      entityType: 'course',
      entityId: course._id,
      metadata: { slug: course.slug, title: course.title },
    });

    res.json({ success: true, data: null });
  } catch (err) {
    console.error('[admin/courses/delete]', err);
    res.status(500).json({ success: false, error: 'Error al eliminar el curso.' });
  }
});

// ─── POST /:id/reorder ────────────────────────────────────────────────────────

router.post('/:id/reorder', validateBody(ReorderSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { direction } = req.body;
    const result = await reorderEntity(CourseModel, req.params.id, direction, {});

    if (result === null) {
      res.status(400).json({ success: false, error: 'Ya está en el límite.' });
      return;
    }

    writeAudit({
      adminId: req.user!.userId,
      action: 'reorder',
      entityType: 'course',
      entityId: req.params.id,
      metadata: { direction },
    });

    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const typed = err as { status?: number; code?: string };
    if (typed?.status === 404) {
      res.status(404).json({ success: false, error: 'Curso no encontrado.' });
      return;
    }
    console.error('[admin/courses/reorder]', err);
    res.status(500).json({ success: false, error: 'Error al reordenar el curso.' });
  }
});

export default router;
