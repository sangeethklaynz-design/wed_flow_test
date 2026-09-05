# Couples, admin scripts, and invitation media

Audience: developers and AI agents who **onboard couples**, run **backend scripts**, or **add/update invitation video, images, and music**.

Related deploy docs: [deploy-backend.md](./deploy-backend.md) · [deploy-frontend.md](./deploy-frontend.md)

---

## 1. How couples work in Wed Flow

Couples **do not sign up in the UI**. An admin creates accounts with scripts.

What gets created (typical):

| Table / data | Contents |
|--------------|----------|
| `users` | Email + bcrypt password, role `COUPLE` |
| `weddings` | `couple_names`, `bride_name`, `groom_name`, `wedding_date`, schedule template fields |
| `invitations` | Hotel, poruwa time, notes, maps link, etc. |
| `contacts` + `invitation_contacts` | Up to 2 contacts on the invite |
| `milestones` | “Our Story” timeline items |
| Later | Guests (dashboard), schedule events, notifications, media on disk |

### Name storage vs display

- Registration script stores `couple_names` as **`Groom & Bride`** (used for **asset slug** resolution).
- UI / PDFs often display **bride first** via `formatDisplayCoupleNames` (`bride_name` + `groom_name`, or reverse of stored `couple_names` when those columns are empty).
- **Do not rename** `couple_names` casually — it drives the media folder slug.

### Couple slug (critical for media)

```text
couple_names → lowercase → remove "&" → keep only [a-z0-9]
```

Examples:

| `couple_names` in DB | Slug |
|----------------------|------|
| `Dinelka & Dishmi` | `dinelkadishmi` |
| `Kasun & Hiruni` | `kasunhiruni` |

Code: `backend/src/utils/invitationMedia.js` → `coupleSlugFromNames`.

---

## 2. Admin scripts overview

All commands run from **`backend/`** with a valid `.env` (or Railway env) so DB connects.

| npm script | Script file | Purpose |
|------------|-------------|---------|
| `npm run register-couple -- <file>` | `scripts/register_couple.js` | Create **or update** couple + invitation basics |
| `npm run update-invitation -- <file>` | `scripts/update_couple_invitation.js` | Update invitation / contacts / milestones for existing email |
| `npm run create-schedule -- <file>` | `scripts/create_schedule.js` | Insert (optionally replace) schedule events |
| `npm run update-schedule-template -- <file>` | `scripts/update_schedule_template.js` | Schedule PDF background + typography |

Other utility scripts (no npm alias): `update_wedding_date.js`, `seed_test.js`, smoke_* helpers.

### Input file locations

| Kind | Folder | Git |
|------|--------|-----|
| Couple registration / invitation text | `backend/couple-registrations/` | **Ignored** except `example.txt` (may contain passwords) |
| Schedule events / PDF template text | `backend/schedule-creation/` | Usually committed samples |

To commit a registration file intentionally:

```bash
git add -f backend/couple-registrations/my-couple.txt
```

Prefer private repos or temporary passwords if committing.

---

## 3. Adding a new couple

### Step A — Create the registration text file

Copy `backend/couple-registrations/example.txt` → e.g. `dinelkadishmi.txt`.

**Required fields**

```text
bride_name=Dishmi
groom_name=Dinelka
email=couple@example.com
wedding_date=2026-10-16
password=SecurePass123!
```

- `wedding_date`: `YYYY-MM-DD`
- `poruwa_time` (optional): `HH:mm` (e.g. `09:30`, not `9.30`)

**Common optional fields**

```text
hotel_name=...
hotel_address=...
google_maps_link=...
poruwa_time=09:30
weather_note=...
parking_note=...
special_text=...
thank_you_note=...

contact1_name=...
contact1_phone=...
contact1_relation=...
contact2_name=...
contact2_phone=...

milestone1_year=2019
milestone1_title=We met
# up to milestone4_*
```

If `email` already exists → script **updates** that couple instead of creating a duplicate.

### Step B — Run registration

**Local**

```bash
cd backend
npm run register-couple -- couple-registrations/dinelkadishmi.txt
```

**Production (Railway backend Console)**

```bash
# cwd should be /app (backend root)
npm run register-couple -- couple-registrations/dinelkadishmi.txt
```

Success output includes login email, password (if set), wedding id, invitation id.

### Step C — Add media (see sections 5–7)

Without media folders, the couple can still log in and manage guests; guest invite may lack video / photos / music.

### Step D — Optional schedule

1. Create `schedule-creation/<slug>-schedule.txt` with `email=` + event lines.
2. `npm run create-schedule -- schedule-creation/<slug>-schedule.txt`
3. Optionally `npm run update-schedule-template -- schedule-creation/<slug>-template.txt`

### Agent checklist — new couple

```text
1. Write couple-registrations/<slug>.txt (required fields + password)
2. Compute slug from "Groom & Bride" storage order → e.g. dinelkadishmi
3. register-couple against target DB (local or Railway shell)
4. Place video / images / music under assets/.../<slug>/
5. Deploy or ensure assets are on the server
6. Open invite preview once to sync video URL into DB
7. Share email + password with couple; rotate password if file was in git
```

---

## 4. Updating an existing couple

| Goal | How |
|------|-----|
| Change password / names / date / hotel / milestones | Edit registration `.txt`, re-run `register-couple` (same email → update) |
| Invitation text / contacts only | `npm run update-invitation -- couple-registrations/<file>.txt` |
| Wedding date only | `node scripts/update_wedding_date.js <email> <YYYY-MM-DD>` |
| Schedule events | `create-schedule` with `replace_existing=true` if replacing |
| Schedule PDF look | `update-schedule-template` |
| Video / photos / music | Replace files on disk (sections below), redeploy if needed |

---

## 5. Invitation opening video

### Path

```text
backend/assets/invitation_video/<slug>/<any-name>.mp4
```

Example:

```text
backend/assets/invitation_video/dinelkadishmi/dinelka_dishmi.mp4
```

Supported: `.mp4`, `.webm`, `.mov`, `.m4v`

### Resolution rules

1. Build slug from `weddings.couple_names`.
2. Open `assets/invitation_video/<slug>/`.
3. If multiple videos → pick **newest by file modified time**.
4. Prefer **one** video per folder to avoid confusion.
5. Public URL: `/assets/invitation_video/<slug>/<file>` (frontend prefixes API base URL).

On invitation template load, backend may sync `invitations.opening_video_url` to the disk URL.

### Add / update video

1. Put the file in the correct slug folder.
2. Remove obsolete videos in that folder (recommended).
3. Commit + push (production) **or** copy onto the server / volume.
4. Redeploy backend if using git-based assets.
5. Hard-refresh the invite (new filename helps cache busting).
6. Open invite once so DB URL updates if the filename changed.

### Wrong video after deploy?

- Confirm only the intended file is in the slug folder.
- Confirm slug matches DB `couple_names` (not display bride-first string alone).
- Bust CDN/browser cache; verify Network tab URL.
- Git “100% rename” means content unchanged — replace bytes if you need a different clip.

---

## 6. Couple journey images (“Our Journey”)

### Path

```text
backend/assets/couple_images/<slug>/<file>.jpg|png|webp|...
```

Supported: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`

### Resolution rules

- Same slug as video.
- Files sorted **alphabetically** by filename → use names like `01.jpg`, `02.jpg` for order.
- Synced into `couple_images` table when the invitation template is loaded.

### Add / update images

1. Add/replace files in `couple_images/<slug>/`.
2. Deploy / sync to server.
3. Reload invitation preview or guest page to refresh DB rows.

---

## 7. Invitation background music

### Path

```text
backend/assets/couple_music/<slug>/<file>.mp3
```

Example:

```text
backend/assets/couple_music/dinelkadishmi/dinelkadishmi_music.mp3
```

Supported: `.mp3`, `.m4a`, `.aac`, `.ogg`, `.wav`

**Do not** put music under `invitation_video/` — that folder is for video only.

### Behaviour (frontend)

- API returns `static.music: { url, hasMusic }`.
- Music starts **after** the opening video ends (or after skip).
- Playback **loops** while the invitation experience is open.
- Browsers may require a prior user gesture (video “tap to play” usually unlocks audio).

### Add / update music

1. Place one (or newest) file in `couple_music/<slug>/`.
2. Deploy / sync assets.
3. Test: play intro video → after fade, music should loop.

---

## 8. Other assets (schedule PDF)

| Asset | Location |
|-------|----------|
| Default / shared schedule backgrounds | `backend/assets/schedule-templates/` |
| Per-couple schedule background (template script) | Often `backend/assets/<slug>/` or as documented in template `.txt` |
| Custom fonts for PDF | `backend/assets/fonts/` |

Schedule PDF couple names use bride-first display helpers when generating the download.

---

## 9. Schedule scripts (quick reference)

### Events file

```text
email=couple@example.com
replace_existing=true

09:00|09:45|Guest Arrival|
09:45|10:30|Poruwa Ceremony|
```

```bash
npm run create-schedule -- schedule-creation/my-couple-schedule.txt
```

### PDF template file

```text
email=couple@example.com
background_image=my-bg.png
# optional font / size keys — see kasunihiruni-template.txt
```

```bash
npm run update-schedule-template -- schedule-creation/my-couple-template.txt
```

---

## 10. End-to-end flow (agents)

```text
NEW COUPLE
  ├─ Write couple-registrations/<name>.txt
  ├─ npm run register-couple -- …
  ├─ assets/invitation_video/<slug>/video.mp4
  ├─ assets/couple_images/<slug>/*.jpg
  ├─ assets/couple_music/<slug>/music.mp3
  ├─ git push / Railway deploy (if prod)
  ├─ optional: create-schedule + update-schedule-template
  └─ Smoke: login + /invite preview + guest /i/<token>

UPDATE VIDEO ONLY
  ├─ Replace file in invitation_video/<slug>/
  ├─ Prefer unique filename to bust caches
  ├─ Push + deploy
  └─ Open invite once

UPDATE MUSIC ONLY
  ├─ Replace file in couple_music/<slug>/
  ├─ Push + deploy
  └─ Watch video end → music loops
```

---

## 11. Troubleshooting

| Issue | Check |
|-------|--------|
| `File not found` on register | Path relative to `backend/` cwd |
| Couple login fails | Email/password from script output; correct DB (local vs prod) |
| Video missing | Slug folder name; file extension; `/assets/...` reachable |
| Music never plays | File under `couple_music` not `invitation_video`; autoplay after video gesture |
| Images wrong order | Rename for alphabetical sort |
| Script updates wrong couple | `email=` must match `users.email` |
| Git ignore blocked registration file | `git add -f` or paste file on Railway shell |

---

## 12. Security notes

- Registration files often contain **plaintext passwords** — gitignore exists for a reason.
- Prefer temporary passwords + couple change-after-first-login for production.
- Do not paste production DB passwords into chat logs or public issues.
- Railway Console is preferred over exposing MySQL publicly.
