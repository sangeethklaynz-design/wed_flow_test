# Creating event invitation templates

Guide for developers (and AI agents) adding a **new invitation template** so the admin interface can discover it and the invite UI can render it.

Reference implementations already ship as **`template-1`** for:

| Type | Backend manifest | Frontend React |
|------|------------------|----------------|
| Wedding | `backend/events/weddings/templates/template-1/` | `frontend/components/invite/InvitationPage.jsx` (+ experience shell) |
| Corporate | `backend/events/corporate-events/templates/template-1/` | `frontend/components/invite/corporate/template-1/` |
| Party | `backend/events/parties/templates/template-1/` | `frontend/components/invite/party/template-1/` |

Guest/admin preview selects the renderer via [`frontend/lib/inviteRenderer.js`](../frontend/lib/inviteRenderer.js) (`InviteByType`).

---

## Mental model

| Concept | What it is | Where it lives |
|--------|------------|----------------|
| **Template** | Layout schema + editable fields (pages, colors, lists, media refs) | `backend/events/<typeFolder>/templates/<templateKey>/` |
| **Chrome** | Shared design art for that template (icons, page frames, backgrounds used by all events on this template) | `…/templates/<templateKey>/chrome/**` |
| **Resource pack** | Per-event media files (video, music, images, background, documents) | `backend/events/<typeFolder>/resources/<packId>/` |
| **Event row** | DB record: `template_key`, `resource_pack_id`, `template_config` | MySQL `events` table |

- **Template** = structure and admin editors.
- **Chrome** = design assets shared by every event using that template key (URL helper: `publicChromeUrl` in `eventTemplates.js`).
- **Resource pack** = uploaded files for one event.
- **`template_config`** = saved page toggles + field values (filenames, RSVP questions, detail nodes, etc.).

Type → folder map (`backend/src/utils/eventTemplates.js`):

| Event type | Folder |
|------------|--------|
| `wedding` | `weddings` |
| `corporate` | `corporate-events` |
| `party` | `parties` |

Admin lists templates by **scanning directories** under `templates/`. The folder name **is** the `templateKey` stored on the event.

---

## Checklist: new wedding template

Replace `<templateKey>` with a stable id (e.g. `template-2`). Prefer lowercase kebab-case.

### 1. Backend (required for admin discovery)

Create:

```
backend/events/weddings/templates/<templateKey>/
  manifest.json
  chrome/                    # optional but recommended — shared design art
```

**`manifest.json` must include:**

```json
{
  "id": "<templateKey>",
  "type": "wedding",
  "label": "Human-readable name",
  "pages": [
    { "id": "openingVideo", "label": "Opening video", "defaultEnabled": true },
    { "id": "starting", "label": "Starting page", "defaultEnabled": true }
  ],
  "dynamicFields": [
    {
      "id": "openingVideo",
      "pageId": "openingVideo",
      "type": "media",
      "mediaKind": "video",
      "label": "Opening video"
    }
  ]
}
```

**Rules**

- Folder name = `templateKey` (admin create/update validates the directory exists).
- `manifest.id` should match the folder name (advisory; folder name wins for listing).
- Every page the admin can toggle needs an entry in `pages[]` with stable `id`.
- Every editable value needs a `dynamicFields[]` entry with `id`, `pageId`, `type`, `label`.
- Media fields: `"type": "media"` and `mediaKind` in `{ "video", "music", "images", "background", "documents" }`.
- List fields: `"type": "list"` with `itemSchema` and `defaultValue`. Image slots inside lists use `"type": "imageRef"` + `mediaKind: "images"`.
- Color fields: `"type": "color"` with optional `defaultValue` hex.
- A folder **without** `manifest.json` still appears in the template dropdown, but the Template modal will fail — always ship a valid manifest.

Copy [`backend/events/weddings/templates/template-1/manifest.json`](../backend/events/weddings/templates/template-1/manifest.json) as the starting point and edit page/field lists.

**Do not** put couple/event media inside the template folder. Per-event media belongs in a resource pack. Put only **shared** design files under `chrome/`.

### 2. Chrome URLs

Shared chrome is served at:

```text
/assets/events/weddings/templates/<templateKey>/chrome/<relativePath>
```

Use `publicChromeUrl("wedding", templateKey, "icons/foo.webp")` (backend) or the frontend `templateChrome` helpers so paths stay consistent across wedding / corporate / party.

### 3. Resource packs (not part of the template)

```
backend/events/weddings/resources/<packId>/
  video/
  music/
  images/
  background/
  documents/
```

On event create, the pack id often defaults to the event UUID. Admin uploads resolve against this pack; `template_config.fields` stores filenames that point into it.

Public/admin URLs look like:

`/assets/events/weddings/resources/<packId>/<kind>/<filename>`

### 4. Frontend mirror (required)

Create a matching tree:

```
frontend/templates/weddings/<templateKey>/
  manifest.js          # JS export of the same schema as manifest.json
  pages/index.js       # pageId → which React band owns it (documentation / registry)
```

Keep **`manifest.js` in sync with `manifest.json` by hand**.

Export helpers used by invitation components (same pattern as template-1):

- `dynamicField(id)` → sets `data-dynamic-field` for admin/editor targeting
- `invitePage(pageId)` → sets `data-invite-page` for page bands

Reference:

- [`frontend/templates/weddings/template-1/manifest.js`](../frontend/templates/weddings/template-1/manifest.js)
- [`frontend/templates/weddings/template-1/pages/index.js`](../frontend/templates/weddings/template-1/pages/index.js)

### 5. Dedicated invitation React file (required)

Admin and guest UIs need a **template-specific React invitation**, not only a manifest.

Today wedding `template-1` is implemented mainly by:

| File | Role |
|------|------|
| [`frontend/components/invite/InvitationPage.jsx`](../frontend/components/invite/InvitationPage.jsx) | Absolute-layout invitation bands (starting → closing) |
| [`frontend/lib/inviteLayoutMetrics.js`](../frontend/lib/inviteLayoutMetrics.js) | Page spans, growth, `pageShift` when pages grow / are disabled |
| [`frontend/components/invite/InvitationExperienceSafe.jsx`](../frontend/components/invite/InvitationExperienceSafe.jsx) | Video → invite → RSVP → schedule → thank-you shell |
| [`frontend/components/invite/InvitationVideoIntro.jsx`](../frontend/components/invite/InvitationVideoIntro.jsx) | Opening video |
| [`frontend/lib/adminInvitePreview.js`](../frontend/lib/adminInvitePreview.js) | Admin preview / guest-preview payload from event + config + resources |
| [`frontend/lib/inviteRenderer.js`](../frontend/lib/inviteRenderer.js) | Picks wedding / corporate / party experience by `eventType` + `templateKey` |

**For a new template key you must:**

1. Add a dedicated invitation component that:
   - Imports that template’s `manifest.js` helpers (`invitePage`, `dynamicField`)
   - Sets an appropriate `data-template-id`
   - Reads `templateConfig.pages` / `templateConfig.fields` the same way as the reference template
2. Add layout metrics if it uses absolute bands / growth.
3. Register it in `inviteRenderer.js` (and any admin preview mount points) so the new key does not fall through to `template-1`.

Hardcoded touchpoints to update when adding a second wedding renderer:

- `InvitationPage.jsx` / experience shell imports of `@/templates/weddings/template-1/manifest`
- `TemplateEventModal.jsx` (live preview)
- Admin guest preview (`/admin/events/[id]/guest-preview`)
- `inviteRenderer.js` map for `wedding` + new key

### 6. Page / field ID contract (wedding template-1 reference)

Admin **Full template** and layout metrics assume these page ids for wedding template-1:

| `pageId` | Band |
|----------|------|
| `openingVideo` | Video + music shell |
| `starting` | Landing |
| `rsvp` | RSVP form |
| `allDetails` | Information nodes + contact |
| `ourStory` | Story timeline |
| `bigDay` | Date / venue cards |
| `journey` | Gallery |
| `closing` | Closing message + footer |

Notable `dynamicFields` ids: `openingVideo`, `backgroundMusic`, `landingBackground`, `colorPrimary`, `colorAccent`, `colorSurface`, `rsvpQuestions`, `detailNodes`, `storyMilestones`, `journeyImages`.

Template modal treats colors + background music as global “Full template” fields (`FULL_TEMPLATE_FIELD_IDS` in `TemplateEventModal.jsx`).

New templates may use different page ids, but then admin preview clipping (`resolvePageBand`) and layout metrics must be updated for those ids.

### 7. Verify admin understands the template

1. Restart backend so disk templates are listed.
2. Admin → Events → Add event → Type **Wedding** → Template dropdown shows `<templateKey>` / label.
3. Create event → Actions → **Template** opens editors from `manifest.json` pages/fields.
4. Upload media under the event resource pack; select files in media / `imageRef` fields.
5. **Save template** writes `template_config`.
6. Actions → **View guest view** opens a new tab with dummy guest data (no DB RSVP writes) using saved config + pack media.
7. Confirm guest-facing invite path also mounts **your** React invitation for that `templateKey` (after wiring).

---

## Corporate / party templates

Same disk contract as weddings. Existing **`template-1`** references:

| Piece | Corporate | Party |
|-------|-----------|-------|
| Manifest | [`backend/events/corporate-events/templates/template-1/manifest.json`](../backend/events/corporate-events/templates/template-1/manifest.json) | [`backend/events/parties/templates/template-1/manifest.json`](../backend/events/parties/templates/template-1/manifest.json) |
| Chrome | `…/templates/template-1/chrome/` | `…/templates/template-1/chrome/` |
| Frontend schema | `frontend/templates/corporate-events/template-1/` | `frontend/templates/parties/template-1/` |
| React invite | `frontend/components/invite/corporate/template-1/` | `frontend/components/invite/party/template-1/` |

To add `template-2` for either type:

1. Copy that type’s `template-1` manifest (+ chrome if needed) under a new folder name.
2. Mirror `frontend/templates/<folder>/<templateKey>/`.
3. Add React under `frontend/components/invite/<corporate|party>/<templateKey>/`.
4. Register the key in `inviteRenderer.js`.

Corporate `documents` mediaKind is used for downloadable resource files in the pack’s `documents/` subfolder. Party templates are CSS-page based; keep field ids aligned with the party `manifest.js` / page components.

---

## Common pitfalls

1. **Manifest vs folder mismatch** — dropdown uses folder name; missing `manifest.json` breaks Template modal.
2. **JSON / JS drift** — frontend `manifest.js` not updated after backend `manifest.json` changes.
3. **Manifest only, no React** — admin can configure fields, but preview/invite still shows the default template until a React file is wired in `inviteRenderer.js`.
4. **Media in the wrong tree** — couple slug assets under `backend/assets/…` are a **legacy** path; admin events use `backend/events/…/resources/<packId>/`. Chrome belongs under `templates/<key>/chrome/`, not the pack.
5. **Disabling pages** — set `pages.<pageId>: false` in `template_config`; do not delete bands from the React file. Layout metrics must collapse disabled pages (see wedding template-1 `pageShift`).

---

## Related guides

- [local-setup-backend-db.md](./local-setup-backend-db.md) — local backend / DB / events layout
- [README.md](./README.md) — repo overview
- [couples-scripts-and-media.md](./couples-scripts-and-media.md) — admin provisioning + legacy slug media
- [deploy-backend.md](./deploy-backend.md) / [deploy-frontend.md](./deploy-frontend.md) — deploy
