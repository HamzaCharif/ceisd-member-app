// /api/tasks/task-completion.ts
// Auto-completion of tasks when a member attends a linked event.
// Exposed both as a function (called directly by attendance-triggers) and as an
// admin-only endpoint for manual re-runs.

import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth/session';
import { addPoints } from '../gamification/points-engine';
import { POINT_VALUES } from '../../shared/constants';

export const taskCompletionRouter = Router();

/**
 * Completes every AUTO_ATTENDANCE task linked to `eventId` for `userId`.
 * Idempotent: already-completed tasks are skipped. Returns completed task ids.
 */
export async function completeTasksByAttendance(eventId: string, userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return [];

  const tasks = await prisma.task.findMany({
    where: {
      linkedEventId: eventId,
      completionMethod: 'AUTO_ATTENDANCE',
      OR: [
        { assignedToUserId: userId },
        { assignedToAll: true },
        { assignedToRole: user.role },
      ],
    },
    select: { id: true, assignedToUserId: true },
  });

  const completed: string[] = [];
  for (const task of tasks) {
    const existing = await prisma.taskCompletion.findUnique({
      where: { taskId_userId: { taskId: task.id, userId } },
    });
    if (existing) continue;

    await prisma.taskCompletion.create({
      data: { taskId: task.id, userId, method: 'AUTO_ATTENDANCE' },
    });
    // Task.status is a whole-task flag; only flip it for single-assignee tasks.
    if (task.assignedToUserId === userId) {
      await prisma.task.update({ where: { id: task.id }, data: { status: 'COMPLETED' } });
    }
    completed.push(task.id);

    await addPoints(userId, 'TASK_MANDATORY', POINT_VALUES.TASK_MANDATORY, task.id).catch((err) =>
      console.error('[task-completion] points failed', err),
    );
  }
  return completed;
}

// POST /api/tasks/complete-by-attendance  { eventId, userId }  — admin re-run
taskCompletionRouter.post('/complete-by-attendance', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { eventId, userId } = req.body as { eventId?: string; userId?: string };
  if (!eventId || !userId) {
    res.status(400).json({ error: 'eventId and userId are required' });
    return;
  }
  try {
    const completedTaskIds = await completeTasksByAttendance(eventId, userId);
    res.json({ data: { completedTaskIds, count: completedTaskIds.length } });
  } catch (err) {
    console.error('[task-completion] failed', err);
    res.status(500).json({ error: 'Failed to process task completions' });
  }
});
