// /api/attendance/attendance-logger.ts
// POST /api/attendance/log — member scans QR and logs attendance.
// POST /api/attendance/manual — admin manually marks attendance.

import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth/session';
import { validateQRToken } from './qr-validator';
import { triggerAttendanceEffects } from './attendance-triggers';

export const attendanceLoggerRouter = Router();

// POST /api/attendance/log — member scans QR code
attendanceLoggerRouter.post('/log', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { qrToken } = req.body as { qrToken?: string };

  if (!qrToken) {
    res.status(400).json({ error: 'qrToken is required' });
    return;
  }

  // ── Validate token server-side ─────────────────────────────────────────
  const validation = await validateQRToken(qrToken, userId);
  if (!validation.valid) {
    const alreadyAttended = /already/i.test(validation.error ?? '');
    res.status(alreadyAttended ? 409 : 400).json({ error: validation.error });
    return;
  }

  const { eventId } = validation;

  try {
    // ── Create attendance record ───────────────────────────────────────────
    await prisma.eventAttendance.create({
      data: {
        eventId: eventId!,
        userId,
        method: 'QR',
      },
    });

    // ── Fetch event details for response ──────────────────────────────────
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { title: true, pointsForAttendance: true },
    });

    // ── Downstream effects: tasks, points, AI signal, notification ─────────
    // Awaited so the success screen can show the REAL points + tasks completed.
    const effects = await triggerAttendanceEffects(eventId!, userId);

    res.json({
      data: {
        message: 'Attendance recorded successfully',
        eventTitle: event?.title,
        pointsEarned: effects.pointsAwarded,
        newTotal: effects.newTotal,
        stage: effects.stage,
        completedTaskIds: effects.completedTaskIds,
      },
    });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === 'P2002') {
      res.status(409).json({ error: 'Attendance already recorded for this event' });
      return;
    }
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// POST /api/attendance/manual — admin manual override
attendanceLoggerRouter.post(
  '/manual',
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    const { eventId, userId } = req.body as { eventId?: string; userId?: string };

    if (!eventId || !userId) {
      res.status(400).json({ error: 'eventId and userId are required' });
      return;
    }

    try {
      // Check for existing attendance
      const existing = await prisma.eventAttendance.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });
      if (existing) {
        res.status(409).json({ error: 'Attendance already recorded for this user/event' });
        return;
      }

      await prisma.eventAttendance.create({
        data: { eventId, userId, method: 'MANUAL' },
      });

      // Log admin action
      await prisma.adminLog.create({
        data: {
          adminId: req.user!.userId,
          action: 'MANUAL_ATTENDANCE',
          targetId: userId,
          targetType: 'User',
          metadata: { eventId },
        },
      });

      // Trigger downstream effects
      await triggerAttendanceEffects(eventId, userId);

      res.json({ data: { message: 'Attendance manually recorded' } });
    } catch {
      res.status(500).json({ error: 'Failed to record manual attendance' });
    }
  }
);
