# Frontend deployment guide

Audience: developers and AI agents deploying or running the **Next.js** app in `frontend/`.

## Stack

- Next.js 16 (App Router), React 19, Tailwind CSS 4
- Default local URL: `http://localhost:3000`
- Talks to backend via `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`)
- Public guest invite links use `NEXT_PUBLIC_APP_URL` for share URLs (default `http://localhost:3000`)

## Prerequisites

- Node.js 18+ (20+ recommended)
- A running backend API (see [deploy-backend.md](./deploy-backend.md))
- For production: Vercel project (or equivalent Node host)

## Environment variables

Create `frontend/.env.local` for local work (do not commit secrets).

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Yes (prod) | `https://your-api.up.railway.app` | Backend base URL (no trailing slash) |
| `NEXT_PUBLIC_APP_URL` | Recommended (prod) | `https://wed-flow-test.vercel.app` | Public site URL for guest invite share links |

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
| `/login` | Couple login |
| `/dashboard`, `/invite`, `/guests`, `/schedule`, `/notifications` | Authenticated couple UI |
| `/invitation` | Couple invitation preview |
| `/i/[token]` | Public guest invitation |

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (`next dev --webpack`) |
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
2. Browser Network tab: login `POST` goes to `NEXT_PUBLIC_API_URL/api/auth/login`.
3. Invitation media requests go to `NEXT_PUBLIC_API_URL/assets/...`.
4. Guest share links use `NEXT_PUBLIC_APP_URL/i/<token>`.

## Next.js image remote hosts

`frontend/next.config.mjs` allows `localhost:4000` and `127.0.0.1:4000` for `/assets/**`.

If you use `next/image` with production Railway asset URLs, add a `remotePatterns` entry for that hostname, for example:

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
| API calls hit localhost in production | Forgot `NEXT_PUBLIC_API_URL` or didn’t redeploy | Set var + redeploy |
| Guest share links point to localhost | Missing `NEXT_PUBLIC_APP_URL` | Set to public frontend URL + redeploy |
| 404 on `/i/...` | Wrong deploy root or rewrite | Ensure Vercel root is `frontend` |

## Agent summary — deploy frontend

```text
1. Root directory = frontend
2. Set NEXT_PUBLIC_API_URL + NEXT_PUBLIC_APP_URL
3. Ensure backend FRONTEND_ORIGIN includes this site
4. npm run build must succeed
5. Smoke-test /login and one guest invite URL
```
