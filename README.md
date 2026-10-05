# wedflow

E-Invitation Management System (weddings, corporate events, and parties).

## Docs for setup & operations

See **[`guide files/`](./guide%20files/)** — single source of truth for developers and AI agents:

- **[Local setup (backend + DB + events)](./guide%20files/local-setup-backend-db.md)** ← start here
- [Creating event templates](./guide%20files/creating-event-templates.md)
- [Frontend deploy](./guide%20files/deploy-frontend.md)
- [Backend deploy](./guide%20files/deploy-backend.md)
- [Clients, events & media](./guide%20files/couples-scripts-and-media.md)

## Quick start

1. Follow [local-setup-backend-db.md](./guide%20files/local-setup-backend-db.md) (MySQL, `.env`, `admin-credentials.txt`, `npm run db:sync`, backend `:4000`).
2. Run frontend (`frontend/` → `npm run dev` → `:3000`).
3. Log in as admin → create an event → open Template / guest preview → client login with provisioned credentials.
