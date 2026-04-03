# Technician CRM

Field-service operations platform for scheduling, dispatch, invoicing, automation, and technician execution workflows.

## Screenshots

- Dashboard (operations summary) - _placeholder_
- Dispatch queue - _placeholder_
- Smart scheduling + apply flow - _placeholder_
- Technician mobile-friendly dashboard - _placeholder_

## Key Features

- Smart scheduling execution with conflict checks and create/reschedule support
- Dispatch queue with reasons, urgency cues, and operational quick actions
- Backend intelligence layer (aggregates, conflict detection, availability helpers)
- Notifications foundation (in-app + email/SMS provider stubs)
- Automation layer (recurring jobs, reminders, stale-job alerts, run controls)
- Technician-focused role experience (dashboard, jobs, schedule, status updates)

## Roles

- **Admin**: full system control, settings, automation, invoicing, dispatch
- **Staff**: operational management (jobs, dispatch, scheduling, invoices)
- **Technician**: focused personal workflow (`/technician`, `/technician/jobs`, `/technician/schedule`)

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, React Router, React Query, FullCalendar
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL, Zod
- **Monorepo**: pnpm workspaces

## Monorepo Structure

```text
apps/
  backend/    # API, Prisma schema/migrations, business modules
  frontend/   # React app (admin/staff + technician experiences)
packages/
  types/      # shared type package
```

## Quick Start

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
```

### Database setup

```bash
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm seed
```

### Run locally

```bash
pnpm dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Scripts

### Root

- `pnpm dev` - run frontend + backend together
- `pnpm build` - build all workspaces
- `pnpm lint` - run workspace lint/typecheck scripts
- `pnpm typecheck` - alias of lint/typecheck pass
- `pnpm seed` - run backend seed
- `pnpm prisma:migrate:dev` - local migration workflow
- `pnpm prisma:migrate:deploy` - production migration command

### Backend

- `pnpm --filter @cipherloom/backend dev`
- `pnpm --filter @cipherloom/backend build`
- `pnpm --filter @cipherloom/backend start`
- `pnpm --filter @cipherloom/backend typecheck`
- `pnpm --filter @cipherloom/backend prisma:generate`
- `pnpm --filter @cipherloom/backend prisma:migrate`
- `pnpm --filter @cipherloom/backend prisma:migrate:deploy`
- `pnpm --filter @cipherloom/backend prisma:seed`

### Frontend

- `pnpm --filter @cipherloom/frontend dev`
- `pnpm --filter @cipherloom/frontend build`
- `pnpm --filter @cipherloom/frontend preview`
- `pnpm --filter @cipherloom/frontend typecheck`

## Environment Variables

### Backend (`apps/backend/.env`)

Start from `apps/backend/.env.example`.

Required core values:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ALLOWED_ORIGINS`

Security/ops flags:

- `ENABLE_DEV_TEST_ENDPOINTS` (keep `false` in production)
- `ENABLE_MANUAL_AUTOMATION_RUN` (keep `false` in production unless explicitly intended)
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_SENSITIVE_MAX`

### Frontend (`apps/frontend/.env.local`)

- `VITE_API_BASE_URL` (set explicitly for production frontend builds)

## Health and Ops Endpoints

- `GET /api/health` - liveness
- `GET /api/health/ready` - readiness (includes DB check)

## Deployment Overview

### Backend (Railway/Render/Fly/VM)

1. Set backend env vars
2. Run:
   - `pnpm --filter @cipherloom/backend prisma:generate`
   - `pnpm --filter @cipherloom/backend prisma:migrate:deploy`
   - `pnpm --filter @cipherloom/backend build`
3. Start with:
   - `pnpm --filter @cipherloom/backend start`

### Frontend (Vercel/Netlify/static hosting)

1. Set `VITE_API_BASE_URL` to public backend URL
2. Build:
   - `pnpm --filter @cipherloom/frontend build`
3. Deploy `apps/frontend/dist`
4. Ensure SPA fallback rewrites to `index.html`

## Team Collaboration

- Use feature branches + pull requests
- CI runs typecheck/build checks on push and PR
- Keep Prisma migration files committed

## Demo Credentials (Development Only)

- Seed includes local demo users for product walkthroughs
- Do not use demo credentials in production environments

## What Makes This Project Stand Out

- End-to-end operational workflows across scheduling, dispatch, notifications, and automation
- Strong role-aware UX (including dedicated technician experience)
- Backend-first intelligence and extensible architecture for future optimization/AI-assist features

## Roadmap

- Route/travel optimization
- Advanced dispatch approval workflows
- Technician mobile app packaging and offline support
- Observability integrations (Sentry/Datadog)

## License

License selection pending. Add an explicit license before public open-source distribution.
