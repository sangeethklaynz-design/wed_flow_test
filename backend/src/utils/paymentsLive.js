const { env } = require("../config/env");

function isPaymentsLive() {
  return Boolean(env.PAYMENTS_LIVE);
}

function paymentsOfflinePayload(extra = {}) {
  return {
    error: "Service Unavailable",
    message:
      "Marketplace payments are offline (PAYMENTS_LIVE=false). Enable in a future release — see guide files/marketplace-payments-google-pay.md",
    paymentsLive: false,
    ...extra,
  };
}

/** Express helper: send 503 when payments are offline. Returns true if response was sent. */
function rejectIfPaymentsOffline(res) {
  if (isPaymentsLive()) return false;
  res.status(503).json(paymentsOfflinePayload());
  return true;
}

module.exports = {
  isPaymentsLive,
  paymentsOfflinePayload,
  rejectIfPaymentsOffline,
};
