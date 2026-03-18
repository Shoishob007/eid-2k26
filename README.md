# Eid Eidi Spinner

A festive Eid web app where only predefined players can spin the wheel, up to 3 spins each, and claim whichever spin they like (first, second, or third).

## Features

- Fixed participant list with optional participant support.
- Backend APIs for player tracking, scoring, and claim locking.
- Persistent spin records and claim results in PostgreSQL.
- Leaderboard showing claimed amounts and who is yet to spin.
- Fallback panel when spins are exhausted but claim is not finalized.
- Eid-themed UI with animated fireworks, lanterns, and celebratory overlays.

## Tech Stack

- Next.js App Router
- Prisma ORM
- PostgreSQL (recommended: Neon free tier)
- Framer Motion

## API Endpoints

- GET /api/dashboard
  - Optional query: ?name=Ifty
  - Returns players, selected player state, and leaderboard.
- POST /api/spin
  - Body: { "name": "Ifty", "power": 72 }
  - Creates one spin if spins are available.
- POST /api/claim
  - Body: { "name": "Ifty", "spinOrder": 2 }
  - Locks the selected spin as final Eidi.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file and set your DB URL:

```bash
cp .env.example .env
```

3. Push Prisma schema to database:

```bash
npm run prisma:push
```

4. Start development server:

```bash
npm run dev
```

## Deploy (Vercel + Free PostgreSQL)

1. Create a free PostgreSQL database:
- Neon (recommended)
- Supabase
- Railway

2. In Vercel project settings, add environment variable:
- DATABASE_URL = your hosted PostgreSQL connection string

3. Ensure build can generate Prisma client:
- postinstall script already runs prisma generate.

4. Apply schema to production database:

```bash
npx prisma db push
```

5. Redeploy your Vercel project.

## Data Model Summary

- Participant
  - name, maxSpins, spinsUsed, hasClaimed, claimedAmount, claimedSpinOrder, isOptional
- Spin
  - participantId, spinOrder, amount, power, flair

## Notes

- Only these names can spin: Ifty, Diya, Anaita, Ornoba, Raisa, Elma, Prerona, Purnota, Towhid, Ratul (optional).
- Each player can spin up to 3 times.
- Player can claim any of their available spins as final Eidi.
