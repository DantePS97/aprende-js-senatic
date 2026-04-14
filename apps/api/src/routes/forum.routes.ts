import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { createPostSchema, createReplySchema } from '@senatic/shared';
import { ForumPostModel, ForumReplyModel } from '../models/ForumPost.model';
import { UserModel } from '../models/User.model';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

export const forumRouter = Router();

// Helper para obtener el perfil público del autor
async function getAuthorPublic(userId: mongoose.Types.ObjectId | string) {
  const user = await UserModel.findById(userId).select('displayName avatarUrl xp level');
  if (!user) return null;
  return {
    _id: user._id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    xp: user.xp,
    level: user.level,
    streak: 0,
  };
}

// ─── GET /api/forum/posts ─────────────────────────────────────────────────────

forumRouter.get('/posts', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const tag = req.query.tag as string | undefined;

    const filter: Record<string, unknown> = {};
    if (tag) filter.tags = tag;

    const [posts, total] = await Promise.all([
      ForumPostModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ForumPostModel.countDocuments(filter),
    ]);

    const data = await Promise.all(
      posts.map(async (post) => ({
        _id: post._id,
        author: await getAuthorPublic(post.userId),
        title: post.title,
        body: post.body.slice(0, 200) + (post.body.length > 200 ? '…' : ''),
        tags: post.tags,
        upvotes: post.upvotes,
        replyCount: post.replyCount,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      }))
    );

    res.json({
      success: true,
      data,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[forum/posts]', err);
    res.status(500).json({ success: false, error: 'Error al obtener publicaciones.' });
  }
});

// ─── POST /api/forum/posts ────────────────────────────────────────────────────

forumRouter.post('/posts', requireAuth, validate(createPostSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { title, body, tags } = req.body;

    const post = await ForumPostModel.create({
      userId: req.user!.userId,
      title,
      body,
      tags,
    });

    const author = await getAuthorPublic(post.userId);

    res.status(201).json({
      success: true,
      data: {
        _id: post._id,
        author,
        title: post.title,
        body: post.body,
        tags: post.tags,
        upvotes: 0,
        replyCount: 0,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[forum/create-post]', err);
    res.status(500).json({ success: false, error: 'Error al crear publicación.' });
  }
});

// ─── GET /api/forum/posts/:id ─────────────────────────────────────────────────

forumRouter.get('/posts/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const post = await ForumPostModel.findById(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, error: 'Publicación no encontrada.' });
      return;
    }

    const replies = await ForumReplyModel.find({ postId: post._id }).sort({ createdAt: 1 });

    const [author, repliesWithAuthors] = await Promise.all([
      getAuthorPublic(post.userId),
      Promise.all(
        replies.map(async (r) => ({
          _id: r._id,
          postId: r.postId,
          author: await getAuthorPublic(r.userId),
          body: r.body,
          upvotes: r.upvotes,
          createdAt: r.createdAt.toISOString(),
        }))
      ),
    ]);

    res.json({
      success: true,
      data: {
        post: {
          _id: post._id,
          author,
          title: post.title,
          body: post.body,
          tags: post.tags,
          upvotes: post.upvotes,
          replyCount: post.replyCount,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        },
        replies: repliesWithAuthors,
      },
    });
  } catch (err) {
    console.error('[forum/post-detail]', err);
    res.status(500).json({ success: false, error: 'Error al obtener la publicación.' });
  }
});

// ─── POST /api/forum/posts/:id/replies ────────────────────────────────────────

forumRouter.post('/posts/:id/replies', requireAuth, validate(createReplySchema), async (req: AuthRequest, res: Response) => {
  try {
    const post = await ForumPostModel.findById(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, error: 'Publicación no encontrada.' });
      return;
    }

    const reply = await ForumReplyModel.create({
      postId: post._id,
      userId: req.user!.userId,
      body: req.body.body,
    });

    await ForumPostModel.findByIdAndUpdate(post._id, { $inc: { replyCount: 1 } });

    const author = await getAuthorPublic(reply.userId);

    res.status(201).json({
      success: true,
      data: {
        _id: reply._id,
        postId: reply.postId,
        author,
        body: reply.body,
        upvotes: 0,
        createdAt: reply.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[forum/create-reply]', err);
    res.status(500).json({ success: false, error: 'Error al crear respuesta.' });
  }
});

// ─── POST /api/forum/posts/:id/upvote ────────────────────────────────────────

forumRouter.post('/posts/:id/upvote', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const post = await ForumPostModel.findById(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, error: 'Publicación no encontrada.' });
      return;
    }

    const alreadyUpvoted = post.upvotedBy.some((id) => id.equals(userId));

    if (alreadyUpvoted) {
      await ForumPostModel.findByIdAndUpdate(post._id, {
        $pull: { upvotedBy: userId },
        $inc: { upvotes: -1 },
      });
    } else {
      await ForumPostModel.findByIdAndUpdate(post._id, {
        $addToSet: { upvotedBy: userId },
        $inc: { upvotes: 1 },
      });
    }

    res.json({ success: true, data: { upvoted: !alreadyUpvoted } });
  } catch (err) {
    console.error('[forum/upvote]', err);
    res.status(500).json({ success: false, error: 'Error al votar.' });
  }
});
