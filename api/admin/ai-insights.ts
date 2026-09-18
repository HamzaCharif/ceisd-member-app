// /api/admin/ai-insights.ts
// AI-driven insights aggregation for admin dashboard.

import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth/session';

export const adminAiInsightsRouter = Router();

// GET /api/admin/ai-insights — aggregated AI insights
adminAiInsightsRouter.get('/', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      allUsers,
      recentAttendances,
      recentTaskCompletions,
      topMatches,
      allProfiles,
    ] = await Promise.all([
      prisma.user.findMany({
        include: {
          userStage: true,
          _count: { select: { eventAttendances: true, taskCompletions: true } },
        },
      }),
      // Members who attended an event in the last 30 days
      prisma.eventAttendance.findMany({
        where: { attendedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        select: { userId: true },
      }),
      // Members who completed a task in the last 30 days
      prisma.taskCompletion.findMany({
        where: { completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        select: { userId: true },
      }),
      // Top 10 match pairs by compatibility score
      prisma.match.findMany({
        where: { status: 'CONNECTED' },
        orderBy: { compatibilityScore: 'desc' },
        take: 10,
        include: {
          user1: { select: { id: true, name: true, email: true, college: true } },
          user2: { select: { id: true, name: true, email: true, college: true } },
        },
      }),
      // All user profiles for skill gap analysis
      prisma.userProfile.findMany({
        select: { skillRatings: true },
      }),
    ]);

    // --- Low engagement members ---
    const activeUserIds = new Set([
      ...recentAttendances.map((a) => a.userId),
      ...recentTaskCompletions.map((t) => t.userId),
    ]);

    const lowEngagementMembers = allUsers
      .filter((u) => !activeUserIds.has(u.id) && u.role === 'MEMBER')
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        college: u.college ?? '',
        stage: u.userStage?.stage ?? 'SPARK',
        totalPoints: u.userStage?.totalPoints ?? 0,
        eventsAttended: u._count.eventAttendances,
        tasksCompleted: u._count.taskCompletions,
        lastActivityDaysAgo: null, // would need createdAt-based logic; left as indicator
      }))
      .sort((a, b) => a.totalPoints - b.totalPoints)
      .slice(0, 20);

    // --- Top match pairs ---
    const topMatchPairs = topMatches.map((m) => ({
      matchId: m.id,
      user1: m.user1,
      user2: m.user2,
      compatibilityScore: m.compatibilityScore,
      explanation: m.explanation ?? '',
    }));

    // --- Skill gap analysis ---
    // Average skill ratings across all profiles; highlight skills rated < 3.0 by majority
    const skillTotals: Record<string, { total: number; count: number }> = {};
    allProfiles.forEach((p) => {
      const ratings = p.skillRatings as Array<{ skill: string; rating: number }>;
      if (!Array.isArray(ratings)) return;
      ratings.forEach(({ skill, rating }) => {
        if (!skillTotals[skill]) skillTotals[skill] = { total: 0, count: 0 };
        skillTotals[skill].total += rating;
        skillTotals[skill].count += 1;
      });
    });

    const skillGaps = Object.entries(skillTotals)
      .map(([skill, { total, count }]) => ({
        skill,
        averageRating: Math.round((total / count) * 10) / 10,
        memberCount: count,
        isGap: total / count < 2.5,
      }))
      .sort((a, b) => a.averageRating - b.averageRating);

    // --- Stage distribution summary ---
    const stageDistribution: Record<string, number> = {};
    allUsers.forEach((u) => {
      const stage = u.userStage?.stage ?? 'SPARK';
      stageDistribution[stage] = (stageDistribution[stage] ?? 0) + 1;
    });

    res.json({
      data: {
        lowEngagementMembers,
        topMatchPairs,
        skillGaps,
        stageDistribution,
        summary: {
          totalMembers: allUsers.length,
          activeLastMonth: activeUserIds.size,
          inactiveCount: lowEngagementMembers.length,
          connectedMatchCount: topMatches.length,
          identifiedSkillGaps: skillGaps.filter((s) => s.isGap).length,
        },
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
});
