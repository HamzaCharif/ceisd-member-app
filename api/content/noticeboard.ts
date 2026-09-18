// /api/content/noticeboard.ts
// Notice Board API routes — create/read/edit/delete/pin/flag posts.

import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth/session';
import { addPoints } from '../gamification/points-engine';
import { UserRole } from '../../shared/types';
import { POINT_VALUES } from '../../shared/constants';

export const noticeboardRouter = Router();

const EDIT_WINDOW_HOURS = 24; // members can edit within 24 hours

// GET /api/content/noticeboard/posts
noticeboardRouter.get('/posts', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const posts = await prisma.noticePost.findMany({
      where: { isFlagged: false },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    res.json({ data: posts });
  } catch {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// POST /api/content/noticeboard/posts
noticeboardRouter.post('/posts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, tags, skillLabels, projectCategory, openToMatches } = req.body as {
    title?: string; description?: string;
    tags?: string[]; skillLabels?: string[];
    projectCategory?: string; openToMatches?: boolean;
  };

  if (!title || !description) {
    res.status(400).json({ error: 'title and description are required' });
    return;
  }

  const editDeadline = new Date();
  editDeadline.setHours(editDeadline.getHours() + EDIT_WINDOW_HOURS);

  try {
    const post = await prisma.noticePost.create({
      data: {
        title,
        description,
        tags: tags ?? [],
        skillLabels: skillLabels ?? [],
        projectCategory,
        openToMatches: openToMatches ?? false,
        authorId: req.user!.userId,
        editDeadline,
      },
    });

    // Points for posting — idempotent per post, never blocks the response
    addPoints(req.user!.userId, 'NOTICE_POST', POINT_VALUES.NOTICE_POST, post.id).catch((err) =>
      console.error('[noticeboard] points failed', err),
    );

    res.status(201).json({ data: post });
  } catch {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PATCH /api/content/noticeboard/posts/:id — edit (owner only, within editDeadline)
noticeboardRouter.patch('/posts/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  try {
    const existing = await prisma.noticePost.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    if (existing.authorId !== userId && req.user!.role !== UserRole.ADMIN) {
      res.status(403).json({ error: 'You can only edit your own posts' });
      return;
    }
    if (existing.authorId === userId && new Date() > existing.editDeadline) {
      res.status(403).json({ error: 'Edit window has expired (24 hours)' });
      return;
    }

    const { title, description, tags, skillLabels, projectCategory } = req.body as {
      title?: string; description?: string;
      tags?: string[]; skillLabels?: string[]; projectCategory?: string;
    };

    const updated = await prisma.noticePost.update({
      where: { id },
      data: { title, description, tags, skillLabels, projectCategory },
    });
    res.json({ data: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// DELETE /api/content/noticeboard/posts/:id — owner or admin
noticeboardRouter.delete('/posts/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const isAdmin = req.user!.role === UserRole.ADMIN;

  try {
    const existing = await prisma.noticePost.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    if (existing.authorId !== userId && !isAdmin) {
      res.status(403).json({ error: 'You can only delete your own posts' });
      return;
    }

    await prisma.noticePost.delete({ where: { id } });
    res.json({ data: { message: 'Post deleted' } });
  } catch {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// PATCH /api/content/noticeboard/posts/:id/pin — admin only
noticeboardRouter.patch(
  '/posts/:id/pin',
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      const existing = await prisma.noticePost.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }
      const updated = await prisma.noticePost.update({
        where: { id },
        data: { isPinned: !existing.isPinned },
      });
      res.json({ data: updated });
    } catch {
      res.status(500).json({ error: 'Failed to pin/unpin post' });
    }
  }
);

// POST /api/content/noticeboard/posts/:id/report — any authenticated member
noticeboardRouter.post(
  '/posts/:id/report',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      const existing = await prisma.noticePost.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }
      // Mark the post as flagged so admins can review it
      await prisma.noticePost.update({ where: { id }, data: { isFlagged: true } });
      res.json({ data: { reported: true } });
    } catch {
      res.status(500).json({ error: 'Failed to report post' });
    }
  }
);

// PATCH /api/content/noticeboard/posts/:id/flag — admin only
noticeboardRouter.patch(
  '/posts/:id/flag',
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      const existing = await prisma.noticePost.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }
      const updated = await prisma.noticePost.update({
        where: { id },
        data: { isFlagged: !existing.isFlagged },
      });
      res.json({ data: updated });
    } catch {
      res.status(500).json({ error: 'Failed to flag/unflag post' });
    }
  }
);
