# Frontend (`@cipherloom/frontend`)

React + Vite application for Technician CRM (admin/staff + technician views).

## Common commands

```bash
pnpm --filter @cipherloom/frontend dev
pnpm --filter @cipherloom/frontend typecheck
pnpm --filter @cipherloom/frontend build
pnpm --filter @cipherloom/frontend preview
```

## Environment

Set `VITE_API_BASE_URL` in `.env.local` for local/hosted environments.

## Deployment note

If hosted as a static SPA, configure route fallback rewrites to `index.html`.
