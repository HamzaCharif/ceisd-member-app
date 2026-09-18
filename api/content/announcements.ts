// /api/content/announcements.ts
// Announcements API routes — read for members, write for admins only.

import { Request, Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth/session';

export const announcementsRouter = Router();

// GET /api/content/announcements — public read for authenticated members
announcementsRouter.get('/', requireAuth, async (_req: Request, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    res.json({ data: announcements });
  } catch {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// POST /api/content/announcements — admin only
announcementsRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    const { title, categoryTag, description, ctaLabel, ctaUrl } = req.body as {
      title?: string;
      categoryTag?: string;
      description?: string;
      ctaLabel?: string;
      ctaUrl?: string;
    };

    if (!title || !categoryTag || !description || !ctaLabel) {
      res.status(400).json({ error: 'title, categoryTag, description, and ctaLabel are required' });
      return;
    }

    try {
      const announcement = await prisma.announcement.create({
        data: {
          title,
          categoryTag,
          description,
          ctaLabel,
          ctaUrl,
          createdById: req.user!.userId,
        },
      });
      res.status(201).json({ data: announcement });
    } catch {
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  }
);

// DELETE /api/content/announcements/:id — admin only
announcementsRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await prisma.announcement.delete({ where: { id } });
      res.json({ data: { message: 'Announcement deleted' } });
    } catch {
      res.status(404).json({ error: 'Announcement not found' });
    }
  }
);
