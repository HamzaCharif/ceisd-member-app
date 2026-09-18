// /api/tasks/tasks.ts
// Task management API routes.

import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth/session';
import { UserRole } from '../../shared/types';

export const tasksRouter = Router();

// GET /api/tasks/my-tasks — tasks assigned to current user (by userId, role, or ALL)
tasksRouter.get('/my-tasks', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  try {
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assignedToUserId: userId },
          { assignedToRole: userRole as unknown as import('@prisma/client').UserRole },
          { assignedToAll: true },
        ],
      },
      include: {
        linkedEvent: { select: { id: true, title: true, dateTime: true } },
        completions: {
          where: { userId },
          select: { id: true, completedAt: true, method: true },
        },
      },
      orderBy: { deadline: 'asc' },
    });

    const mapped = tasks.map((t) => ({
      ...t,
      completion: t.completions[0] ?? null,
      completions: undefined,
    }));

    // Events the member has RSVP'd to that haven't happened yet — shown alongside tasks.
    const upcomingEvents = await prisma.eventRsvp.findMany({
      where: { userId, event: { dateTime: { gte: new Date() } } },
      select: { event: { select: { id: true, title: true, dateTime: true, location: true, pointsForAttendance: true } } },
      orderBy: { event: { dateTime: 'asc' } },
    });

    res.json({ data: mapped, upcomingEvents: upcomingEvents.map((r) => r.event) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id — task detail
tasksRouter.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        linkedEvent: { select: { id: true, title: true, dateTime: true } },
        completions: { where: { userId }, select: { id: true, completedAt: true, method: true } },
      },
    });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ data: { ...task, completion: task.completions[0] ?? null, completions: undefined } });
  } catch {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// PATCH /api/tasks/:id/complete — manual completion request
tasksRouter.patch('/:id/complete', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id: taskId } = req.params;
  const userId = req.user!.userId;
  try {
    const existing = await prisma.taskCompletion.findUnique({
      where: { taskId_userId: { taskId, userId } },
    });
    if (existing) {
      res.status(409).json({ error: 'Task already completed' });
      return;
    }
    await prisma.taskCompletion.create({
      data: { taskId, userId, method: 'MANUAL_APPROVAL' },
    });
    // Note: task status stays PENDING until admin approves
    res.json({ data: { message: 'Submitted for admin approval' } });
  } catch {
    res.status(500).json({ error: 'Failed to submit completion' });
  }
});

// POST /api/tasks — admin only: create task
tasksRouter.post('/', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const {
    title, description, type, assignedToUserId, assignedToRole,
    assignedToAll, deadline, completionMethod, linkedEventId,
  } = req.body as {
    title?: string; description?: string; type?: string;
    assignedToUserId?: string; assignedToRole?: string;
    assignedToAll?: boolean; deadline?: string;
    completionMethod?: string; linkedEventId?: string;
  };

  if (!title || !description || !type || !deadline || !completionMethod) {
    res.status(400).json({ error: 'title, description, type, deadline, and completionMethod are required' });
    return;
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        type: type as import('@prisma/client').TaskType,
        assignedToUserId,
        assignedToRole: assignedToRole as import('@prisma/client').UserRole | undefined,
        assignedToAll: assignedToAll ?? false,
        deadline: new Date(deadline),
        completionMethod: completionMethod as import('@prisma/client').CompletionMethod,
        linkedEventId,
        createdById: req.user!.userId,
      },
    });
    res.status(201).json({ data: task });
  } catch {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id — admin only: edit task
tasksRouter.patch('/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body as Record<string, unknown>;
  if (updates.deadline) updates.deadline = new Date(updates.deadline as string);
  try {
    const task = await prisma.task.update({ where: { id }, data: updates });
    res.json({ data: task });
  } catch {
    res.status(404).json({ error: 'Task not found' });
  }
});
