import { Router, Response } from 'express';
import { ChallengeModel } from '../../models/Challenge.model';
import { ChallengeAttemptModel } from '../../models/ChallengeAttempt.model';
import { ChallengeProgressModel } from '../../models/ChallengeProgress.model';
import { validateBody } from '../../middleware/validate.middleware';
import { writeAudit } from '../../services/audit.service';
import { slugify } from '../../lib/slugify';
import { AdminChallengeCreateSchema, AdminChallengeUpdateSchema } from '@senatic/shared';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = Router();

// ─── GET / ────────────────────────────────────────────────────────────────────

router.get('/', async (req, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1')));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'))));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.published !== undefined) filter.published = req.query.published === 'true';

    const [challenges, total] = await Promise.all([
      ChallengeModel.find(filter).sort({ order: 1 }).skip(skip).limit(limit),
      ChallengeModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        challenges,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[admin/challenges/list]', err);
    res.status(500).json({ success: false, error: 'Error al obtener retos.' });
  }
});

// ─── POST / ───────────────────────────────────────────────────────────────────

router.post('/', validateBody(AdminChallengeCreateSchema), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;
    const slug = body.slug ? body.slug : slugify(body.title);

    const existing = await ChallengeModel.findOne({ slug });
    if (existing) {
      res.status(409).json({ success: false, error: 'SLUG_CONFLICT', slug });
      return;
    }

    const last = await ChallengeModel.findOne({}).sort({ order: -1 }).select('order');
    const order = last ? last.order + 1 : 1;

    const challenge = await ChallengeModel.create({ ...body, slug, order });

    writeAudit({
      adminId: req.user!.userId,
      action: 'create',
      entityType: 'challenge',
      entityId: challenge._id,
      metadata: { slug: challenge.slug, title: challenge.title },
    });

    res.status(201).json({ success: true, data: challenge });
  } catch (err) {
    console.error('[admin/challenges/create]', err);
    res.status(500).json({ success: false, error: 'Error al crear el reto.' });
  }
});

// ─── PATCH /reorder — MUST be before /:id ────────────────────────────────────

router.patch('/reorder', async (req: AuthRequest, res: Response) => {
  try {
    const items = req.body.items as Array<{ id: string; order: number }>;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'items requerido.' });
      return;
    }

    await Promise.all(
      items.map(({ id, order }) =>
        ChallengeModel.findByIdAndUpdate(id, { $set: { order } })
      )
    );

    writeAudit({
      adminId: req.user!.userId,
      action: 'reorder',
      entityType: 'challenge',
      entityId: 'bulk',
      metadata: { count: items.length },
    });

    res.json({ success: true, data: null });
  } catch (err) {
    console.error('[admin/challenges/reorder]', err);
    res.status(500).json({ success: false, error: 'Error al reordenar retos.' });
  }
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────

router.get('/:id', async (req, res: Response) => {
  try {
    const challenge = await ChallengeModel.findById(req.params.id);
    if (!challenge) {
      res.status(404).json({ success: false, error: 'Reto no encontrado.' });
      return;
    }
    res.json({ success: true, data: challenge });
  } catch (err) {
    console.error('[admin/challenges/detail]', err);
    res.status(500).json({ success: false, error: 'Error al obtener el reto.' });
  }
});

// ─── PATCH /:id ───────────────────────────────────────────────────────────────

router.patch('/:id', validateBody(AdminChallengeUpdateSchema), async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;

    if (body.slug) {
      const conflict = await ChallengeModel.findOne({ slug: body.slug, _id: { $ne: req.params.id } });
      if (conflict) {
        res.status(409).json({ success: false, error: 'SLUG_CONFLICT', slug: body.slug });
        return;
      }
    }

    const challenge = await ChallengeModel.findByIdAndUpdate(
      req.params.id,
      { $set: body },
      { new: true }
    );
    if (!challenge) {
      res.status(404).json({ success: false, error: 'Reto no encontrado.' });
      return;
    }

    writeAudit({
      adminId: req.user!.userId,
      action: 'update',
      entityType: 'challenge',
      entityId: challenge._id,
      metadata: { title: challenge.title },
    });

    res.json({ success: true, data: challenge });
  } catch (err) {
    console.error('[admin/challenges/update]', err);
    res.status(500).json({ success: false, error: 'Error al actualizar el reto.' });
  }
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const challenge = await ChallengeModel.findById(req.params.id);
    if (!challenge) {
      res.status(404).json({ success: false, error: 'Reto no encontrado.' });
      return;
    }

    await ChallengeModel.findByIdAndDelete(req.params.id);
    await ChallengeProgressModel.deleteMany({ challengeId: req.params.id });
    await ChallengeAttemptModel.deleteMany({ challengeId: req.params.id });

    writeAudit({
      adminId: req.user!.userId,
      action: 'delete',
      entityType: 'challenge',
      entityId: challenge._id,
      metadata: { slug: challenge.slug, title: challenge.title },
    });

    res.json({ success: true, data: null });
  } catch (err) {
    console.error('[admin/challenges/delete]', err);
    res.status(500).json({ success: false, error: 'Error al eliminar el reto.' });
  }
});

export default router;
