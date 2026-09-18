// /api/admin/analytics.ts
// Analytics for the admin dashboard. Every number here is derived from real rows
// and each formula is written out so it can be checked against the seed data.

import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth/session';

export const adminAnalyticsRouter = Router();

const ACTIVE_WINDOW_DAYS = 30;

function pct(num: number, den: number): number {
  return den > 0 ? Math.round((num / den) * 1000) / 10 : 0; // one decimal
}

/**
 * Task completion rate = completions / assignments.
 * An "assignment" is one (task, eligible member) pair:
 *   assignedToUserId → 1 member
 *   assignedToRole   → every member with that role
 *   assignedToAll    → every member
 */
async function taskCompletionStats(): Promise<{ assigned: number; completed: number }> {
  const [tasks, roleCounts, totalUsers, completed] = await Promise.all([
    prisma.task.findMany({ select: { assignedToUserId: true, assignedToRole: true, assignedToAll: true } }),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.user.count(),
    prisma.taskCompletion.count(),
  ]);
  const byRole: Record<string, number> = {};
  for (const r of roleCounts) byRole[r.role] = r._count._all;

  let assigned = 0;
  for (const t of tasks) {
    if (t.assignedToAll) assigned += totalUsers;
    else if (t.assignedToUserId) assigned += 1;
    else if (t.assignedToRole) assigned += byRole[t.assignedToRole] ?? 0;
  }
  return { assigned, completed };
}

// GET /api/admin/analytics/overview
adminAnalyticsRouter.get('/overview', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const since = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [
      totalMembers,
      recentAttendees,
      recentPosters,
      recentCompleters,
      recentRsvpers,
      totalRsvps,
      totalAttendances,
      attendancesWithRsvp,
      upcomingEvents,
      pastEvents,
      taskStats,
      totalMatches,
      invitationsSent,
      connectedMatches,
      totalPosts,
      pendingApprovals,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.eventAttendance.findMany({ where: { attendedAt: { gte: since } }, select: { userId: true }, distinct: ['userId'] }),
      prisma.noticePost.findMany({ where: { createdAt: { gte: since } }, select: { authorId: true }, distinct: ['authorId'] }),
      prisma.taskCompletion.findMany({ where: { completedAt: { gte: since } }, select: { userId: true }, distinct: ['userId'] }),
      prisma.eventRsvp.findMany({ where: { createdAt: { gte: since } }, select: { userId: true }, distinct: ['userId'] }),
      prisma.eventRsvp.count(),
      prisma.eventAttendance.count(),
      // attendances that had a matching RSVP (so the rate can never exceed 100%)
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM "EventAttendance" a
        JOIN "EventRsvp" r ON r."eventId" = a."eventId" AND r."userId" = a."userId"`,
      prisma.event.count({ where: { dateTime: { gte: new Date() } } }),
      prisma.event.count({ where: { dateTime: { lt: new Date() } } }),
      taskCompletionStats(),
      prisma.match.count(),
      prisma.match.count({ where: { requestedById: { not: null } } }),
      prisma.match.count({ where: { status: 'CONNECTED' } }),
      prisma.noticePost.count(),
      prisma.taskCompletion.count({ where: { method: 'MANUAL_APPROVAL', approvedById: null } }),
    ]);

    const activeIds = new Set<string>();
    for (const r of recentAttendees) activeIds.add(r.userId);
    for (const r of recentPosters) activeIds.add(r.authorId);
    for (const r of recentCompleters) activeIds.add(r.userId);
    for (const r of recentRsvpers) activeIds.add(r.userId);

    const rsvpAttendances = Number(attendancesWithRsvp[0]?.count ?? 0);

    res.json({
      data: {
        // Members
        totalMembers,
        activeMembers: activeIds.size,                 // did something in the last 30 days
        activeMemberRate: pct(activeIds.size, totalMembers),
        // Events
        upcomingEvents,
        pastEvents,
        totalRsvps,
        totalAttendances,
        eventAttendanceRate: pct(rsvpAttendances, totalRsvps),   // of people who RSVP'd, how many showed up
        // Tasks
        tasksAssigned: taskStats.assigned,
        tasksCompleted: taskStats.completed,
        taskCompletionRate: pct(taskStats.completed, taskStats.assigned),
        pendingApprovals,
        // Matching
        totalMatches,
        invitationsSent,
        connectedMatches,
        matchSuccessRate: pct(connectedMatches, invitationsSent), // of invitations sent, how many were accepted
        // Community
        totalPosts,
        activeWindowDays: ACTIVE_WINDOW_DAYS,
      },
    });
  } catch (err) {
    console.error('[analytics] overview failed', err);
    res.status(500).json({ error: 'Failed to fetch overview metrics' });
  }
});

// GET /api/admin/analytics/events-over-time — attendance per ISO week (Mon-start), last 12 weeks
adminAnalyticsRouter.get('/events-over-time', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const weeks = Math.min(parseInt(String(req.query.weeks ?? '12'), 10) || 12, 52);
  try {
    const rows = await prisma.$queryRaw<Array<{ week: Date; attendances: bigint; rsvps: bigint }>>`
      WITH weeks AS (
        SELECT generate_series(
          date_trunc('week', NOW()) - (${weeks - 1} || ' weeks')::interval,
          date_trunc('week', NOW()),
          '1 week'::interval
        ) AS week
      )
      SELECT w.week,
        (SELECT COUNT(*) FROM "EventAttendance" a WHERE date_trunc('week', a."attendedAt") = w.week)::bigint AS attendances,
        (SELECT COUNT(*) FROM "EventRsvp" r WHERE date_trunc('week', r."createdAt") = w.week)::bigint AS rsvps
      FROM weeks w ORDER BY w.week`;

    res.json({
      data: rows.map((r) => ({
        date: r.week.toISOString().slice(0, 10),
        count: Number(r.attendances),
        rsvps: Number(r.rsvps),
      })),
    });
  } catch (err) {
    console.error('[analytics] events-over-time failed', err);
    res.status(500).json({ error: 'Failed to fetch attendance over time' });
  }
});

// GET /api/admin/analytics/events — per-event fill + show-up rates
adminAnalyticsRouter.get('/events', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      select: {
        id: true, title: true, dateTime: true, totalSeats: true,
        _count: { select: { rsvps: true, attendances: true } },
      },
      orderBy: { dateTime: 'desc' },
      take: 50,
    });
    res.json({
      data: events.map((e) => ({
        id: e.id,
        title: e.title,
        dateTime: e.dateTime,
        totalSeats: e.totalSeats,
        rsvps: e._count.rsvps,
        attendances: e._count.attendances,
        fillRate: pct(e._count.rsvps, e.totalSeats),
        showUpRate: pct(e._count.attendances, e._count.rsvps),
      })),
    });
  } catch (err) {
    console.error('[analytics] events failed', err);
    res.status(500).json({ error: 'Failed to fetch event analytics' });
  }
});

// GET /api/admin/analytics/skill-distribution — average self-rating per skill
adminAnalyticsRouter.get('/skill-distribution', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const profiles = await prisma.userProfile.findMany({ select: { skillRatings: true } });

    const totals: Record<string, { total: number; count: number }> = {};
    for (const p of profiles) {
      const ratings = p.skillRatings;
      // Accept both shapes the signup form has produced: {skill: rating} or [{skill, rating}]
      const entries: Array<[string, number]> = Array.isArray(ratings)
        ? (ratings as Array<{ skill?: string; rating?: number }>)
            .filter((r) => r && typeof r.skill === 'string' && typeof r.rating === 'number')
            .map((r) => [r.skill as string, r.rating as number])
        : Object.entries((ratings ?? {}) as Record<string, unknown>)
            .filter(([, v]) => typeof v === 'number')
            .map(([k, v]) => [k, v as number]);
      for (const [skill, rating] of entries) {
        if (!totals[skill]) totals[skill] = { total: 0, count: 0 };
        totals[skill].total += rating;
        totals[skill].count += 1;
      }
    }

    const distribution = Object.entries(totals)
      .map(([skill, { total, count }]) => ({
        skill,
        averageRating: Math.round((total / count) * 10) / 10,
        memberCount: count,
      }))
      .sort((a, b) => b.averageRating - a.averageRating);

    res.json({ data: distribution });
  } catch (err) {
    console.error('[analytics] skill-distribution failed', err);
    res.status(500).json({ error: 'Failed to fetch skill distribution' });
  }
});

// GET /api/admin/analytics/engagement-by-stage — members per journey stage (all four, zeros included)
adminAnalyticsRouter.get('/engagement-by-stage', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const grouped = await prisma.userStage.groupBy({ by: ['stage'], _count: { stage: true } });
    const counts: Record<string, number> = { SPARK: 0, SHAPE: 0, SCALE: 0, MENTOR: 0 };
    for (const g of grouped) counts[g.stage] = g._count.stage;
    res.json({
      data: (['SPARK', 'SHAPE', 'SCALE', 'MENTOR'] as const).map((stage) => ({ stage, count: counts[stage] })),
    });
  } catch (err) {
    console.error('[analytics] engagement-by-stage failed', err);
    res.status(500).json({ error: 'Failed to fetch engagement by stage' });
  }
});

// GET /api/admin/analytics/top-members — most points, with real activity counts
adminAnalyticsRouter.get('/top-members', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? '10'), 10) || 10, 50);
  try {
    const stages = await prisma.userStage.findMany({
      orderBy: { totalPoints: 'desc' },
      take: limit,
      select: {
        totalPoints: true, stage: true,
        user: {
          select: {
            id: true, name: true, email: true, college: true,
            _count: { select: { eventAttendances: true, taskCompletions: true, noticePosts: true } },
          },
        },
      },
    });
    res.json({
      data: stages.map((s, i) => ({
        rank: i + 1,
        id: s.user.id,
        name: s.user.name,
        email: s.user.email,
        college: s.user.college,
        stage: s.stage,
        totalPoints: s.totalPoints,
        eventsAttended: s.user._count.eventAttendances,
        tasksCompleted: s.user._count.taskCompletions,
        posts: s.user._count.noticePosts,
      })),
    });
  } catch (err) {
    console.error('[analytics] top-members failed', err);
    res.status(500).json({ error: 'Failed to fetch top members' });
  }
});
