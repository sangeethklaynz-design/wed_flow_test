const Stripe = require("stripe");
const { env } = require("../config/env");

const ZERO_DECIMAL = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

function getStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    const err = new Error("STRIPE_SECRET_KEY is not configured");
    err.code = "STRIPE_NOT_CONFIGURED";
    throw err;
  }
  return new Stripe(env.STRIPE_SECRET_KEY);
}

function getPublicBaseUrl() {
  const base = String(env.APP_PUBLIC_URL || "").replace(/\/$/, "");
  if (!base) {
    const err = new Error("APP_PUBLIC_URL is not configured");
    err.code = "APP_PUBLIC_URL_MISSING";
    throw err;
  }
  return base;
}

function toStripeAmount(amount, currency) {
  const code = String(currency || "usd").toLowerCase();
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Invalid amount for Stripe Checkout");
  }
  if (ZERO_DECIMAL.has(code)) return Math.round(n);
  return Math.round(n * 100);
}

function mapPaymentStatus(userRow) {
  const stripeAccountId = userRow?.stripe_account_id || null;
  return {
    connected: Boolean(stripeAccountId),
    chargesEnabled: Boolean(userRow?.stripe_charges_enabled),
    detailsSubmitted: Boolean(userRow?.stripe_details_submitted),
    stripeAccountId,
  };
}

async function createConnectedAccount({ email } = {}) {
  const stripe = getStripe();
  return stripe.accounts.create({
    type: "express",
    email: email || undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

async function createAccountOnboardingLink(stripeAccountId, { eventId } = {}) {
  const stripe = getStripe();
  const base = getPublicBaseUrl();
  const qs = eventId ? `?eventId=${encodeURIComponent(eventId)}` : "";
  return stripe.accountLinks.create({
    account: stripeAccountId,
    type: "account_onboarding",
    refresh_url: `${base}/payments/connect/refresh${qs}`,
    return_url: `${base}/payments/connect/return${qs}`,
  });
}

async function retrieveAccount(stripeAccountId) {
  const stripe = getStripe();
  return stripe.accounts.retrieve(stripeAccountId);
}

async function createCheckoutSessionForOrder({
  order,
  connectedAccountId,
  lineItems,
}) {
  const stripe = getStripe();
  const base = getPublicBaseUrl();
  const currency = String(order.currency || "usd").toLowerCase();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${base}/payments/ticket-success?orderId=${encodeURIComponent(order.id)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/payments/ticket-cancel?orderId=${encodeURIComponent(order.id)}`,
    client_reference_id: order.id,
    metadata: {
      orderId: order.id,
      eventId: order.event_id,
    },
    line_items: lineItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency,
        unit_amount: toStripeAmount(item.price, currency),
        product_data: {
          name: item.tierName || "Event ticket",
        },
      },
    })),
    payment_intent_data: {
      transfer_data: {
        destination: connectedAccountId,
      },
      metadata: {
        orderId: order.id,
        eventId: order.event_id,
      },
    },
  });
  return session;
}

function constructWebhookEvent(rawBody, signature) {
  const stripe = getStripe();
  if (!env.STRIPE_WEBHOOK_SECRET) {
    const err = new Error("STRIPE_WEBHOOK_SECRET is not configured");
    err.code = "STRIPE_WEBHOOK_NOT_CONFIGURED";
    throw err;
  }
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );
}

module.exports = {
  getStripe,
  getPublicBaseUrl,
  toStripeAmount,
  mapPaymentStatus,
  createConnectedAccount,
  createAccountOnboardingLink,
  retrieveAccount,
  createCheckoutSessionForOrder,
  constructWebhookEvent,
};
