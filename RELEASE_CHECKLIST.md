# Release Checklist

## Pre-release verification

- [ ] `pnpm install`
- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] Backend smoke check: `pnpm --filter @cipherloom/backend smoke:health`

## Environment and secrets

- [ ] Production `DATABASE_URL` configured
- [ ] Strong `JWT_SECRET` and `JWT_REFRESH_SECRET` configured
- [ ] `CORS_ALLOWED_ORIGINS` set to production frontend origin(s)
- [ ] `ENABLE_DEV_TEST_ENDPOINTS=false`
- [ ] `ENABLE_MANUAL_AUTOMATION_RUN=false` (unless intentional)

## Database

- [ ] `pnpm --filter @cipherloom/backend prisma:generate`
- [ ] `pnpm --filter @cipherloom/backend prisma:migrate:deploy`
- [ ] Seed run only when explicitly needed in non-production

## Deploy

- [ ] Backend deployed and healthy (`/api/health`, `/api/health/ready`)
- [ ] Frontend built with correct `VITE_API_BASE_URL`
- [ ] SPA rewrite/fallback configured on static host

## Post-deploy checks

- [ ] Login works for Admin/Staff/Technician
- [ ] Dispatch, scheduling, and technician pages load
- [ ] Notifications panel loads and unread count works
- [ ] Automation status endpoints accessible for admins
