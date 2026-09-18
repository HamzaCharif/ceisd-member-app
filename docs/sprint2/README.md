# Sprint 2 — What's in this drop

Everything from this sprint is already merged into the project at its correct path — this
isn't a separate patch, it's the ready-to-run repo.

## What changed
- `mobile/theme/theme.ts` — new design-system tokens (colors, spacing, type, radius, shadows)
- `mobile/components/` — new reusable library: Button, Card, Badge, Avatar, SegmentedControl,
  ScreenHeader, EmptyState, ConsentCheckbox
- `mobile/screens/auth/LoginScreen.tsx` — migrated to design system (old version kept as `.old.tsx`)
- `mobile/screens/home/HomeScreen.tsx` — migrated (old version kept as `.old.tsx`)
- `mobile/screens/events/EventCard.tsx` + `EventsFeed.tsx` — migrated, added pull-to-refresh
  (old versions kept as `.old.tsx`)
- `tsconfig.api.json` — fixed the production build failure found in testing (original backed up
  as `tsconfig.api.json.bak`)

## Read these in order
1. `TEST_REPORT.md` — what was tested, the build bug found & fixed, competitive benchmark
2. `DELIVERY_READINESS.md` — full spec-vs-implementation audit
3. `DESIGN_SYSTEM_MIGRATION.md` — how to migrate the remaining screens yourself, if you want to
   before the next Claude iteration does it

## Before you run it
```
npm run setup
cp .env.example .env      # fill in your values
npx prisma generate
npm run build:api         # should now succeed — this was the bug we fixed
npm run dev:api
npm run dev:mobile
```

## Once verified, delete the safety copies
The `*.old.tsx` files and `tsconfig.api.json.bak` are there so you can diff/revert if something
looks wrong on your device. Once you've confirmed Login, Home, and Events render correctly,
delete them — don't ship them to the repo.
