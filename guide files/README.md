# Wed Flow — Guide Files

These guides are for **human developers** and **AI agents** setting up, deploying, and operating Wed Flow.

## Repository layout

```
wed_flow_test/
├── frontend/          # Next.js couple dashboard + public invitations
├── backend/           # Express API + MySQL + static assets
└── guide files/       # ← you are here
```

## Guides in this folder

| File | Purpose |
|------|---------|
| [deploy-frontend.md](./deploy-frontend.md) | Local + Vercel deploy for the Next.js frontend |
| [deploy-backend.md](./deploy-backend.md) | Local + Railway deploy for the Express API / MySQL |
| [couples-scripts-and-media.md](./couples-scripts-and-media.md) | Register couples, admin scripts, invitation video / images / music |

## Quick mental model

1. **Frontend** talks to the API via `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`).
2. **Backend** serves JSON under `/api/*` and media under `/assets/*`.
3. **Couples** are not self-registered in the UI — admins use `register_couple.js` (and related scripts).
4. **Invitation media** (video, journey photos, background music) is resolved from disk folders named by a **couple slug** derived from `weddings.couple_names`.

## Typical production stack (current)

- Frontend: **Vercel** (root directory = `frontend`)
- Backend + MySQL: **Railway** (service root = `backend`)
- Source: GitHub (`main` or release branches)

Always configure CORS (`FRONTEND_ORIGIN`) on the backend to include the deployed frontend origin(s).
