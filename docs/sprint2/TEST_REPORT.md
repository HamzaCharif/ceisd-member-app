# CEISD Member App — Test Report & Competitive Benchmark (Sprint 2)

## Part 1 — What was actually tested (and how)

Honest scope up front: this environment has no phone simulator and no PostgreSQL with pgvector,
so React Native rendering and live end-to-end flows **cannot be executed here** — those remain
your on-device pass. What I ran instead are the tests that are real and reproducible:

| Test | Method | Result |
|------|--------|--------|
| Dependency install | `npm install` (root workspace) | ✅ Pass, no conflicts |
| Prisma schema validity | enum/model inspection (engine download blocked in sandbox) | ✅ Schema contains all enums (UserRole, StageType, YearOfStudy) |
| **API production build** | `tsc -p tsconfig.api.json --noEmit` (strict) | ❌ **FAILS — 56 errors. Real delivery blocker, details below** |
| Hardcoded-data audit | Static scan of all 37 mobile screens + admin | ✅ Pass — see Part 2 |
| Admin dashboard data flow | Source inspection | ✅ API-driven (`Promise.all` fetches, no hardcoded stats) |
| API↔client contract | Endpoint constant cross-check | ✅ Screens call defined `API_ENDPOINTS` |

## Part 2 — Dynamic-vs-hardcoded audit (your specific ask)

**Verdict: the app is genuinely dynamic.** Zero mock datasets found in screens. The only inline
arrays are legitimate configuration (nav items, signup question definitions, section labels) —
exactly what *should* be static. Data flow per section:

- Events, tasks, matches, notice board, gamification, attendance → all fetched from the API
- Admin dashboard stats (active members, attendance, task completion, match rate) → all fetched
- Screens without API calls are presentational children (TaskCard, JourneyProgress, EngagementBadge)
  or local-state signup steps that submit at the end — correct architecture

## Part 3 — Real bugs found

### 🔴 BUG-1: Production build is broken (`npm run build:api` fails)
Dev mode works only because `ts-node-dev --transpile-only` skips type checking. The moment you
try to build for AUS server deployment, `tsc` fails. Two causes:

**Cause A (definite, fixed):** `tsconfig.api.json` includes `shared/**/*`, which sweeps
`shared/api-client.ts` into the API build — but that file imports `react-native` and
`expo-secure-store`, which will never exist server-side. Verified zero API files import it.
→ **Fix applied:** `tsconfig.api.json` (in this folder) excludes `shared/api-client.ts`. Drop-in replacement.

**Cause B (verify on your machine):** 39 implicit-`any` errors + 13 Prisma namespace errors across
`api/admin/*`, `api/gamification/*`, `api/auth/sso.ts`. Most likely the majority vanish once
`npx prisma generate` runs successfully (it's blocked in my sandbox, which strips the generated
types that would let `map()` callbacks infer). **The definitive test only you can run:**
```
npx prisma generate && npm run build:api
```
If implicit-any errors remain after that, they're real strict-mode violations — send me the
output and I'll patch each file.

### 🟡 BUG-2 (from previous iteration, still open)
§12 member self-data-export endpoint missing; ConsentCheckbox not yet wired into SignupStep9.

## Part 4 — Competitive benchmark

Compared against the apps your users already know: **Luma** (event UX benchmark), **Meetup**
(community events), **Eventbrite** (registration/ticketing), and campus platforms
(**CampusGroups / Corq**). What they do that CEISD currently doesn't:

| Gap | Who does it well | Impact | Effort |
|-----|------------------|--------|--------|
| **Push notifications** (event reminders, task deadlines, match requests) | All of them — it's the #1 re-engagement driver | 🔴 High — without it, 50 test users will simply forget the app exists | Medium (`expo-notifications`) |
| **Event images feel premium** — full-bleed banners, gradient overlays, date chips on the image | Luma | High — Luma's card design is why it feels premium; CEISD's new EventCard is close, needs gradient overlay + date chip | Low (already 70% there after Sprint 2 card) |
| **Add-to-calendar that actually works on device** (.ics / native calendar) | Luma, Eventbrite | High — spec §5.2 requires it; verify the existing Calendar button generates a real calendar entry, not just UI | Low–Medium |
| **Skeleton loading states** (shimmer placeholders instead of spinners) | All modern apps | Medium — spinners read as "student project", skeletons read as "product" | Low (one `Skeleton` component) |
| **Profile completeness meter** ("Your profile is 80% complete") | LinkedIn pattern | Medium — directly improves your AI matching quality by nudging richer profiles | Low |
| **Social proof on events** ("12 members attending" + avatar stack) | Meetup, Luma | Medium — proven RSVP driver | Low (data already exists via rsvpCount) |
| **Haptic feedback** on RSVP/check-in/match | Luma | Low–Medium polish | Trivial (`expo-haptics`) |
| **Dark mode** | All | Low for a 50-user test | Deferred — the theme token architecture makes it a later drop-in |

**Where CEISD is already *stronger* than the comparison apps:** QR-based attendance with automatic
task completion + points (none of them close the loop like this), AI member matching with
explanations, and the gamified journey (Spark→Shape→Scale→Mentor). These are your differentiators —
the benchmark gaps above are table-stakes polish, not missing identity.

## Part 5 — Recommended order of work

1. **You run:** `npx prisma generate && npm run build:api` with the fixed tsconfig → send me residual errors (if any)
2. **You verify on device:** Sprint 2 screens (Login, Home, EventCard/Feed) render correctly
3. **Next Claude iteration:** skeleton loading + avatar-stack social proof + profile completeness (all low-effort, high-perception wins from the benchmark) + remaining screen migrations
4. **Following iteration:** push notifications (the single biggest gap vs. every major app)
5. Wire consent + member export (§12 compliance completion)
