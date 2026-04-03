# Backend (`@cipherloom/backend`)

Express + Prisma API for Technician CRM.

## Common commands

```bash
pnpm --filter @cipherloom/backend dev
pnpm --filter @cipherloom/backend typecheck
pnpm --filter @cipherloom/backend build
pnpm --filter @cipherloom/backend start
```

## Prisma workflow

```bash
pnpm --filter @cipherloom/backend prisma:generate
pnpm --filter @cipherloom/backend prisma:migrate
pnpm --filter @cipherloom/backend prisma:migrate:deploy
pnpm --filter @cipherloom/backend prisma:seed
```

## Health endpoints

- `/api/health`
- `/api/health/ready`

## Notes

- Keep `ENABLE_DEV_TEST_ENDPOINTS=false` in production.
- Keep `ENABLE_MANUAL_AUTOMATION_RUN=false` in production unless intentionally required.
