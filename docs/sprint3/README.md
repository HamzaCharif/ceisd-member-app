# Sprint 3 — Verified backend, invitation flow, admin redesign

## What changed (and how each change was verified)

| Area | Change | Verified by |
|---|---|---|
| API | One shared Prisma client (`api/lib/prisma.ts`) instead of 26 | `npm run typecheck:api`, smoke |
| API | Analytics formulas rewritten (task completion was always 100%; active members = total; attendance could exceed 100%) | smoke asserts 62.5%, 33.3%, 50% etc. against seeded data |
| API | Match invitations: `CONNECT → REQUESTED → ACCEPT → CONNECTED`, `DECLINE`, `/api/matching/requests` | smoke: recipient's unread count +1, inbox contains MATCH_REQUEST, accept awards +20 both sides |
| API | In-app notifications (`/api/notifications`, `/unread-count`, `/read-all`, `/:id/read`) | smoke |
| API | Points: admin-only endpoint, direct `addPoints()` calls (no HTTP self-calls), idempotent per `referenceId` | smoke: exactly 2 point records after double scan |
| API | RSVP no longer creates member-authored Task rows; `/my-tasks` returns `upcomingEvents` | smoke: tasksAssigned = 8 |
| API | Shared tasks no longer flip to COMPLETED for everyone when one member finishes | smoke |
| API | `adminTasks` auth chain, `/api/auth/session/validate`, QR double-scan → 409 | smoke |
| Mobile | `NotificationsContext` (15 s foreground polling), `NotificationBell`, `NotificationsScreen`, rewritten `MatchCard`/`MatchMeScreen` with invitation states | `tsc --noEmit`, `expo export --platform web` |
| Admin | New visual system (`globals.css` tokens, Fraunces + Instrument Sans, ledger surfaces), rewritten Overview with fractions behind every %, per-event table, most-engaged list | `next build` (was failing on `/login` before) |

## Schema migration

`prisma/migrations/20260830120000_match_requests_and_notifications/` — run `npx prisma migrate deploy` (or `migrate dev`) on your machine.
Adds `MatchStatus.REQUESTED`, `Match.requestedById/requestedAt/connectedAt`, a unique `(userId1,userId2)` on Match,
the `Notification` table, and `GamificationRecord.referenceId`.

## The verification loop (run before returning ANY iteration)

```bash
npm run typecheck:api                 # 0 errors
./scripts/run-smoke.sh                # boots API, resets DB, 76 assertions
cd admin-web && npx tsc --noEmit && npx next build
cd mobile   && npx tsc --noEmit && npx expo export --platform web --output-dir /tmp/expo-web
```

`scripts/run-smoke.sh` needs `.env` with `DATABASE_URL`, `JWT_SECRET`, `QR_SECRET`, `ADMIN_EMAILS=admin@aus.edu`, `NODE_ENV=development`.
It TRUNCATES the database — only point it at a local/dev DB.

### Running without Prisma's native engine (CI / locked-down hosts)
```bash
DATABASE_ADAPTER=pg node scripts/patch-prisma-wasm.js   # after prisma generate
```
Default (no `DATABASE_ADAPTER`) uses the normal native engine exactly as before.

## Known / not done

- **On-device rendering is unverified** — no simulator or browser in the build sandbox. Design was verified by compile + bundle only.
- Push notifications (Expo push tokens) not implemented; in-app inbox + polling covers "they receive the invitation" while the app is open.
- `admin-web/app/login` in production posts `{ email }` to `/api/auth/sso` and collects a password it never sends — left untouched per instruction (login is deferred until AUS grants Entra permissions).
- The other admin pages (members, events, tasks, analytics, ai-insights) inherit the new shell/typography/colors but their inner markup hasn't been redesigned yet.
- Mobile screens other than Match Me / Notifications / Home header keep the Sprint 2 design system; a full pass is next.
