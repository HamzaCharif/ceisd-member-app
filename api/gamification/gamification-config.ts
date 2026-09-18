// /api/gamification/gamification-config.ts
// Point values and stage thresholds — all driven from /shared/constants.ts.
// Admin can adjust values here without touching business logic.

import { POINT_VALUES, STAGE_THRESHOLDS } from '../../shared/constants';
import { StageType } from '../../shared/types';

export const GAMIFICATION_CONFIG = {
  pointValues: POINT_VALUES,
  stageThresholds: STAGE_THRESHOLDS,
} as const;

/**
 * Given a total points value, returns the corresponding StageType.
 */
export function calculateStage(totalPoints: number): StageType {
  if (totalPoints >= STAGE_THRESHOLDS.MENTOR) return StageType.MENTOR;
  if (totalPoints >= STAGE_THRESHOLDS.SCALE) return StageType.SCALE;
  if (totalPoints >= STAGE_THRESHOLDS.SHAPE) return StageType.SHAPE;
  return StageType.SPARK;
}
