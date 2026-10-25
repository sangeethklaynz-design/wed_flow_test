require("dotenv").config();

function requireEnv(keys) {
  const missing = keys.filter((k) => process.env[k] === undefined);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

const env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_DIALECT: process.env.DB_DIALECT,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "7d",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  SALT_ROUNDS: process.env.SALT_ROUNDS,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN,
  CORS_ORIGIN: process.env.CORS_ORIGIN || process.env.FRONTEND_ORIGIN,

  APP_PUBLIC_URL: process.env.APP_PUBLIC_URL || process.env.FRONTEND_ORIGIN || "",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || "",
  /** Master Google Pay Console merchant id (platform). Not per-event-merchant. */
  GOOGLE_PAY_MERCHANT_ID: process.env.GOOGLE_PAY_MERCHANT_ID || "",
  /**
   * When false (default), Connect onboarding mutations, live Checkout/PaymentIntents,
   * and webhook ticket issuance are disabled. Invite UI keeps mock pay.
   */
  PAYMENTS_LIVE:
    String(process.env.PAYMENTS_LIVE || "false").toLowerCase() === "true",
  /** Platform commission percent of ticket total (0–100). Used when PAYMENTS_LIVE. */
  PLATFORM_FEE_PERCENT: Math.min(
    100,
    Math.max(0, Number(process.env.PLATFORM_FEE_PERCENT) || 0)
  ),
};

module.exports = { env, requireEnv };

