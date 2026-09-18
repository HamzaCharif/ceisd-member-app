# CEISD Member App — working rules for AI coding sessions

## Before you return ANY change
1. `npm run typecheck:api` — must be 0 errors.
2. `./scripts/run-smoke.sh` — must print `N passed, 0 failed`. If you changed behaviour on purpose, update the assertion in `scripts/smoke.ts` in the same change and say so.
3. `cd admin-web && npx tsc --noEmit && npx next build`
4. `cd mobile && npx tsc --noEmit && npx expo export --platform web --output-dir /tmp/expo-web`
Do not report "done" without pasting the output of all four.

## Architecture facts that are easy to break
- ONE Prisma client: `import { prisma } from '../lib/prisma'`. Never `new PrismaClient()`.
- Points are awarded ONLY via `addPoints(userId, reason, amount, referenceId)` from server code. `POST /api/gamification/points` is admin-only.
- Never call the API from the API (no axios to localhost). Import the function.
- `Task.status` is a whole-task flag; per-member completion lives in `TaskCompletion`. Only flip `Task.status` for single-assignee tasks.
- Match lifecycle: PENDING → REQUESTED (Connect) → CONNECTED (Accept). Notifications are created in `api/notifications/notifications.ts#notify`.
- Any new user-facing side effect (assign task, book mentor, announcement) should call `notify()` / `notifyMany()`.
- Design tokens: mobile `mobile/theme/theme.ts`; admin `admin-web/app/globals.css`. No hardcoded hex in screens.
- Login/SSO is frozen until AUS grants Entra permissions. Do not modify `api/auth/sso.ts` or the login screens' auth logic.
