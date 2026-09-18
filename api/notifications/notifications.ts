// /api/notifications/notifications.ts
// In-app notifications: the thing that makes "I sent an invite → they see it" work.
//
// Delivery model: the mobile app polls GET /api/notifications/unread-count every
// 15s while foregrounded (useNotifications hook) and shows a badge; opening the
// inbox loads GET /api/notifications. Push notifications can later be layered on
// top by adding an Expo push token to User and calling Expo's push API from
// notify() — nothing else changes.

import { Router, Response } from 'express';
import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthenticatedRequest } from '../auth/session';

export const notificationsRouter = Router();

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Create a notification for one user. Never throws — a failed notification
 * must not break the action that triggered it (match accept, task assign...).
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: (input.data ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    console.error('[notifications] failed to create notification', err);
  }
}

/** Fan-out to many users (announcements, global tasks). */
export async function notifyMany(userIds: string[], input: Omit<NotifyInput, 'userId'>): Promise<void> {
  if (userIds.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: (input.data ?? undefined) as Prisma.InputJsonValue | undefined,
      })),
    });
  } catch (err) {
    console.error('[notifications] failed to fan out notifications', err);
  }
}

// GET /api/notifications?limit=30&cursor=<id>
notificationsRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const limit = Math.min(parseInt(String(req.query.limit ?? '30'), 10) || 30, 100);
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

  try {
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    res.json({
      data: items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch {
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// GET /api/notifications/unread-count — cheap poll target for the badge
notificationsRouter.get('/unread-count', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.userId, readAt: null },
    });
    res.json({ data: { count } });
  } catch {
    res.status(500).json({ error: 'Failed to count notifications' });
  }
});

// PATCH /api/notifications/read-all
notificationsRouter.patch('/read-all', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.userId, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ data: { marked: result.count } });
  } catch {
    res.status(500).json({ error: 'Failed to mark notifications read' });
  }
});

// PATCH /api/notifications/:id/read
notificationsRouter.patch('/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await prisma.notification.updateMany({
      where: { id, userId: req.user!.userId },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    res.json({ data: { id, read: true } });
  } catch {
    res.status(500).json({ error: 'Failed to mark notification read' });
  }
});
