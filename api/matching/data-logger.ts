// /api/matching/data-logger.ts
// Receives behavioral signals from all other agents.
// POST /api/matching/log-event — idempotent, never throws.

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthenticatedRequest } from '../auth/session';

export const dataLoggerRouter = Router();

type EventType =
  | 'ATTENDANCE'
  | 'TASK_COMPLETED'
  | 'POST_CREATED'
  | 'MATCH_ACCEPTED'
  | 'MATCH_REJECTED'
  | 'FORM_SUBMITTED'
  | 'TIME_ON_SCREEN';

const VALID_EVENT_TYPES: EventType[] = [
  'ATTENDANCE', 'TASK_COMPLETED', 'POST_CREATED', 'MATCH_ACCEPTED',
  'MATCH_REJECTED', 'FORM_SUBMITTED', 'TIME_ON_SCREEN',
];

interface LogEventBody {
  userId?: string;
  eventType?: string;
  eventId?: string;
  postId?: string;
  matchId?: string;
  durationSeconds?: number;
}

export interface BehavioralEvent {
  actorId: string;          // who caused the log row (the user, or an admin)
  userId: string;           // whose behaviour it describes
  eventType: string;
  eventId?: string;
  postId?: string;
  matchId?: string;
  durationSeconds?: number;
}

/** Direct call used by server-side triggers. Never throws. */
export async function logBehavioralEvent(e: BehavioralEvent): Promise<void> {
  try {
    await prisma.adminLog.create({
      data: {
        adminId: e.actorId,
        action: `BEHAVIORAL_${e.eventType}`,
        targetId: e.userId,
        targetType: 'User',
        metadata: {
          eventType: e.eventType,
          eventId: e.eventId,
          postId: e.postId,
          matchId: e.matchId,
          durationSeconds: e.durationSeconds,
          recordedAt: new Date().toISOString(),
        },
      },
    });
  } catch (err) {
    console.error('[data-logger] failed to log behavioral event', err);
  }
}

// POST /api/matching/log-event
// Members may only log events about themselves.
dataLoggerRouter.post('/log-event', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const {
    userId,
    eventType,
    eventId,
    postId,
    matchId,
    durationSeconds,
  } = req.body as LogEventBody;

  // A member cannot write behavioural signals into someone else's history.
  const targetUserId = req.user!.role === 'ADMIN' && userId ? userId : req.user!.userId;

  // Soft-validate — never reject to avoid blocking callers
  if (!targetUserId || !eventType) {
    res.json({ data: { message: 'Logged (skipped — missing userId or eventType)' } });
    return;
  }

  if (!VALID_EVENT_TYPES.includes(eventType as EventType)) {
    res.json({ data: { message: `Logged (unknown eventType "${eventType}" — recorded anyway)` } });
  }

  try {
    // Store in AdminLog table as a behavioral signal
    // In a full implementation this would go into a dedicated BehavioralLog table
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.userId,  // the caller agent's user
        action: `BEHAVIORAL_${eventType}`,
        targetId: targetUserId,
        targetType: 'User',
        metadata: {
          eventType,
          eventId,
          postId,
          matchId,
          durationSeconds,
          recordedAt: new Date().toISOString(),
        },
      },
    });

    res.json({ data: { message: 'Behavioral event logged' } });
  } catch {
    // Never fail — behavioral logging is non-critical
    res.json({ data: { message: 'Log accepted (storage unavailable)' } });
  }
});
