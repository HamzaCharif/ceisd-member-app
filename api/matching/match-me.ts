// /api/matching/match-me.ts
// Match generation, retrieval, and the connection-invitation flow.
//
// Lifecycle of a Match row:
//   PENDING   → AI suggested it, nobody acted
//   REQUESTED → one member tapped Connect; the other gets a notification
//   CONNECTED → the other member accepted; both get points
//   SAVED     → bookmarked for later
//   REJECTED  → declined by either side; excluded from future generation

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthenticatedRequest } from '../auth/session';
import { scoreMatch, generateExplanation } from './match-scorer';
import { addPoints } from '../gamification/points-engine';
import { notify } from '../notifications/notifications';
import { POINT_VALUES } from '../../shared/constants';

export const matchMeRouter = Router();

const MATCH_USER_SELECT = {
  id: true,
  name: true,
  college: true,
  yearOfStudy: true,
  profile: { select: { skillRatings: true, problemInterests: true, collaborationPrefs: true } },
  userStage: { select: { stage: true, totalPoints: true } },
} as const;

function cleanExplanation(raw: string): string {
  return raw
    .replace(/â€"/g, '—')
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/\b(\w+) \1\b/gi, '$1')
    .trim();
}

/** Normalise a pair so (a,b) and (b,a) hit the same unique row. */
function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

// POST /api/matching/generate-matches — score everyone, upsert top 10
matchMeRouter.post('/generate-matches', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  try {
    const others = await prisma.user.findMany({
      where: { id: { not: userId }, profile: { isNot: null } },
      select: { id: true },
    });

    if (others.length === 0) {
      res.json({ data: { message: 'More matches coming as the community grows', matches: [], count: 0 } });
      return;
    }

    // Anyone already REJECTED or CONNECTED with me is not re-suggested.
    const settled = await prisma.match.findMany({
      where: {
        status: { in: ['REJECTED', 'CONNECTED'] },
        OR: [{ userId1: userId }, { userId2: userId }],
      },
      select: { userId1: true, userId2: true },
    });
    const excluded = new Set<string>();
    for (const m of settled) excluded.add(m.userId1 === userId ? m.userId2 : m.userId1);

    const scored: Array<{ otherId: string; score: number; reasons: string[] }> = [];
    for (const { id } of others) {
      if (excluded.has(id)) continue;
      try {
        const result = await scoreMatch(userId, id);
        scored.push({ otherId: id, score: result.score, reasons: result.reasons });
      } catch (err) {
        console.error('[match-me] scoreMatch failed', userId, id, err);
      }
    }

    const top10 = scored.sort((a, b) => b.score - a.score).slice(0, 10);

    const matches = await Promise.all(
      top10.map(async ({ otherId, score, reasons }) => {
        const explanation = cleanExplanation(await generateExplanation(userId, otherId, reasons));
        const [userId1, userId2] = orderPair(userId, otherId);
        return prisma.match.upsert({
          where: { userId1_userId2: { userId1, userId2 } },
          // Never downgrade a REQUESTED/SAVED match back to PENDING — only refresh the score.
          update: { compatibilityScore: score, explanation },
          create: { userId1, userId2, compatibilityScore: score, explanation, status: 'PENDING' },
          include: { user1: { select: MATCH_USER_SELECT }, user2: { select: MATCH_USER_SELECT } },
        });
      }),
    );

    res.json({ data: { matches, count: matches.length } });
  } catch (err) {
    console.error('[match-me] generate-matches failed', err);
    res.status(500).json({ error: 'Failed to generate matches' });
  }
});

// GET /api/matching/my-matches — everything except rejected, with "who did what" flags
matchMeRouter.get('/my-matches', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
        status: { in: ['PENDING', 'REQUESTED', 'SAVED', 'CONNECTED'] },
      },
      include: { user1: { select: MATCH_USER_SELECT }, user2: { select: MATCH_USER_SELECT } },
      orderBy: [{ status: 'asc' }, { compatibilityScore: 'desc' }],
    });

    const data = matches.map((m) => {
      const other = m.userId1 === userId ? m.user2 : m.user1;
      return {
        ...m,
        other,
        // Convenience flags so the UI doesn't have to reason about userId1/userId2
        iRequested: m.status === 'REQUESTED' && m.requestedById === userId,
        awaitingMyResponse: m.status === 'REQUESTED' && m.requestedById !== userId,
      };
    });

    res.json({ data });
  } catch (err) {
    console.error('[match-me] my-matches failed', err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// GET /api/matching/suggestions — top 2 for the profile screen
matchMeRouter.get('/suggestions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
        status: { in: ['PENDING', 'SAVED'] },
      },
      include: { user1: { select: MATCH_USER_SELECT }, user2: { select: MATCH_USER_SELECT } },
      orderBy: { compatibilityScore: 'desc' },
      take: 2,
    });
    res.json({
      data: matches.map((m) => ({ ...m, other: m.userId1 === userId ? m.user2 : m.user1 })),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// GET /api/matching/requests — invitations waiting for MY answer
matchMeRouter.get('/requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const requests = await prisma.match.findMany({
      where: {
        status: 'REQUESTED',
        requestedById: { not: userId },
        OR: [{ userId1: userId }, { userId2: userId }],
      },
      include: { user1: { select: MATCH_USER_SELECT }, user2: { select: MATCH_USER_SELECT } },
      orderBy: { requestedAt: 'desc' },
    });
    res.json({
      data: requests.map((m) => ({ ...m, other: m.userId1 === userId ? m.user2 : m.user1 })),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

type MatchAction = 'CONNECT' | 'ACCEPT' | 'DECLINE' | 'SAVE' | 'REJECT';
const ACTIONS: MatchAction[] = ['CONNECT', 'ACCEPT', 'DECLINE', 'SAVE', 'REJECT'];

// PATCH /api/matching/matches/:matchId  { action }
//   CONNECT → send invitation (PENDING/SAVED → REQUESTED)
//   ACCEPT  → recipient accepts (REQUESTED → CONNECTED)
//   DECLINE → recipient declines (REQUESTED → REJECTED)
//   SAVE    → bookmark (PENDING → SAVED)
//   REJECT  → hide this suggestion (any → REJECTED)
matchMeRouter.patch('/matches/:matchId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { matchId } = req.params;
  const userId = req.user!.userId;
  const { action } = req.body as { action?: MatchAction };

  if (!action || !ACTIONS.includes(action)) {
    res.status(400).json({ error: `action must be one of ${ACTIONS.join(', ')}` });
    return;
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { user1: { select: { id: true, name: true } }, user2: { select: { id: true, name: true } } },
    });
    if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
    if (match.userId1 !== userId && match.userId2 !== userId) {
      res.status(403).json({ error: 'Not your match' });
      return;
    }

    const me = match.userId1 === userId ? match.user1 : match.user2;
    const other = match.userId1 === userId ? match.user2 : match.user1;

    switch (action) {
      case 'CONNECT': {
        if (match.status === 'CONNECTED') { res.status(409).json({ error: 'Already connected' }); return; }
        if (match.status === 'REQUESTED') {
          // Both tapped Connect independently → treat as mutual acceptance.
          if (match.requestedById !== userId) return acceptMatch(res, match.id, me, other);
          res.status(409).json({ error: 'Invitation already sent' });
          return;
        }
        const updated = await prisma.match.update({
          where: { id: matchId },
          data: { status: 'REQUESTED', requestedById: userId, requestedAt: new Date() },
        });
        await notify({
          userId: other.id,
          type: 'MATCH_REQUEST',
          title: `${me.name} wants to connect`,
          body: `${Math.round(match.compatibilityScore)}% match · ${match.explanation.slice(0, 120)}`,
          data: { matchId: match.id, fromUserId: me.id },
        });
        res.json({ data: updated });
        return;
      }

      case 'ACCEPT': {
        if (match.status !== 'REQUESTED' || match.requestedById === userId) {
          res.status(409).json({ error: 'No pending invitation to accept' });
          return;
        }
        return acceptMatch(res, match.id, me, other);
      }

      case 'DECLINE': {
        if (match.status !== 'REQUESTED' || match.requestedById === userId) {
          res.status(409).json({ error: 'No pending invitation to decline' });
          return;
        }
        const updated = await prisma.match.update({ where: { id: matchId }, data: { status: 'REJECTED' } });
        res.json({ data: updated });
        return;
      }

      case 'SAVE': {
        if (match.status !== 'PENDING') { res.status(409).json({ error: 'Only new suggestions can be saved' }); return; }
        const updated = await prisma.match.update({ where: { id: matchId }, data: { status: 'SAVED' } });
        res.json({ data: updated });
        return;
      }

      case 'REJECT': {
        const updated = await prisma.match.update({ where: { id: matchId }, data: { status: 'REJECTED' } });
        res.json({ data: updated });
        return;
      }
    }
  } catch (err) {
    console.error('[match-me] update failed', err);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

async function acceptMatch(
  res: Response,
  matchId: string,
  me: { id: string; name: string },
  other: { id: string; name: string },
): Promise<void> {
  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { status: 'CONNECTED', connectedAt: new Date() },
  });

  // Points for both sides — direct call, no HTTP self-request.
  await Promise.allSettled([
    addPoints(me.id, 'MATCH_ACCEPTED', POINT_VALUES.MATCH_ACCEPTED),
    addPoints(other.id, 'MATCH_ACCEPTED', POINT_VALUES.MATCH_ACCEPTED),
  ]);

  await notify({
    userId: other.id,
    type: 'MATCH_ACCEPTED',
    title: `${me.name} accepted your invitation`,
    body: `You're now connected. +${POINT_VALUES.MATCH_ACCEPTED} points.`,
    data: { matchId, withUserId: me.id },
  });

  res.json({ data: updated });
}
