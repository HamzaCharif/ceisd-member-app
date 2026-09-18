#!/usr/bin/env bash
# Wipes all rows (keeps schema) so `npm run smoke` starts from a known state.
# Usage: DATABASE_URL=postgresql://... scripts/reset-db.sh
set -euo pipefail
: "${DATABASE_URL:?set DATABASE_URL}"
psql "${DATABASE_URL%%\?*}" -q -v ON_ERROR_STOP=1 -c '
TRUNCATE "Notification","Match","MentorBooking","AdminLog","GamificationRecord","UserStage",
  "FormSubmission","Form","TaskCompletion","Task","NoticePost","EventAttendance","EventRsvp","Event",
  "Announcement","EmbeddingVector","UserProfile","User" RESTART IDENTITY CASCADE;'
echo "db reset"
