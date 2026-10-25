/**
 * Marketplace Google Pay + Stripe Connect feature flag.
 * Must stay false until a future release enables live charges.
 * @see guide files/marketplace-payments-google-pay.md
 */
export function isPaymentsLive() {
  return (
    String(process.env.NEXT_PUBLIC_PAYMENTS_LIVE || "false").toLowerCase() ===
    "true"
  );
}
