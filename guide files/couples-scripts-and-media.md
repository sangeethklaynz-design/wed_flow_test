# Clients, events, and invitation media

Audience: developers and AI agents who **provision clients**, configure **event media**, or need the **legacy** couple-script / slug-folder paths.

Related: [local-setup-backend-db.md](./local-setup-backend-db.md) · [creating-event-templates.md](./creating-event-templates.md) · [deploy-backend.md](./deploy-backend.md) · [deploy-frontend.md](./deploy-frontend.md)

---

## 1. Admin-first provisioning (current path)

Clients **do not sign up in the UI**. An admin provisions them from **Admin → Events → Add event** (enter client email; password is generated).

What gets created (typical):

| Table / data | Contents |
|--------------|----------|
| `users` | Email + bcrypt password, role `COUPLE` |
| `events` | Catalogue row + `user_id`, `client_slug`, `type`, `template_key`, `resource_pack_id`, `template_config` |
| `weddings` | Linked stub (`event_id`) so existing dashboard APIs keep working |
| `invitations` | Hotel / location stub (clients fill guests & schedule themselves) |
| Later | Guests, schedule events, notifications, media on disk (via admin Template modal / uploads) |

**Credentials:** Admin → Events → Actions → **User credentials** (view email / regenerate password; plaintext shown only once after create/regenerate).

**Shared login:** Frontend `/login` — admin file credentials → admin UI; client email/password → client dashboard. Same portal for all event types.

### Agent checklist — new event / client

```text
1. Ensure backend is up + admin-credentials.txt configured
2. Admin login → Events → Add event (type, template, client email, date, …)
3. Copy generated password from User credentials (once)
4. Actions → Template → set fields; upload video/music/images/background/documents into the resource pack
5. Save template_config
6. Smoke: guest-preview and/or /i/[token]; client login to dashboard
```

Do **not** use the disabled couple npm scripts for new clients.

---

## 2. Where media lives (new events)

```text
backend/events/{weddings|corporate-events|parties}/
  templates/<templateKey>/chrome/**     # shared template design art
  resources/<packId>/
    video/
    music/
    images/
    background/
    documents/
```

| Kind | Who fills it | URL prefix |
|------|--------------|------------|
| Chrome | Developers shipping a template | `/assets/events/<folder>/templates/<key>/chrome/…` |
| Resource pack | Admin uploads (or API) per event | `/assets/events/<folder>/resources/<packId>/<kind>/…` |

`packId` usually matches the event UUID. Filenames referenced in `template_config` resolve against that pack.

Frontend proxies `/assets/events/*` to the API (`next.config.mjs` rewrite).

**Do not** hand-drop media into legacy slug folders under `backend/assets/` for new admin-provisioned events.

---

## 3. Disabled couple scripts

These npm scripts **exit non-zero** and print “use Admin → Create event”. Prefer the admin UI for all new clients.

| npm script | Status |
|------------|--------|
| `npm run register-couple` | Disabled — use Admin → Add event |
| `npm run update-invitation` | Disabled |
| `npm run create-schedule` | Disabled — clients add schedule in the dashboard |
| `npm run update-schedule-template` | Disabled |

Other utility scripts (no npm alias): `update_wedding_date.js`, `seed_test.js`, smoke_* helpers — use only if you know the target environment.

Historical input folders (mostly obsolete for new work):

| Kind | Folder | Git |
|------|--------|-----|
| Couple registration / invitation text | `backend/couple-registrations/` | **Ignored** except `example.txt` |
| Schedule events / PDF template text | `backend/schedule-creation/` | Usually committed samples |

---

## 4. Legacy — couple slug media (`backend/assets/`)

Kept for **existing** weddings that still resolve invitation video / journey images / music from disk folders named by a **couple slug** derived from `weddings.couple_names`. New events should use resource packs (section 2).

### Name storage vs display

- Older registration flow stored `couple_names` as **`Groom & Bride`** (used for **asset slug** resolution).
- UI / PDFs often display **bride first** via `formatDisplayCoupleNames`.
- **Do not rename** `couple_names` casually on legacy weddings — it drives the media folder slug.

### Couple slug

```text
couple_names → lowercase → remove "&" → keep only [a-z0-9]
```

Examples:

| `couple_names` in DB | Slug |
|----------------------|------|
| `Dinelka & Dishmi` | `dinelkadishmi` |
| `Kasun & Hiruni` | `kasunhiruni` |

Code: `backend/src/utils/invitationMedia.js` → `coupleSlugFromNames`.

### Opening video

```text
backend/assets/invitation_video/<slug>/<any-name>.mp4
```

Public URL: `/assets/invitation_video/<slug>/<file>`. Multiple files → newest by mtime. Prefer one video per folder.

### Journey images

```text
backend/assets/couple_images/<slug>/<file>.jpg|png|webp|...
```

Sorted alphabetically by filename.

### Background music

```text
backend/assets/couple_music/<slug>/<file>.mp3
```

Do **not** put music under `invitation_video/`. Playback typically starts after the opening video (user gesture).

### Schedule PDF assets

| Asset | Location |
|-------|----------|
| Default / shared schedule backgrounds | `backend/assets/schedule-templates/` |
| Custom fonts for PDF | `backend/assets/fonts/` |

---

## 5. Legacy script flow (reference only)

If you must understand the old path (scripts are disabled at runtime):

1. Write `couple-registrations/<slug>.txt` with `bride_name`, `groom_name`, `email`, `wedding_date`, `password`, …
2. Historically: `npm run register-couple -- couple-registrations/<file>.txt`
3. Place media under `assets/invitation_video|couple_images|couple_music/<slug>/`
4. Optional schedule text under `schedule-creation/`

**Do not run these scripts for new production clients** — use Admin → Events.

---

## 6. Troubleshooting

| Issue | Check |
|-------|--------|
| Admin login fails | `backend/admin-credentials.txt` exists and matches what you type |
| Client login fails | Email/password from Admin → User credentials; correct DB |
| New event media 404 | File under `events/.../resources/<packId>/`; URL uses `/assets/events/...` |
| Legacy video missing | Slug folder under `assets/invitation_video/`; slug matches `couple_names` |
| Music never plays | Pack `music/` or legacy `couple_music/`; autoplay after video gesture |
| Disabled script exit | Expected — use Admin → Add event |

---

## 7. Security notes

- `admin-credentials.txt` and registration `.txt` files can contain **plaintext passwords** — they are gitignored for a reason.
- Prefer temporary client passwords + rotate after first share for production.
- Do not paste production DB or admin passwords into chat logs or public issues.
- Prefer host shell (e.g. Railway Console) over exposing MySQL publicly.
