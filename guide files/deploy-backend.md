# Backend deployment guide

Audience: developers and AI agents deploying or running the **Express + MySQL** API in `backend/`.

For full local bring-up (admin credentials, `db:sync`, events layout), prefer **[local-setup-backend-db.md](./local-setup-backend-db.md)**.

## Stack

- Node.js (CommonJS), Express, Sequelize connection + raw SQL, MySQL 8
- Default local port: `4000`
- Static media:
  - `backend/assets` → `/assets/*` (legacy couple-slug media)
  - `backend/events` → `/assets/events/*` (template chrome + resource packs)
- Schema patches on startup via `src/bootstrap/ensureSchema.js`
- Admin login via `backend/admin-credentials.txt` (gitignored; see example file)

## Prerequisites

- Node.js 18+
- MySQL 8 (local or managed — e.g. Railway MySQL)
- For production: Railway (or similar) with persistent deploy of the `backend` folder **including `events/`**

## Required environment variables

Copy `backend/.env.example` → `backend/.env` for local use. **Never commit `.env`.** Use placeholders — do not paste production secrets into docs or chat.

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `PORT` | Yes | `4000` (local) / host sets this | HTTP listen port |
| `DB_HOST` | Yes | `localhost` / Railway `MYSQLHOST` | MySQL host |
| `DB_PORT` | Yes | `3306` | MySQL port |
| `DB_NAME` | Yes | `wedflow` | Database name |
| `DB_USER` | Yes | `root` | DB user |
| `DB_PASSWORD` | Yes | *(secret)* | DB password |
| `DB_DIALECT` | Yes | `mysql` | Sequelize dialect |
| `JWT_ACCESS_SECRET` | Yes | long random string | Access token signing |
| `JWT_REFRESH_SECRET` | Yes | long random string | Refresh token signing |
| `JWT_ACCESS_EXPIRES_IN` | No | `7d` | Access TTL |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh TTL |
| `SALT_ROUNDS` | No | `10` | bcrypt rounds |
| `FRONTEND_ORIGIN` | Strongly recommended (prod) | `http://localhost:3000,https://app.vercel.app` | CORS allowlist (comma-separated) |

Startup **fails** if any of the `requireEnv` keys in `src/index.js` are missing (`PORT`, `DB_*`, JWT secrets).

### Admin credentials on the server

On each backend host, place:

```text
backend/admin-credentials.txt
```

(copy from `admin-credentials.example.txt`). Without this file, ADMIN login on `/login` will not work. Keep it out of git; inject via secret store / volume / deploy step.

### Mapping Railway MySQL → app env

Railway MySQL often exposes `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`. Map them to:

```text
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_DIALECT=mysql
```

(Exact reference syntax depends on Railway service variable linking.)

## Local development

See [local-setup-backend-db.md](./local-setup-backend-db.md) for the full checklist. Short version:

1. Create empty MySQL database (e.g. `wedflow`).
2. Configure `backend/.env` + `admin-credentials.txt`.
3. `npm install` → `npm run db:sync` (first empty DB) → `npm run dev`.

```bash
cd backend
npm install
npm run db:sync
npm run dev
```

Health check:

```bash
curl http://localhost:4000/api/health
```

Expect JSON like `{ "ok": true, "ts": ... }`.

On startup you should see:

```text
DB connection OK
Schema sync OK
API listening on :4000
```

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Nodemon (`src/index.js`) |
| `npm start` | Production entry (`server.js` → `src/index.js`) |
| `npm run db:sync` | Create base tables + run `ensureCoreSchema` |
| `npm run register-couple` etc. | **Disabled** — use Admin → Create event |

Provisioning / media: [couples-scripts-and-media.md](./couples-scripts-and-media.md).

## API surface (high level)

| Prefix | Auth | Purpose |
|--------|------|---------|
| `GET /api/health` | No | Health |
| `/api/auth/*` | Mixed | Login (admin file or client JWT), refresh, me |
| `/api/admin/*` | Admin JWT | Events catalogue, templates, resource uploads |
| `/api/couple/*` | Bearer JWT | Dashboard, guests, schedule, notifications, invitation template |
| `/api/public/*` | Token in path | Guest invite + RSVP |
| `/assets/*` | No | Legacy static media |
| `/assets/events/*` | No | Event packs + template chrome |

## Production — Railway (recommended)

Current product setup: backend + MySQL on Railway; frontend on Vercel.

### 1. Services

Create a Railway project with:

1. **MySQL** plugin/service (+ volume if offered).
2. **Web service** from the GitHub repo.

### 2. Web service settings

| Setting | Value |
|---------|-------|
| Root / watch directory | `backend` |
| Install | `npm install` |
| Start | `npm start` (or `node server.js`) |
| Node version | 18+ |

No separate Dockerfile is required in-repo; Nixpacks/Railpack can detect Node from `package.json`.

### 3. Environment variables

Set all required vars on the web service (see table above). Link MySQL variables. Generate strong JWT secrets.

Also set:

```text
FRONTEND_ORIGIN=https://your-frontend.vercel.app
NODE_ENV=production
```

### 4. Assets on deploy

Include **both** trees in the deploy artifact or mounted volumes:

```text
backend/events/     # templates/*/chrome + resources/<packId>/  (required for admin events)
backend/assets/     # legacy slug media, fonts, schedule backgrounds
```

They are served from the container filesystem. For production:

- **Commit chrome + known packs into git**, and/or
- Attach a **Railway volume** over `events/` (and optionally `assets/`) so admin uploads survive redeploys.

Ephemeral containers lose uncommitted uploads on redeploy.

### 5. Provision clients against production

After deploy:

1. Ensure `admin-credentials.txt` is on the service.
2. Open the frontend → `/login` as admin.
3. **Admin → Events → Add event** (do not use disabled `register-couple`).

Optional: first boot on empty MySQL — run `npm run db:sync` once in the backend shell if base tables are missing.

### 6. Verify

1. `GET https://<api-host>/api/health` → ok.
2. `GET https://<api-host>/assets/events/...` for a known chrome or pack path.
3. Admin + client login against this API succeed.
4. CORS: browser console has no blocked origin errors.

## Database notes

- App uses **raw SQL** via Sequelize connection (not heavy ORM models).
- `ensureCoreSchema()` adds missing columns/tables safely on boot (`events`, RSVP change requests, notifications, schedule columns, etc.).
- There is **no** full SQL dump in-repo. For an empty database, run **`npm run db:sync`** once to create core tables (`users`, `weddings`, `invitations`, `guests`, …) plus patches; thereafter startup `ensureCoreSchema()` keeps schema current.

## Common failures

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Missing required env vars` | Incomplete host vars | Set all `requireEnv` keys |
| `DB connection` error | Wrong host/password or private-only host | Use linked MySQL vars |
| CORS blocked | `FRONTEND_ORIGIN` wrong | Add exact frontend origin(s) |
| Admin login fails | Missing `admin-credentials.txt` on server | Deploy/create the file |
| Media 404 (new events) | Pack/chrome not on disk / wrong path | Ensure `events/` in image or volume; URLs under `/assets/events/` |
| Legacy media 404 | Missing slug folder under `assets/` | Commit or volume `assets/.../<slug>/` |
| `table doesn't exist` | Empty DB never synced | `npm run db:sync` then restart |

## Agent summary — deploy backend

```text
1. Root directory = backend
2. Link MySQL → DB_* vars + JWT secrets + FRONTEND_ORIGIN
3. Place admin-credentials.txt on the host
4. Start = npm start; empty DB → npm run db:sync once
5. Ensure events/ (+ assets/ if legacy) are in the deployed tree / volume
6. Health check /api/health; provision clients via Admin UI
```
