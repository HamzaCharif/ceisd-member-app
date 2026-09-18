// /api/gamification/leaderboard.ts
// GET /api/gamification/leaderboard — top 10 members by totalPoints.
// Used by Admin dashboard (Agent 7 Phase 4).

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthenticatedRequest } from '../auth/session';

export const leaderboardRouter = Router();

leaderboardRouter.get('/leaderboard', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const topStages = await prisma.userStage.findMany({
      orderBy: { totalPoints: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, name: true, email: true, college: true } },
      },
    });

    const leaderboard = topStages.map((s, index) => ({
      rank: index + 1,
      userId: s.userId,
      name: s.user.name,
      email: s.user.email,
      college: s.user.college,
      stage: s.stage,
      totalPoints: s.totalPoints,
    }));

    res.json({ data: leaderboard });
  } catch {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});
