const { sequelize } = require("../models");
const { env } = require("../config/env");
const {
  isPaymentsLive,
  rejectIfPaymentsOffline,
} = require("../utils/paymentsLive");
const {
  mapOrderRow,
  loadTicketsForOrder,
  issueTicketsForPaidOrder,
} = require("../utils/ticketing");
const {
  createMarketplacePaymentIntent,
  mapPaymentStatus,
} = require("../services/stripePayments");

async function loadEventOwnerPayments(eventId) {
  const [rows] = await sequelize.query(
    `
    SELECT
      e.id AS event_id,
      e.user_id,
      u.stripe_account_id,
      u.stripe_charges_enabled,
      u.stripe_details_submitted
    FROM events e
    LEFT JOIN users u ON u.id = e.user_id
    WHERE e.id = ?
    LIMIT 1;
    `,
    { replacements: [eventId] }
  );
  return rows[0] || null;
}

/**
 * POST /api/public/checkout/marketplace-pay
 * Body: { orderId, paymentMethodId }
 *
 * Accepts a Stripe PaymentMethod id created client-side from Google Pay
 * (via Stripe.js). Routes funds to the event merchant Connect account.
 * Gated by PAYMENTS_LIVE.
 */
async function marketplacePay(req, res) {
  if (rejectIfPaymentsOffline(res)) return;

  try {
    const orderId = String(req.body?.orderId || req.body?.order_id || "").trim();
    const paymentMethodId = String(
      req.body?.paymentMethodId ||
        req.body?.payment_method_id ||
        req.body?.paymentToken ||
        ""
    ).trim();

    if (!orderId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "orderId is required",
      });
    }
    if (!paymentMethodId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "paymentMethodId is required (from Google Pay / Stripe.js)",
      });
    }

    const [orderRows] = await sequelize.query(
      `SELECT * FROM ticket_orders WHERE id = ? LIMIT 1;`,
      { replacements: [orderId] }
    );
    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({
        error: "Not Found",
        message: "Order not found",
      });
    }

    if (order.payment_status === "paid") {
      const tickets = await loadTicketsForOrder(orderId);
      return res.status(200).json({
        orderId,
        alreadyPaid: true,
        order: mapOrderRow(order),
        tickets,
        paymentsLive: true,
      });
    }

    if (order.payment_status !== "pending") {
      return res.status(409).json({
        error: "Conflict",
        message: `Order cannot be paid from status ${order.payment_status}`,
      });
    }

    const owner = await loadEventOwnerPayments(order.event_id);
    if (!owner?.stripe_account_id || !owner.stripe_charges_enabled) {
      return res.status(400).json({
        error: "Bad Request",
        message:
          "Merchant has not connected payouts yet. Complete Connect onboarding before accepting ticket payments.",
        merchantPayments: mapPaymentStatus(owner),
      });
    }

    let paymentIntent;
    try {
      paymentIntent = await createMarketplacePaymentIntent({
        order,
        connectedAccountId: owner.stripe_account_id,
        paymentMethodId,
      });
    } catch (err) {
      console.error("marketplacePay PaymentIntent error:", err.message);
      await sequelize.query(
        `
        UPDATE ticket_orders
        SET payment_provider = 'stripe',
            payment_status = 'failed',
            updated_at = NOW()
        WHERE id = ? AND payment_status = 'pending';
        `,
        { replacements: [orderId] }
      );
      return res.status(402).json({
        error: "Payment Failed",
        message: err.message || "Failed to process payment token",
        paymentsLive: true,
      });
    }

    await sequelize.query(
      `
      UPDATE ticket_orders
      SET payment_provider = 'stripe',
          stripe_checkout_session_id = COALESCE(stripe_checkout_session_id, ?),
          updated_at = NOW()
      WHERE id = ?;
      `,
      { replacements: [paymentIntent.id, orderId] }
    );

    if (paymentIntent.status === "succeeded") {
      const result = await issueTicketsForPaidOrder(orderId, {
        paymentRef: paymentIntent.id,
        paymentProvider: "stripe",
      });
      return res.status(200).json({
        orderId,
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id,
        order: mapOrderRow(result.order),
        tickets: result.tickets,
        alreadyPaid: result.alreadyPaid,
        paymentsLive: true,
        platformFeePercent: env.PLATFORM_FEE_PERCENT,
      });
    }

    return res.status(200).json({
      orderId,
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || null,
      order: mapOrderRow(order),
      paymentsLive: true,
      message:
        "Payment requires additional action; complete with client_secret if needed.",
    });
  } catch (err) {
    console.error("marketplacePay error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed marketplace pay",
      paymentsLive: isPaymentsLive(),
    });
  }
}

/** GET /api/public/checkout/payments-status — flag + publishable config for clients */
async function getPaymentsPublicStatus(req, res) {
  return res.status(200).json({
    paymentsLive: isPaymentsLive(),
    stripePublishableKey: isPaymentsLive()
      ? env.STRIPE_PUBLISHABLE_KEY || null
      : null,
    googlePayMerchantId: isPaymentsLive()
      ? env.GOOGLE_PAY_MERCHANT_ID || null
      : null,
    platformFeePercent: env.PLATFORM_FEE_PERCENT,
  });
}

module.exports = {
  marketplacePay,
  getPaymentsPublicStatus,
};
