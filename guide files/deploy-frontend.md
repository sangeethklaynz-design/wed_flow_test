# Frontend deployment guide

Audience: developers and AI agents deploying or running the **Next.js** app in `frontend/`.

Local full-stack setup: [local-setup-backend-db.md](./local-setup-backend-db.md) · Backend deploy: [deploy-backend.md](./deploy-backend.md).

## Stack

- Next.js (App Router), React, Tailwind CSS
- Default local URL: `http://localhost:3000`
- Talks to backend via `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`)
- Public guest invite links use `NEXT_PUBLIC_APP_URL` for share URLs (default `http://localhost:3000`)
- Rewrites `/assets/events/*` → `${NEXT_PUBLIC_API_URL}/assets/events/*` so chrome + resource packs load same-origin in the browser

## Prerequisites

- Node.js 18+ (20+ recommended)
- A running backend API (see [deploy-backend.md](./deploy-backend.md) / local-setup guide)
- For production: Vercel project (or equivalent Node host)

## Environment variables

Create `frontend/.env.local` for local work (do not commit secrets).

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Yes (prod) | `https://your-api.up.railway.app` | Backend base URL (no trailing slash) |
| `NEXT_PUBLIC_APP_URL` | Recommended (prod) | `https://your-app.vercel.app` | Public site URL for guest invite share links |

Local defaults if unset:

- API → `http://localhost:4000`
- App → `http://localhost:3000`

### Agent checklist — env

1. Confirm backend is reachable at the URL you set.
2. Use **HTTPS** production API URL in Vercel.
3. After changing `NEXT_PUBLIC_*` vars on Vercel, **redeploy** (they are baked in at build time).

## Local development

From repo root:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` — root redirects to `/login`.

Useful routes:

| Route | Who |
|-------|-----|
| `/login` | Shared portal — admin **or** client by credentials |
| `/admin/dashboard`, `/admin/events` | Authenticated **admin** |
| `/admin/events/[id]/guest-preview` | Admin guest-preview (dummy guest, no RSVP writes) |
| `/dashboard`, `/invite`, `/guests`, `/schedule`, `/notifications` | Authenticated **client** (wedding / corporate / party) |
| `/invitation` | Client invitation preview |
| `/i/[token]` | Public guest invitation (`InviteByType` by event type) |

Invitation UI for each type:

- Wedding → existing invite experience
- Corporate → `components/invite/corporate/template-1/`
- Party → `components/invite/party/template-1/`

Renderer entry: `frontend/lib/inviteRenderer.js`. Templates / manifests: [creating-event-templates.md](./creating-event-templates.md).

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

## Production — Vercel (recommended)

Current product setup: frontend on Vercel, backend on Railway.

### 1. Create / link project

1. Import the GitHub repo into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework: Next.js (auto-detected).
4. Build command: `npm run build` (default).
5. Output: Next.js default (no static export required).

### 2. Configure environment

In Vercel → Project → Settings → Environment Variables:

```text
NEXT_PUBLIC_API_URL=https://<your-railway-backend-host>
NEXT_PUBLIC_APP_URL=https://<your-vercel-domain>
```

Apply to Production (and Preview if preview builds should hit the same API).

### 3. Backend CORS must allow this origin

On the backend, set:

```text
FRONTEND_ORIGIN=https://your-frontend.vercel.app
```

Comma-separated list is supported. Preview deployments of the same Vercel project are often allowed automatically when the production Vercel URL is listed (see backend CORS helper).

### 4. Deploy

Push to the connected branch (usually `main`), or trigger Deploy in Vercel.

### 5. Verify

1. Open the Vercel URL → `/login` loads.
2. Admin login (server `admin-credentials.txt`) → `/admin/events`.
3. Client login → dashboard for that event type.
4. Browser Network: login `POST` goes to `NEXT_PUBLIC_API_URL/api/auth/login`.
5. Invitation media: `/assets/events/...` rewrite hits the API; legacy `/assets/...` may still go via absolute API URLs.
6. Guest share links use `NEXT_PUBLIC_APP_URL/i/<token>`.

## Next.js image remote hosts

`frontend/next.config.mjs` allows localhost and the production API host for `/assets/**`, plus a rewrite for `/assets/events/:path*`.

If you use `next/image` with a new production API hostname, add a `remotePatterns` entry:

```js
{
  protocol: "https",
  hostname: "your-api.up.railway.app",
  pathname: "/assets/**",
}
```

Many invitation media paths use plain `<img>` / video / audio with absolute API URLs via `resolveMediaUrl`, but keep this in mind if you expand `next/image` usage.

## Common failures

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Login fails / CORS error | `FRONTEND_ORIGIN` missing backend allowlist | Add Vercel origin to backend env and restart |
| Admin login fails | Backend missing `admin-credentials.txt` | Place file on API host |
| API calls hit localhost in production | Forgot `NEXT_PUBLIC_API_URL` or didn’t redeploy | Set var + redeploy |
| Guest share links point to localhost | Missing `NEXT_PUBLIC_APP_URL` | Set to public frontend URL + redeploy |
| Chrome / pack 404 | Rewrite or API `events/` missing | Confirm `next.config.mjs` rewrite + backend serves `/assets/events` |
| 404 on `/i/...` or `/admin/...` | Wrong deploy root | Ensure Vercel root is `frontend` |

## Agent summary — deploy frontend

```text
1. Root directory = frontend
2. Set NEXT_PUBLIC_API_URL + NEXT_PUBLIC_APP_URL
3. Ensure backend FRONTEND_ORIGIN includes this site
4. npm run build must succeed
5. Smoke-test /login (admin + client) and one guest invite URL
```
