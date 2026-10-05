# Wed Flow — Guide Files

These guides are for **human developers** and **AI agents** setting up, deploying, and operating Wed Flow.

## Start here

→ **[local-setup-backend-db.md](./local-setup-backend-db.md)** — local backend, MySQL bootstrap, admin credentials, and `backend/events` layout.

## Repository layout

```
wedflow_phase2/
├── frontend/          # Next.js — shared /login, admin UI, client dashboard, public invites
├── backend/           # Express API + MySQL + events assets (+ legacy /assets)
└── guide files/       # ← you are here
```

## Guides in this folder

| File | Purpose |
|------|---------|
| [local-setup-backend-db.md](./local-setup-backend-db.md) | **Primary** local setup: DB, admin file, events disk layout, smoke checklist |
| [deploy-frontend.md](./deploy-frontend.md) | Local + Vercel deploy for the Next.js frontend |
| [deploy-backend.md](./deploy-backend.md) | Local + Railway (or similar) deploy for the Express API / MySQL |
| [creating-event-templates.md](./creating-event-templates.md) | Add wedding / corporate / party invitation templates (manifest + chrome + React) |
| [couples-scripts-and-media.md](./couples-scripts-and-media.md) | Admin-first client provisioning; legacy couple scripts / slug media |

## Quick mental model

1. **Frontend** talks to the API via `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`).
2. **Backend** serves JSON under `/api/*`, legacy media under `/assets/*`, and event packs/chrome under `/assets/events/*`.
3. **Shared `/login`** — admin credentials file vs client (`COUPLE`) users in MySQL.
4. **Admin** provisions wedding / corporate / party events (creates client + `events` row + resource pack). Clients do not self-register.
5. **Invitation media for new events** lives under `backend/events/<type>/resources/<packId>/`; shared design art under `templates/<templateKey>/chrome/`.

## Typical production stack (current)

- Frontend: **Vercel** (root directory = `frontend`)
- Backend + MySQL: **Railway** (service root = `backend`)
- Source: GitHub (`main` or release branches)

Always configure CORS (`FRONTEND_ORIGIN`) on the backend to include the deployed frontend origin(s). Include `backend/events/` in the deploy artifact or volume (not only legacy `backend/assets/`).
