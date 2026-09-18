// /api/gamification/journey-stages.ts
// Stage checking and updating logic.

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthenticatedRequest } from '../auth/session';
import { calculateStage } from './gamification-config';
import { STAGE_LABELS } from '../../shared/constants';
import { StageType, StageInfo } from '../../shared/types';
import type { StageType as PrismaStageType } from '@prisma/client';

export const journeyStagesRouter = Router();

const STAGE_ORDER: StageType[] = [StageType.SPARK, StageType.SHAPE, StageType.SCALE, StageType.MENTOR];
const STAGE_THRESHOLDS_MAP: Record<StageType, number> = { SPARK: 0, SHAPE: 200, SCALE: 500, MENTOR: 1000 };

/**
 * Checks the user's total points and updates their stage if it has changed.
 * Returns the (possibly updated) stage.
 */
export async function checkAndUpdateStage(userId: string): Promise<StageType> {
  const userStage = await prisma.userStage.findUnique({ where: { userId } });
  if (!userStage) {
    await prisma.userStage.create({ data: { userId, stage: 'SPARK', totalPoints: 0 } });
    return StageType.SPARK;
  }

  const newStage = calculateStage(userStage.totalPoints);
  const currentStageEnum = userStage.stage as StageType;

  if (newStage !== currentStageEnum) {
    await prisma.userStage.update({
      where: { userId },
      data: { stage: newStage as PrismaStageType },
    });
  }

  return newStage;
}

// GET /api/gamification/my-stage
journeyStagesRouter.get('/my-stage', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  try {
    let userStage = await prisma.userStage.findUnique({ where: { userId } });
    if (!userStage) {
      userStage = await prisma.userStage.create({
        data: { userId, stage: 'SPARK', totalPoints: 0 },
      });
    }

    const currentStage = userStage.stage as StageType;
    const stageIndex = STAGE_ORDER.indexOf(currentStage);
    const nextStage = stageIndex < STAGE_ORDER.length - 1 ? STAGE_ORDER[stageIndex + 1] : null;
    const pointsToNext = nextStage ? STAGE_THRESHOLDS_MAP[nextStage] - userStage.totalPoints : null;
    const engagementLevel = STAGE_LABELS[currentStage] ?? 'Explorer';

    const stageInfo: StageInfo = {
      stage: currentStage,
      totalPoints: userStage.totalPoints,
      nextStage,
      pointsToNext: pointsToNext !== null ? Math.max(0, pointsToNext) : null,
      engagementLevel,
    };

    res.json({ data: stageInfo });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stage info' });
  }
});
