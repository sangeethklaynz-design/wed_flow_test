# Marketplace Google Pay + Stripe Connect

**Status: scaffolded, disabled (`PAYMENTS_LIVE=false`).**  
Do not enable in production until a dedicated go-live release.

This guide is for human developers and AI agents. It describes the payment architecture Wed Flow will use for ticket sales across many merchants.

## Product model

| Layer | Who | What |
|-------|-----|------|
| Guest wallet UI | Google Pay | Saved cards / easy checkout |
| Platform processor | Stripe (one platform account) | Charges the Google Pay token |
| Merchant receiving account | Stripe Connect Express | Merchant bank via onboarding |
| Routing | Backend | `transfer_data.destination` + optional `application_fee_amount` |

**One** Google Pay & Wallet Console merchant (platform / Klaynz).  
**Not** one Google Pay API per event merchant.  
Merchants never paste Google API keys — they only **Connect payouts**.

```text
Guest taps Google Pay
  → token / Checkout (platform Stripe + Google Pay)
  → PaymentIntent / Checkout with destination = event owner's stripe_account_id
  → payout to merchant bank
  → webhook → issue tickets
```

## Why not “Google Pay for Business” per merchant?

- **India UPI “Google Pay for Business”** (rupee dashboard, VPA) is a different, India-only product.
- **Google Pay API** (what the Sri Lanka Console registration uses) returns a payment **token for your processor**. Google is not the settlement ledger; Stripe is.
- Marketplace split requires Connect (or similar), not multiple Google merchant IDs for bank routing.

## Feature flags (offline by default)

### Backend (`backend/.env`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `PAYMENTS_LIVE` | `false` | Master switch for live Connect mutations, Checkout/PaymentIntents, webhook ticket issue |
| `STRIPE_SECRET_KEY` | — | Stripe secret |
| `STRIPE_PUBLISHABLE_KEY` | — | For future client Stripe.js / Google Pay |
| `STRIPE_WEBHOOK_SECRET` | — | Webhook signature |
| `APP_PUBLIC_URL` | — | Connect return URLs + Checkout success/cancel |
| `GOOGLE_PAY_MERCHANT_ID` | — | Platform Console merchant id (optional metadata for clients) |
| `PLATFORM_FEE_PERCENT` | `0` | Platform commission % of ticket total when live |

### Frontend (`frontend/.env`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_PAYMENTS_LIVE` | `false` | Invite GPay button uses **mock** success when false; live Checkout when true |

When offline:

- Invite [`TicketingPaymentOverlay`](../frontend/components/invite/common/TicketingPaymentOverlay.jsx) keeps demo pay.
- `POST /api/couple/payments/connect` and admin Connect mutations return **503**.
- `POST /api/public/ticket-orders/:id/pay` and `POST /api/public/checkout/marketplace-pay` return **503**.
- Stripe webhooks acknowledge but **do not issue tickets**.

## Key API surfaces

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/public/checkout/payments-status` | `{ paymentsLive, stripePublishableKey, googlePayMerchantId }` |
| POST | `/api/public/checkout/marketplace-pay` | Body: `{ orderId, paymentMethodId }` — Google Pay → Stripe PM → split PI |
| POST | `/api/public/ticket-orders/:orderId/pay` | Hosted Stripe Checkout (Google Pay when enabled in Dashboard) |
| GET/POST | `/api/couple/payments` (+ `/connect`, `/connect/refresh`) | Merchant Connect status / onboarding |
| GET/POST | `/api/admin/events/:id/payments` (+ connect/refresh) | Admin-scoped Connect for event owner |
| POST | `/api/public/webhooks/stripe` | `checkout.session.completed`, `payment_intent.succeeded`, `account.updated` |

Code:

- [`backend/src/utils/paymentsLive.js`](../backend/src/utils/paymentsLive.js)
- [`backend/src/services/stripePayments.js`](../backend/src/services/stripePayments.js)
- [`backend/src/controllers/marketplaceCheckoutController.js`](../backend/src/controllers/marketplaceCheckoutController.js)
- [`backend/src/controllers/eventPaymentsController.js`](../backend/src/controllers/eventPaymentsController.js)
- Merchant UI stub: [`frontend/components/payments/PaymentsConnectPanel.jsx`](../frontend/components/payments/PaymentsConnectPanel.jsx) on Ticketing page

## Merchant Connect flow (when live)

1. Merchant opens **Ticketing** → **Connect payouts**.
2. Backend creates Express account if needed → Stripe Account Link.
3. Merchant completes bank / KYC on Stripe-hosted pages.
4. `users.stripe_account_id` + `stripe_charges_enabled` updated (webhook `account.updated` + refresh).
5. Guest ticket orders for that merchant’s events use that account as `transfer_data.destination`.

## Guest checkout flow (when live)

1. RSVP / ticket selection → create `ticket_orders` row (`ticket-checkout`).
2. Pay via:
   - **Checkout redirect** (`ticket-orders/:id/pay`), or
   - **marketplace-pay** with a Stripe `paymentMethodId` from Google Pay (Stripe.js).
3. Webhook issues tickets when payment succeeds.

While `PAYMENTS_LIVE=false`, step 2 is simulated in the invite UI only.

## Enablement checklist (future release)

1. Stripe platform account + Connect enabled; test keys then live keys.
2. Enable **Google Pay** in Stripe Dashboard; register domains.
3. Complete Google Pay & Wallet Console production approval for invite domains; set `GOOGLE_PAY_MERCHANT_ID` if needed.
4. Set `APP_PUBLIC_URL`, webhook endpoint to `/api/public/webhooks/stripe`.
5. Set `PLATFORM_FEE_PERCENT` if collecting platform fees.
6. Set `PAYMENTS_LIVE=true` on backend and `NEXT_PUBLIC_PAYMENTS_LIVE=true` on frontend.
7. Smoke test: Connect onboarding → ticket purchase with Google Pay (test card / test wallet) → tickets issued → Finance shows order.
8. Only then flip live keys / production domains.

## Related guides

- [local-setup-backend-db.md](./local-setup-backend-db.md)
- [deploy-backend.md](./deploy-backend.md)
- [deploy-frontend.md](./deploy-frontend.md)
