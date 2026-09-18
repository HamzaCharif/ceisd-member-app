// /api/tasks/forms.ts
// Form CRUD and submission API routes.

import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth/session';
import { addPoints } from '../gamification/points-engine';
import { POINT_VALUES } from '../../shared/constants';

export const formsRouter = Router();


// GET /api/tasks/forms/my-forms — forms assigned to current user
formsRouter.get('/my-forms', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  try {
    const forms = await prisma.form.findMany({
      where: {
        OR: [
          { assignedToUserId: userId },
          { assignedToRole: userRole as unknown as import('@prisma/client').UserRole },
          { assignedToAll: true },
        ],
      },
      include: {
        submissions: {
          where: { userId },
          select: { id: true, submittedAt: true, answers: true },
        },
      },
    });

    const mapped = forms.map((f) => ({
      ...f,
      submission: f.submissions[0] ?? null,
      submissions: undefined,
    }));

    res.json({ data: mapped });
  } catch {
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// GET /api/tasks/forms/:id — form schema + submission status for current user
formsRouter.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  try {
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        submissions: {
          where: { userId },
          select: { id: true, submittedAt: true, answers: true },
        },
      },
    });
    if (!form) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }
    res.json({ data: { ...form, submission: form.submissions[0] ?? null, submissions: undefined } });
  } catch {
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// POST /api/tasks/forms/:formId/submit — submit form answers
formsRouter.post('/:formId/submit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { formId } = req.params;
  const userId = req.user!.userId;
  const { answers } = req.body as { answers?: Record<string, unknown> };

  if (!answers) {
    res.status(400).json({ error: 'answers is required' });
    return;
  }

  try {
    // Upsert the submission (allow resubmission)
    const submission = await prisma.formSubmission.upsert({
      where: { formId_userId: { formId, userId } },
      update: { answers: answers as Prisma.InputJsonValue, submittedAt: new Date() },
      create: { formId, userId, answers: answers as Prisma.InputJsonValue },
    });

    // Find any task linked to this form and mark it COMPLETED
    const linkedTask = await prisma.task.findFirst({
      where: {
        completionMethod: 'FORM_SUBMISSION',
        OR: [
          { assignedToUserId: userId },
          { assignedToAll: true },
        ],
      },
    });

    if (linkedTask) {
      const existingCompletion = await prisma.taskCompletion.findUnique({
        where: { taskId_userId: { taskId: linkedTask.id, userId } },
      });
      if (!existingCompletion) {
        await prisma.taskCompletion.create({
          data: { taskId: linkedTask.id, userId, method: 'FORM_SUBMISSION' },
        });
        // Task.status is only a whole-task flag for tasks assigned to ONE person.
        if (linkedTask.assignedToUserId === userId) {
          await prisma.task.update({ where: { id: linkedTask.id }, data: { status: 'COMPLETED' } });
        }
        await addPoints(userId, 'TASK_MANDATORY', POINT_VALUES.TASK_MANDATORY, linkedTask.id).catch(() => undefined);
      }
    }

    // Points for the submission itself — idempotent per form
    await addPoints(userId, 'FORM_SUBMITTED', POINT_VALUES.FORM_SUBMITTED, formId).catch((err) =>
      console.error('[forms] points failed', err),
    );

    res.status(201).json({ data: submission });
  } catch {
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// POST /api/tasks/forms — admin only: create form
formsRouter.post('/', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { title, schema, assignedToUserId, assignedToRole, assignedToAll } = req.body as {
    title?: string;
    schema?: unknown;
    assignedToUserId?: string;
    assignedToRole?: string;
    assignedToAll?: boolean;
  };

  if (!title || !schema) {
    res.status(400).json({ error: 'title and schema are required' });
    return;
  }

  try {
    const form = await prisma.form.create({
      data: {
        title,
        schema: schema as import('@prisma/client').Prisma.InputJsonValue,
        assignedToUserId,
        assignedToRole: assignedToRole as import('@prisma/client').UserRole | undefined,
        assignedToAll: assignedToAll ?? false,
        createdById: req.user!.userId,
      },
    });
    res.status(201).json({ data: form });
  } catch {
    res.status(500).json({ error: 'Failed to create form' });
  }
});
