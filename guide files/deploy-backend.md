# Backend deployment guide

Audience: developers and AI agents deploying or running the **Express + MySQL** API in `backend/`.

## Stack

- Node.js (CommonJS), Express, Sequelize (raw SQL), MySQL 8
- Default local port: `4000`
- Static media served from `backend/assets` at `/assets/*`
- Schema patches on startup via `src/bootstrap/ensureSchema.js`

## Prerequisites

- Node.js 18+
- MySQL 8 (local or managed — e.g. Railway MySQL)
- For production: Railway (or similar) with persistent deploy of the `backend` folder

## Required environment variables

Copy `backend/.env.example` → `backend/.env` for local use. **Never commit `.env`.**

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `PORT` | Yes | `4000` (local) / Railway sets this | HTTP listen port |
| `DB_HOST` | Yes | `localhost` / Railway `MYSQLHOST` | MySQL host |
| `DB_PORT` | Yes | `3306` | MySQL port |
| `DB_NAME` | Yes | `wedflow` / Railway DB name | Database name |
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

1. Create MySQL database (e.g. `wedflow`).
2. Configure `backend/.env`.
3. Install and run:

```bash
cd backend
npm install
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
| `npm start` | Production `node src/index.js` |
| `npm run register-couple -- <file>` | Create/update couple (see ops guide) |
| `npm run update-invitation -- <file>` | Update invitation fields |
| `npm run create-schedule -- <file>` | Create schedule events |
| `npm run update-schedule-template -- <file>` | Schedule PDF background / styles |

Full script/media docs: [couples-scripts-and-media.md](./couples-scripts-and-media.md).

## API surface (high level)

| Prefix | Auth | Purpose |
|--------|------|---------|
| `GET /api/health` | No | Health |
| `/api/auth/*` | Mixed | Login, refresh, me |
| `/api/couple/*` | Bearer JWT | Dashboard, guests, schedule, notifications, invitation template |
| `/api/public/*` | Token in path | Guest invite + RSVP |
| `/assets/*` | No | Static media (videos, images, music, fonts, schedule backgrounds) |

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
| Start | `npm start` (or `node src/index.js`) |
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

Invitation video, couple images, music, fonts, and schedule backgrounds live under:

```text
backend/assets/
```

They are served from the container filesystem. For production:

- **Commit media into git** (current approach for couple-specific assets), **or**
- Attach a **Railway volume** mounted over `assets/` if files must persist without redeploying.

Ephemeral containers lose uncommitted uploads on redeploy.

### 5. Register couples against production DB

After deploy, use the **backend service Console/Shell** (not the MySQL SQL console):

```bash
# Confirm files exist after deploy
ls couple-registrations/
ls assets/invitation_video/

npm run register-couple -- couple-registrations/<couple>.txt
```

Notes:

- Couple `.txt` files under `couple-registrations/` are **gitignored** except `example.txt`. Force-add if you intentionally commit them, or create the file in the shell.
- Scripts use the service’s `DB_*` env automatically when run inside Railway.

Alternatively, run scripts locally with production `DB_*` pointed at Railway’s **public** MySQL host (if public networking is enabled). Prefer Railway shell when possible.

### 6. Verify

1. `GET https://<api-host>/api/health` → ok.
2. `GET https://<api-host>/assets/...` for a known video/music path.
3. Frontend login against this API succeeds.
4. CORS: browser console has no blocked origin errors.

## Database notes

- App uses **raw SQL** via Sequelize connection (not heavy ORM models).
- `ensureCoreSchema()` adds missing columns/tables safely on boot (notifications, schedule columns, etc.).
- There is **no** full SQL dump in-repo for initial empty DB — first boot + `register_couple` / seeds expect core tables (`users`, `weddings`, `invitations`, `guests`, …) to exist. If starting empty, create baseline schema from an existing environment or run registration after schema is present.

If `register_couple` fails with “table doesn’t exist”, restore/create core tables from a known-good MySQL dump, then restart the API.

## Common failures

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Missing required env vars` | Incomplete Railway vars | Set all `requireEnv` keys |
| `DB connection` error | Wrong host/password or private-only host | Use linked MySQL vars; enable public access only if connecting from laptop |
| CORS blocked | `FRONTEND_ORIGIN` wrong | Add exact Vercel origin(s) |
| Media 404 | File not in deploy image / wrong slug folder | Commit assets under `assets/.../<slug>/` and redeploy |
| `UPDATE: command not found` in Console | Running SQL in bash, not `mysql` | Use MySQL Data tab or `mysql` client |

## Agent summary — deploy backend

```text
1. Root directory = backend
2. Link MySQL → DB_* vars + JWT secrets + FRONTEND_ORIGIN
3. Start = npm start
4. Ensure assets/ is in the deployed tree
5. Health check /api/health
6. Register couples via Railway shell with register-couple
```
