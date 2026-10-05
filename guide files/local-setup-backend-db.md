# Local setup — backend, database, and events assets

**Start here** for developers and AI agents bringing up Wed Flow locally.

Related: [deploy-backend.md](./deploy-backend.md) · [deploy-frontend.md](./deploy-frontend.md) · [creating-event-templates.md](./creating-event-templates.md) · [couples-scripts-and-media.md](./couples-scripts-and-media.md)

---

## Mental model

1. Shared **`/login`** — admin vs client is decided by credentials (file-based ADMIN vs DB `users` with role `COUPLE`).
2. **Admin** provisions wedding / corporate / party events (creates client user + `events` row + resource pack).
3. Schema is bootstrapped on startup / via `npm run db:sync` — **no SQL dump in-repo**.
4. Assets live under **`backend/events/`**: shared template **chrome** + per-event **resource packs**.

---

## 1. Prerequisites

- Node.js **18+** (20+ recommended for frontend)
- MySQL **8**
- Clone this repo

---

## 2. Backend install and env

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with **local** values (do not paste production secrets into chat or commits):

| Variable | Required | Local example | Notes |
|----------|----------|---------------|--------|
| `PORT` | Yes | `4000` | API listen port |
| `DB_HOST` | Yes | `localhost` | |
| `DB_PORT` | Yes | `3306` | |
| `DB_NAME` | Yes | `wedflow` | Empty DB you create below |
| `DB_USER` | Yes | `root` | |
| `DB_PASSWORD` | Yes | *(your local password)* | |
| `DB_DIALECT` | Yes | `mysql` | |
| `JWT_ACCESS_SECRET` | Yes | long random string | |
| `JWT_REFRESH_SECRET` | Yes | long random string | |
| `JWT_ACCESS_EXPIRES_IN` | No | `7d` | |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | |
| `SALT_ROUNDS` | No | `10` | |
| `FRONTEND_ORIGIN` | Recommended | `http://localhost:3000` | CORS allowlist |

Startup fails if `PORT`, `DB_*`, or JWT secrets are missing (`src/index.js` → `requireEnv`).

---

## 3. Admin credentials

Admin login is **file-based**, not a DB user.

```bash
cp admin-credentials.example.txt admin-credentials.txt
```

Edit `admin-credentials.txt` (gitignored):

```text
email=admin@wedflow.local
password=AdminPass123!
```

Use a strong password locally. The shared frontend `/login` matches these credentials → role `ADMIN` → admin dashboard.

---

## 4. Database

1. Create an **empty** MySQL database matching `DB_NAME` (e.g. `CREATE DATABASE wedflow;`).
2. There is **no** full SQL dump in the repo.
3. Bootstrap schema:

```bash
cd backend
npm run db:sync
```

This creates core tables (`users`, `weddings`, `invitations`, `guests`, `schedule_events`, `rsvps`, …) and runs [`ensureSchema.js`](../backend/src/bootstrap/ensureSchema.js) patches:

- `events` (+ `user_id`, `resource_pack_id`, `template_config`, `event_id` links on related tables)
- RSVP change-request tables
- notifications, schedule / invitation column patches, etc.

On every `npm run dev` / `npm start`, the API also runs `sequelize.sync()` + `ensureCoreSchema()` so missing patches are applied safely. For a **brand-new empty DB**, run `npm run db:sync` once first so base tables exist.

---

## 5. Disk layout — events assets

```text
backend/events/{weddings|corporate-events|parties}/
  templates/<templateKey>/manifest.json
  templates/<templateKey>/chrome/**          # shared design art (UI chrome)
  resources/<packId>/{video,music,images,background,documents}/
backend/assets/...                           # legacy wedding slug media (optional)
```

| Kind | Purpose |
|------|---------|
| **Template + chrome** | Shared layout schema + design images/icons for that template key |
| **Resource pack** | Per-event uploads; `packId` usually equals the event UUID |
| **`backend/assets/`** | Legacy couple-slug video / images / music — not for new admin events |

URL helpers live in `backend/src/utils/eventTemplates.js` (`publicChromeUrl`, pack paths). Static serving:

- `/assets/*` → `backend/assets/` (legacy)
- `/assets/events/*` → `backend/events/` (packs + chrome)

Frontend rewrites `/assets/events/*` to the API (`frontend/next.config.mjs`).

---

## 6. Run backend

```bash
cd backend
npm run dev
```

Expect:

```text
DB connection OK
Schema sync OK
API listening on :4000
```

Health:

```bash
curl http://localhost:4000/api/health
```

---

## 7. Run frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local` if needed:

```text
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
npm run dev
```

Open `http://localhost:3000` → `/login`.

| Who | Credentials | Lands on |
|-----|-------------|----------|
| Admin | `admin-credentials.txt` | `/admin/dashboard`, `/admin/events` |
| Client | email/password from Admin → User credentials | Couple dashboard (`/dashboard`, …) |

---

## 8. First event smoke path

1. Log in as **admin**.
2. **Events → Add event** — pick wedding / corporate / party, template, client email.
3. Note generated client password (User credentials).
4. Open **Template** modal — edit fields; upload one resource into the pack.
5. **View guest view** (admin guest-preview) or create a guest and open `/i/[token]`.
6. Log out; log in as the **client** with returned credentials; confirm dashboard loads.

---

## 9. Smoke checklist (agents)

```text
[ ] GET /api/health → ok
[ ] Admin login works (admin-credentials.txt present)
[ ] Admin dashboard + Events list load
[ ] Create wedding OR party OR corporate event
[ ] Template modal opens; upload one media/document into resource pack
[ ] Guest preview or /i/[token] renders the correct invite type
[ ] Client login with provisioned credentials works
[ ] /assets/events/... URLs resolve (not 404)
```

---

## 10. What not to use

- **Disabled** couple npm scripts (`register-couple`, `update-invitation`, `create-schedule`, `update-schedule-template`) — they exit and tell you to use Admin → Create event.
- Do **not** hand-drop media into slug folders under `backend/assets/` for **new** events — use Admin uploads into `backend/events/.../resources/<packId>/`.
- Do **not** document or depend on `backend/temp/` prototypes.

Legacy couple-slug media details (existing weddings only): [couples-scripts-and-media.md](./couples-scripts-and-media.md).
