// /api/gamification/points-engine.ts
// addPoints() — atomic, idempotent point awarding with stage progression.

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth/session';
import { checkAndUpdateStage } from './journey-stages';
import { POINT_VALUES } from '../../shared/constants';

export const pointsEngineRouter = Router();

type PointReason = keyof typeof POINT_VALUES;
const VALID_REASONS = Object.keys(POINT_VALUES) as PointReason[];

/**
 * Awards points to a user atomically.
 * Idempotent per (userId, reason, referenceId): attending the same event twice,
 * or a retried webhook, can never double-award. Pass the eventId / taskId /
 * matchId as referenceId. Without a referenceId we fall back to a 60s window.
 * Triggers stage update after point award.
 */
export async function addPoints(
  userId: string,
  reason: string,
  amount: number,
  referenceId?: string,
): Promise<{ newTotal: number; stage: string; awarded: boolean }> {
  if (!VALID_REASONS.includes(reason as PointReason)) {
    throw new Error(`Invalid reason "${reason}". Valid values: ${VALID_REASONS.join(', ')}`);
  }

  // ── Idempotency check ────────────────────────────────────────────────────
  const recentRecord = referenceId
    ? await prisma.gamificationRecord.findFirst({ where: { userId, reason, referenceId } })
    : await prisma.gamificationRecord.findFirst({
        where: { userId, reason, referenceId: null, createdAt: { gte: new Date(Date.now() - 60 * 1000) } },
      });

  if (recentRecord) {
    // Duplicate detected — return current total without inserting
    const userStage = await prisma.userStage.findUnique({ where: { userId } });
    return {
      newTotal: userStage?.totalPoints ?? 0,
      stage: userStage?.stage ?? 'SPARK',
      awarded: false,
    };
  }

  // ── Atomic transaction: insert record + update total ────────────────────
  await prisma.$transaction([
    prisma.gamificationRecord.create({
      data: { userId, points: amount, reason, referenceId: referenceId ?? null },
    }),
    prisma.userStage.upsert({
      where: { userId },
      update: { totalPoints: { increment: amount } },
      create: { userId, stage: 'SPARK', totalPoints: amount },
    }),
  ]);

  // ── Update stage if threshold crossed ───────────────────────────────────
  const newStage = await checkAndUpdateStage(userId);
  const userStage = await prisma.userStage.findUnique({ where: { userId } });

  return {
    newTotal: userStage?.totalPoints ?? amount,
    stage: newStage,
    awarded: true,
  };
}

// GET /api/gamification/my-history — returns all GamificationRecord entries for the current user
pointsEngineRouter.get('/my-history', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  try {
    const records = await prisma.gamificationRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const total = records.reduce((sum: number, r: { points: number }) => sum + r.points, 0);
    res.json({ data: { records, total } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load history';
    res.status(500).json({ error: message });
  }
});

// POST /api/gamification/points  (ADMIN ONLY — manual adjustments)
// Body: { userId, reason, amount, referenceId? }
// Members must never be able to hit this: all normal awards happen server-side
// through addPoints() from attendance / tasks / forms / matches.
pointsEngineRouter.post('/points', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { userId, reason, amount, referenceId } = req.body as {
    userId?: string;
    reason?: string;
    amount?: number;
    referenceId?: string;
  };

  if (!userId || !reason || amount === undefined) {
    res.status(400).json({ error: 'userId, reason, and amount are required' });
    return;
  }

  if (amount <= 0 || !Number.isInteger(amount)) {
    res.status(400).json({ error: 'amount must be a positive integer' });
    return;
  }

  try {
    const result = await addPoints(userId, reason, amount, referenceId);
    res.json({ data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to award points';
    res.status(400).json({ error: message });
  }
});
