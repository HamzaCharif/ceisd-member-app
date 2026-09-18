# CEISD Member App

A full-stack platform for the Centre for Entrepreneurship, Innovation, and Sustainable Development (CEISD) at the American University of Sharjah. It includes a React Native mobile app for members, a Next.js admin dashboard, and an Express/Prisma API backend.

---

## Architecture

```
ceisd-member-app/
├── api/                  # Express API server (TypeScript)
│   ├── admin/            # Admin-only routes (members, tasks, analytics, AI insights)
│   ├── attendance/       # QR generation & validation, attendance logging
│   ├── auth/             # Microsoft SSO, JWT session, role management
│   ├── content/          # Events, announcements, noticeboard
│   ├── gamification/     # Points engine, journey stages, leaderboard
│   ├── matching/         # AI-powered member matching & mentor recommendation
│   └── tasks/            # Tasks, forms, completion tracking
├── admin-web/            # Next.js 14 admin dashboard
├── mobile/               # React Native (Expo) member app
├── prisma/               # Database schema & migrations
└── shared/               # Shared types, constants, API client
```

---

## Features

### Member App (Mobile)
- Microsoft SSO login restricted to `@aus.edu` accounts
- 9-step onboarding (skills, interests, goals, commitment)
- Home feed: announcements, notice board posts, events
- Events: RSVP, QR attendance scanning, calendar integration
- Tasks: manual approval, form submission, auto-attendance completion
- MatchMe: AI-powered collaborator matching with compatibility scores
- Mentor booking system
- Gamification: points, journey stages (SPARK → SHAPE → SCALE → MENTOR), engagement badges
- Profile: journey progress, recommended activities, points history

### Admin Dashboard (Web)
- Member table with search, role/stage filters, detail panel
- Events management with QR code generation
- Task creation and completion tracking
- Analytics: attendance over time, stage distribution, skill gaps, engagement metrics
- AI Insights: low-engagement member detection, top match pairs, skill gap analysis
- CSV and PDF export

### API
- JWT-authenticated REST API (port 4000)
- pgvector-powered semantic embeddings for member matching
- HMAC-signed QR tokens for tamper-proof attendance
- Anthropic Claude integration for match explanations and AI insights
- Prisma ORM with PostgreSQL

---

## Prerequisites

- Node.js 18+
- PostgreSQL 15+ with the `pgvector` extension enabled
- An Azure AD / Microsoft Entra app registration (for SSO)
- An Anthropic API key (for AI matching features)

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/HamzaCharif/ceisd-member-app.git
cd ceisd-member-app
npm run setup        # installs root, admin-web, and mobile dependencies
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in every value. See the comments in the file for where to get each key.

### 3. Set up the database

```bash
# Enable pgvector on your PostgreSQL instance first:
psql -d your_db -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run migrations
npm run prisma:migrate

# Generate the Prisma client
npm run prisma:generate
```

### 4. Run the development servers

Open three terminals:

```bash
# Terminal 1 — API (port 4000)
npm run dev:api

# Terminal 2 — Admin dashboard (port 3001)
npm run dev:admin

# Terminal 3 — Mobile app
npm run dev:mobile
```

The mobile app will open Expo Go. Press `w` to open in the browser or scan the QR code with the Expo Go app on your phone.

> **Physical device:** set `EXPO_PUBLIC_API_URL` in `.env` to your machine's LAN IP, e.g. `http://192.168.1.x:4000`.

---

## Environment Variables

All variables are documented in [`.env.example`](.env.example). The key ones:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (pgvector must be enabled) |
| `AZURE_CLIENT_ID` | Azure AD app registration client ID |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_CLIENT_SECRET` | Azure AD client secret |
| `JWT_SECRET` | 256-bit random secret for signing session tokens |
| `QR_SECRET` | HMAC secret for signing QR attendance tokens |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI features |
| `NEXT_PUBLIC_API_URL` | API base URL for the admin dashboard |
| `EXPO_PUBLIC_API_URL` | API base URL for the mobile app |

**Never commit `.env`.** It is gitignored. Set production secrets via your hosting platform's environment variables dashboard.

---

## Deployment

### API
Deploy to any Node.js host (Railway, Render, Fly.io, etc.):

```bash
npm run build:api
npm run start:api
```

Set all environment variables in the platform dashboard. Run `npm run prisma:migrate` once against the production database before the first deploy.

### Admin Dashboard
Deploy to Vercel (recommended):

```bash
cd admin-web
vercel --prod
```

Set `NEXT_PUBLIC_API_URL` to your deployed API URL in Vercel's environment variables settings.

### Mobile App
Build with EAS (Expo Application Services):

```bash
cd mobile
npx eas build --platform all
```

Update `EXPO_PUBLIC_API_URL` in `.env` to your deployed API URL before building.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo, React Navigation, Ionicons |
| Admin Web | Next.js 14, Tailwind CSS, Lucide React, Recharts |
| API | Express, TypeScript, ts-node-dev |
| Database | PostgreSQL, Prisma ORM, pgvector |
| Auth | Microsoft Azure AD (MSAL), JWT |
| AI | Anthropic Claude (matching explanations, insights) |
| QR | HMAC-SHA256 signed tokens, expo-camera |

---

## Scripts

| Command | Description |
|---|---|
| `npm run setup` | Install all dependencies (root + admin-web + mobile) |
| `npm run dev:api` | Start the API server with hot reload |
| `npm run dev:admin` | Start the admin Next.js dev server |
| `npm run dev:mobile` | Start the Expo mobile dev server |
| `npm run build:api` | Compile the API TypeScript to `dist/` |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:generate` | Regenerate the Prisma client |

---

## Common Issues

**Port 4000 already in use**
```bash
# Find and kill the process
npx kill-port 4000
npm run dev:api
```

**Prisma client out of date**
```bash
npm run prisma:generate
```

**Mobile app can't reach API on a physical device**
Set `EXPO_PUBLIC_API_URL=http://<your-lan-ip>:4000` in `.env` and restart the Expo server.
