// /api/admin/adminTasks.ts
// Admin-only tasks management — returns all tasks with completion counts.

import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth/session';

export const adminTasksRouter = Router();

// GET /api/admin/tasks — all tasks with completion stats
adminTasksRouter.get('/', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        _count: { select: { completions: true } },
        linkedEvent: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = tasks.map((t) => ({
      ...t,
      _count: { taskCompletions: t._count.completions },
    }));

    res.json({ data: mapped });
  } catch {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});
