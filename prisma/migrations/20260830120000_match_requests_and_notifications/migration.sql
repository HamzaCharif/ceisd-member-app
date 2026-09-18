-- Match invitation flow + in-app notifications
ALTER TYPE "MatchStatus" ADD VALUE IF NOT EXISTS 'REQUESTED';

CREATE TYPE "NotificationType" AS ENUM ('MATCH_REQUEST', 'MATCH_ACCEPTED', 'TASK_ASSIGNED', 'EVENT_REMINDER', 'ANNOUNCEMENT', 'MENTOR_BOOKING', 'POINTS_AWARDED', 'SYSTEM');

ALTER TABLE "Match" ADD COLUMN "requestedById" TEXT;
ALTER TABLE "Match" ADD COLUMN "requestedAt" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN "connectedAt" TIMESTAMP(3);

-- Remove duplicate pairs before adding the unique constraint (keeps the newest)
DELETE FROM "Match" a USING "Match" b
  WHERE a."userId1" = b."userId1" AND a."userId2" = b."userId2" AND a."createdAt" < b."createdAt";

CREATE UNIQUE INDEX "Match_userId1_userId2_key" ON "Match"("userId1", "userId2");
CREATE INDEX "Match_userId2_status_idx" ON "Match"("userId2", "status");

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "data" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Per-reference idempotency for point awards
ALTER TABLE "GamificationRecord" ADD COLUMN "referenceId" TEXT;
CREATE UNIQUE INDEX "GamificationRecord_userId_reason_referenceId_key" ON "GamificationRecord"("userId", "reason", "referenceId");
