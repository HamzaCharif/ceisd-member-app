// /api/attendance/attendance-triggers.ts
// Everything that must happen after an attendance row is created.
// Direct function calls (no HTTP self-requests, no auth-header plumbing).
// Promise.allSettled — one failure never blocks the others, and attendance
// itself is already committed before this runs.

import { prisma } from '../lib/prisma';
import { completeTasksByAttendance } from '../tasks/task-completion';
import { addPoints } from '../gamification/points-engine';
import { logBehavioralEvent } from '../matching/data-logger';
import { notify } from '../notifications/notifications';

export interface AttendanceEffects {
  completedTaskIds: string[];
  pointsAwarded: number;
  newTotal: number;
  stage: string;
}

export async function triggerAttendanceEffects(eventId: string, userId: string): Promise<AttendanceEffects> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true, pointsForAttendance: true },
  });
  const points = event?.pointsForAttendance ?? 50;

  const [tasksResult, pointsResult, logResult] = await Promise.allSettled([
    completeTasksByAttendance(eventId, userId),
    addPoints(userId, 'ATTENDANCE', points, eventId),
    logBehavioralEvent({ actorId: userId, userId, eventType: 'ATTENDANCE', eventId }),
  ]);

  const labels = ['complete-by-attendance', 'gamification/points', 'matching/log-event'];
  [tasksResult, pointsResult, logResult].forEach((r, i) => {
    if (r.status === 'rejected') console.error(`[attendance-triggers] ${labels[i]} failed:`, r.reason);
  });

  const completedTaskIds = tasksResult.status === 'fulfilled' ? tasksResult.value : [];
  const awarded = pointsResult.status === 'fulfilled' ? pointsResult.value : null;

  if (awarded?.awarded) {
    await notify({
      userId,
      type: 'POINTS_AWARDED',
      title: `+${points} points`,
      body: `Attendance confirmed for ${event?.title ?? 'the event'}${completedTaskIds.length ? ` · ${completedTaskIds.length} task(s) completed` : ''}.`,
      data: { eventId, points, completedTaskIds },
    });
  }

  return {
    completedTaskIds,
    pointsAwarded: awarded?.awarded ? points : 0,
    newTotal: awarded?.newTotal ?? 0,
    stage: awarded?.stage ?? 'SPARK',
  };
}
