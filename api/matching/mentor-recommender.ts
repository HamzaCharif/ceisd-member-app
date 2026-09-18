// /api/matching/mentor-recommender.ts
// Recommends mentors and handles mentor booking.

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthenticatedRequest } from '../auth/session';
import { scoreMatch } from './match-scorer';

export const mentorRouter = Router();

// GET /api/matching/recommend-mentor
mentorRouter.get('/recommend-mentor', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  try {
    // Fetch potential mentors: ADMIN users or users at MENTOR stage
    const potentialMentors = await prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          { role: 'ADMIN' },
          { userStage: { stage: 'MENTOR' } },
        ],
      },
      include: { profile: true, userStage: true },
      take: 20,
    });

    if (potentialMentors.length === 0) {
      res.json({ data: { mentors: [], message: 'No mentors available yet' } });
      return;
    }

    // Score each mentor
    const scored = await Promise.all(
      potentialMentors.map(async (mentor) => {
        try {
          const result = await scoreMatch(userId, mentor.id);
          return { mentor, score: result.score, reasons: result.reasons };
        } catch {
          return { mentor, score: 0, reasons: [] };
        }
      })
    );

    const top3 = scored.sort((a, b) => b.score - a.score).slice(0, 3);

    const formatted = top3.map(({ mentor, score, reasons }) => ({
      id: mentor.id,
      name: mentor.name,
      email: mentor.email,
      college: mentor.college,
      stage: mentor.userStage?.stage,
      compatibilityScore: score,
      explanation: reasons[0] ?? 'Good mentor match for your profile',
    }));

    res.json({ data: { mentors: formatted } });
  } catch {
    res.status(500).json({ error: 'Failed to fetch mentor recommendations' });
  }
});

// POST /api/matching/book-mentor
mentorRouter.post('/book-mentor', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const memberId = req.user!.userId;
  const { mentorId, notes } = req.body as { mentorId?: string; notes?: string };

  if (!mentorId) {
    res.status(400).json({ error: 'mentorId is required' });
    return;
  }

  try {
    const mentor = await prisma.user.findUnique({ where: { id: mentorId } });
    if (!mentor) {
      res.status(404).json({ error: 'Mentor not found' });
      return;
    }

    const booking = await prisma.mentorBooking.create({
      data: {
        mentorId,
        memberId,
        notes,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      data: {
        booking,
        message: `Booking request sent to ${mentor.name}. They will confirm shortly.`,
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});
