// /api/matching/event-ranker.ts
// Returns events ranked by relevance to the current user's interests.

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthenticatedRequest } from '../auth/session';

export const eventRankerRouter = Router();

// GET /api/matching/ranked-events
eventRankerRouter.get('/ranked-events', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  try {
    const [events, userProfile] = await Promise.all([
      prisma.event.findMany({
        where: { dateTime: { gte: new Date() } },
        orderBy: { dateTime: 'asc' },
      }),
      prisma.userProfile.findUnique({ where: { userId } }),
    ]);

    if (!userProfile || events.length === 0) {
      res.json({ data: events });
      return;
    }

    const profileData = userProfile.problemInterests as { industries?: string[] };
    const userInterests = (profileData?.industries ?? []).map((i) => i.toLowerCase());

    // Score each event by keyword overlap with user interests
    const scored = events.map((event) => {
      const eventText = `${event.title} ${event.description}`.toLowerCase();
      const overlap = userInterests.filter((interest) => eventText.includes(interest)).length;
      return { event, relevanceScore: overlap };
    });

    // Sort by relevance descending, then by dateTime ascending for ties
    scored.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
      return new Date(a.event.dateTime).getTime() - new Date(b.event.dateTime).getTime();
    });

    res.json({ data: scored.map((s) => s.event) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch ranked events' });
  }
});
