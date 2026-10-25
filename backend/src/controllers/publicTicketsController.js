const crypto = require("crypto");
const { sequelize } = require("../models");
const { env } = require("../config/env");
const { loadGuestByToken } = require("../utils/invitationTemplate");
const {
  mapOrderRow,
  mapTicketRow,
  parseCheckoutItems,
  loadTicketsForOrder,
  issueTicketsForPaidOrder,
  isEventTicketingEnabled,
  resolvePurchasableTier,
  expireStalePendingOrders,
  assertInventoryAvailable,
  formatTicketQrText,
  RESERVATION_HOURS,
} = require("../utils/ticketing");
const {
  createCheckoutSessionForOrder,
  constructWebhookEvent,
} = require("../services/stripePayments");
const {
  isPaymentsLive,
  rejectIfPaymentsOffline,
} = require("../utils/paymentsLive");

async function loadEventForGuest(guestRow) {
  const [rows] = await sequelize.query(
    `
    SELECT e.*
    FROM weddings w
    INNER JOIN events e ON e.id = w.event_id
    WHERE w.id = ?
    LIMIT 1;
    `,
    { replacements: [guestRow.wedding_id] }
  );
  return rows[0] || null;
}

async function loadEventOwnerPayments(eventId) {
  const [rows] = await sequelize.query(
    `
    SELECT
      e.id AS event_id,
      e.user_id,
      u.stripe_account_id,
      u.stripe_charges_enabled
    FROM events e
    LEFT JOIN users u ON u.id = e.user_id
    WHERE e.id = ?
    LIMIT 1;
    `,
    { replacements: [eventId] }
  );
  return rows[0] || null;
}

async function createTicketCheckout(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Bad Request",
        message: "Invitation token is required",
      });
    }

    const guest = await loadGuestByToken(token);
    if (!guest) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Not Found",
        message: "Invitation not found",
      });
    }

    if (
      String(guest.source || "").toLowerCase() === "public" &&
      guest.payment_due_at
    ) {
      const due = new Date(guest.payment_due_at).getTime();
      if (Number.isFinite(due) && Date.now() > due) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Bad Request",
          message:
            "Payment window has expired. Please contact the event organizer.",
          paymentDueAt: guest.payment_due_at,
        });
      }
    }

    const event = await loadEventForGuest(guest);
    if (!event) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Not Found",
        message: "Event not found",
      });
    }
    if (!isEventTicketingEnabled(event)) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Bad Request",
        message: "Ticketing is not enabled for this event",
      });
    }

    const attending = String(guest.attending_status || "")
      .trim()
      .toUpperCase();
    if (attending === "DECLINED") {
      await transaction.rollback();
      return res.status(400).json({
        error: "Bad Request",
        message: "Declined guests cannot purchase tickets",
      });
    }

    await expireStalePendingOrders({
      eventId: event.id,
      guestId: guest.guest_id,
      transaction,
    });

    // Cancel any other active pending holds for this guest before creating a new one
    await sequelize.query(
      `
      UPDATE ticket_orders
      SET payment_status = 'expired', updated_at = NOW()
      WHERE guest_id = ?
        AND event_id = ?
        AND payment_status = 'pending';
      `,
      { replacements: [guest.guest_id, event.id], transaction }
    );

    const items = Array.isArray(req.body?.items) ? req.body.items : null;
    if (!items || !items.length) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Bad Request",
        message: "items must be a non-empty array",
      });
    }

    const buyerName =
      String(req.body?.buyerName || req.body?.buyer_name || guest.full_name || "")
        .trim() || null;
    const buyerContact =
      String(
        req.body?.buyerContact ||
          req.body?.buyer_contact ||
          guest.whatsapp_number ||
          ""
      ).trim() || null;

    const normalizedItems = [];
    let amountTotal = 0;
    let currency = "LKR";

    for (let i = 0; i < items.length; i += 1) {
      const tierId = String(
        items[i]?.tierId ||
          items[i]?.tier_id ||
          items[i]?.ticketTypeId ||
          items[i]?.ticket_type_id ||
          items[i]?.typeId ||
          items[i]?.id ||
          ""
      ).trim();
      const quantity = Number(items[i]?.quantity);
      if (!tierId) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Bad Request",
          message: `items[${i}].tierId is required`,
        });
      }
      if (!Number.isInteger(quantity) || quantity < 1) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Bad Request",
          message: `items[${i}].quantity must be an integer of at least 1`,
        });
      }

      const tier = await resolvePurchasableTier(event.id, tierId, {
        transaction,
      });
      if (!tier) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Bad Request",
          message: `items[${i}].tierId is invalid or inactive`,
        });
      }

      const inventoryError = await assertInventoryAvailable(
        event.id,
        tier,
        quantity,
        { transaction }
      );
      if (inventoryError) {
        await transaction.rollback();
        return res.status(409).json({
          error: "Conflict",
          message: inventoryError,
        });
      }

      const unitPrice = Number(tier.price);
      currency = tier.currency || currency;
      amountTotal += unitPrice * quantity;
      normalizedItems.push({
        tier,
        quantity,
        lineTotal: unitPrice * quantity,
      });
    }

    const checkoutItems = normalizedItems.map((n) => ({
      tierId: n.tier.id,
      quantity: n.quantity,
      price: n.tier.price,
      currency: n.tier.currency,
      tierName: n.tier.name,
    }));

    const orderId = crypto.randomUUID();
    await sequelize.query(
      `
      INSERT INTO ticket_orders (
        id, event_id, guest_id, buyer_name, buyer_contact,
        payment_provider, payment_status, amount_total, currency,
        checkout_items, expires_at
      ) VALUES (?, ?, ?, ?, ?, 'demo', 'pending', ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR));
      `,
      {
        replacements: [
          orderId,
          event.id,
          guest.guest_id,
          buyerName,
          buyerContact,
          amountTotal,
          currency,
          JSON.stringify(checkoutItems),
          RESERVATION_HOURS,
        ],
        transaction,
      }
    );

    await sequelize.query(
      `
      UPDATE guests
      SET rsvp_status = 'PAYMENT_PENDING',
          payment_due_at = DATE_ADD(NOW(), INTERVAL ? HOUR)
      WHERE id = ?;
      `,
      { replacements: [RESERVATION_HOURS, guest.guest_id], transaction }
    );

    await transaction.commit();

    const [orderRows] = await sequelize.query(
      `SELECT * FROM ticket_orders WHERE id = ? LIMIT 1;`,
      { replacements: [orderId] }
    );

    return res.status(201).json({
      orderId,
      amountTotal,
      currency,
      expiresAt: orderRows[0]?.expires_at || null,
      reservationHours: RESERVATION_HOURS,
      items: normalizedItems.map((n) => ({
        tierId: n.tier.id,
        tierName: n.tier.name,
        quantity: n.quantity,
        unitPrice: n.tier.price,
        lineTotal: n.lineTotal,
        currency: n.tier.currency,
      })),
      order: mapOrderRow(orderRows[0]),
    });
  } catch (err) {
    try {
      await transaction.rollback();
    } catch {
      // ignore
    }
    console.error("public createTicketCheckout error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create ticket checkout",
    });
  }
}

async function demoCompleteTicketOrder(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const token = String(req.params.token || "").trim();
    const orderId = String(req.params.orderId || "").trim();
    if (!token || !orderId) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Bad Request",
        message: "Invitation token and orderId are required",
      });
    }

    const guest = await loadGuestByToken(token);
    if (!guest) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Not Found",
        message: "Invitation not found",
      });
    }

    await expireStalePendingOrders({
      eventId: null,
      guestId: guest.guest_id,
      transaction,
    });

    const [orderRows] = await sequelize.query(
      `SELECT * FROM ticket_orders WHERE id = ? LIMIT 1 FOR UPDATE;`,
      { replacements: [orderId], transaction }
    );
    const order = orderRows[0];
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Not Found",
        message: "Order not found",
      });
    }
    if (String(order.guest_id) !== String(guest.guest_id)) {
      await transaction.rollback();
      return res.status(403).json({
        error: "Forbidden",
        message: "Order does not belong to this guest",
      });
    }

    if (order.payment_status === "paid") {
      const tickets = await loadTicketsForOrder(orderId, { transaction });
      await transaction.commit();
      const guestName = guest.full_name || order.buyer_name || "Guest";
      return res.status(200).json({
        orderId,
        alreadyPaid: true,
        order: mapOrderRow(order),
        guestName,
        tickets: tickets.map((t) => ({
          ...t,
          guestName,
          qrText: formatTicketQrText({
            guestName,
            tierName: t.tierName,
            ticketCode: t.ticketCode,
          }),
        })),
      });
    }

    if (order.payment_status !== "pending") {
      await transaction.rollback();
      return res.status(409).json({
        error: "Conflict",
        message: `Order cannot be completed from status ${order.payment_status}`,
      });
    }

    if (order.expires_at && new Date(order.expires_at).getTime() < Date.now()) {
      await sequelize.query(
        `UPDATE ticket_orders SET payment_status = 'expired', updated_at = NOW() WHERE id = ?;`,
        { replacements: [orderId], transaction }
      );
      await sequelize.query(
        `
        UPDATE guests
        SET rsvp_status = 'REGISTERED', payment_due_at = NULL
        WHERE id = ? AND rsvp_status = 'PAYMENT_PENDING';
        `,
        { replacements: [guest.guest_id], transaction }
      );
      await transaction.commit();
      return res.status(409).json({
        error: "Conflict",
        message: "Reservation expired. Please select tickets again.",
      });
    }

    const result = await issueTicketsForPaidOrder(orderId, {
      paymentRef: `demo_${orderId.slice(0, 8)}`,
      paymentProvider: "demo",
      transaction,
    });

    await sequelize.query(
      `
      UPDATE guests
      SET rsvp_status = 'CONFIRMED', payment_due_at = NULL
      WHERE id = ?;
      `,
      { replacements: [guest.guest_id], transaction }
    );

    await transaction.commit();

    const guestName = guest.full_name || order.buyer_name || "Guest";
    const tickets = (result.tickets || []).map((t) => {
      const mapped =
        t.ticketCode != null && t.tierName != null
          ? {
              ticketId: t.ticketId,
              ticketCode: t.ticketCode,
              tierName: t.tierName,
              price: t.price,
              currency: t.currency,
              status: t.status || "valid",
            }
          : mapTicketRow(t);
      return {
        ...mapped,
        guestName,
        qrText: formatTicketQrText({
          guestName,
          tierName: mapped.tierName,
          ticketCode: mapped.ticketCode,
        }),
      };
    });

    return res.status(200).json({
      orderId,
      alreadyPaid: result.alreadyPaid,
      order: mapOrderRow(result.order),
      guestName,
      tickets,
    });
  } catch (err) {
    try {
      await transaction.rollback();
    } catch {
      // ignore
    }
    if (err.code === "ORDER_NOT_FOUND") {
      return res.status(404).json({ error: "Not Found", message: err.message });
    }
    if (
      err.code === "ORDER_BAD_STATUS" ||
      err.code === "CHECKOUT_SNAPSHOT_MISSING"
    ) {
      return res.status(409).json({ error: "Conflict", message: err.message });
    }
    console.error("public demoCompleteTicketOrder error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to complete demo payment",
    });
  }
}

async function startTicketOrderPay(req, res) {
  if (rejectIfPaymentsOffline(res)) return;

  try {
    const orderId = String(req.params.orderId || "").trim();
    if (!orderId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "orderId is required",
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
        // QR CODE
        tickets,
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
      });
    }

    const snapshot = parseCheckoutItems(order.checkout_items);
    if (!Array.isArray(snapshot) || !snapshot.length) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Checkout snapshot missing; recreate checkout",
      });
    }

    const lineItems = snapshot.map((item) => ({
      quantity: Number(item.quantity) || 1,
      price: item.price,
      tierName: item.tierName,
    }));

    const session = await createCheckoutSessionForOrder({
      order,
      connectedAccountId: owner.stripe_account_id,
      lineItems,
    });

    await sequelize.query(
      `
      UPDATE ticket_orders
      SET stripe_checkout_session_id = ?,
          payment_provider = 'stripe',
          updated_at = NOW()
      WHERE id = ?;
      `,
      { replacements: [session.id, orderId] }
    );

    return res.status(200).json({
      orderId,
      redirectUrl: session.url,
      checkoutSessionId: session.id,
    });
  } catch (err) {
    if (
      err?.code === "STRIPE_NOT_CONFIGURED" ||
      err?.code === "APP_PUBLIC_URL_MISSING"
    ) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: err.message,
      });
    }
    console.error("public startTicketOrderPay error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to start ticket payment",
    });
  }
}

async function confirmTicketPayment(req, res) {
  if (String(env.NODE_ENV || "").toLowerCase() === "production") {
    return res.status(403).json({
      error: "Forbidden",
      message:
        "Manual confirm-payment is disabled in production. Use Stripe Checkout; tickets are issued via webhook.",
    });
  }

  try {
    const orderId = String(req.params.orderId || "").trim();
    const paymentRef = String(req.body?.paymentRef || req.body?.payment_ref || "")
      .trim();
    const paymentProvider = String(
      req.body?.paymentProvider || req.body?.payment_provider || "stripe"
    )
      .trim()
      .toLowerCase() || "stripe";

    if (!orderId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "orderId is required",
      });
    }
    if (!paymentRef) {
      return res.status(400).json({
        error: "Bad Request",
        message: "paymentRef is required",
      });
    }

    const result = await issueTicketsForPaidOrder(orderId, {
      paymentRef,
      paymentProvider,
    });

    return res.status(200).json({
      orderId,
      order: mapOrderRow(result.order),
      // QR CODE
      tickets: result.tickets,
      alreadyPaid: result.alreadyPaid,
    });
  } catch (err) {
    if (err.code === "ORDER_NOT_FOUND") {
      return res.status(404).json({ error: "Not Found", message: err.message });
    }
    if (err.code === "ORDER_BAD_STATUS" || err.code === "CHECKOUT_SNAPSHOT_MISSING") {
      return res.status(409).json({ error: "Conflict", message: err.message });
    }
    console.error("public confirmTicketPayment error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to confirm ticket payment",
    });
  }
}

async function getTicketOrder(req, res) {
  try {
    const orderId = String(req.params.orderId || "").trim();
    if (!orderId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "orderId is required",
      });
    }

    const [orderRows] = await sequelize.query(
      `SELECT * FROM ticket_orders WHERE id = ? LIMIT 1;`,
      { replacements: [orderId] }
    );
    if (!orderRows[0]) {
      return res.status(404).json({
        error: "Not Found",
        message: "Order not found",
      });
    }

    const tickets = await loadTicketsForOrder(orderId);
    return res.status(200).json({
      order: mapOrderRow(orderRows[0]),
      // QR CODE
      tickets,
    });
  } catch (err) {
    console.error("public getTicketOrder error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load ticket order",
    });
  }
}

async function handleStripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error("stripe webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (!isPaymentsLive()) {
      console.warn(
        "stripe webhook received while PAYMENTS_LIVE=false; acknowledging without issuing tickets"
      );
      return res.status(200).json({
        received: true,
        paymentsLive: false,
        skipped: true,
      });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId =
        session.metadata?.orderId ||
        session.client_reference_id ||
        null;

      let resolvedOrderId = orderId;
      if (!resolvedOrderId && session.id) {
        const [rows] = await sequelize.query(
          `
          SELECT id FROM ticket_orders
          WHERE stripe_checkout_session_id = ?
          LIMIT 1;
          `,
          { replacements: [session.id] }
        );
        resolvedOrderId = rows[0]?.id || null;
      }

      if (resolvedOrderId && session.payment_status === "paid") {
        await issueTicketsForPaidOrder(resolvedOrderId, {
          paymentRef: session.payment_intent || session.id,
          paymentProvider: "stripe",
        });
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      const orderId = pi.metadata?.orderId || null;
      if (orderId) {
        await issueTicketsForPaidOrder(orderId, {
          paymentRef: pi.id,
          paymentProvider: "stripe",
        });
      }
    }

    if (event.type === "account.updated") {
      const account = event.data.object;
      await sequelize.query(
        `
        UPDATE users
        SET stripe_charges_enabled = ?,
            stripe_details_submitted = ?
        WHERE stripe_account_id = ?;
        `,
        {
          replacements: [
            account.charges_enabled ? 1 : 0,
            account.details_submitted ? 1 : 0,
            account.id,
          ],
        }
      );
    }

    return res.status(200).json({ received: true, paymentsLive: true });
  } catch (err) {
    console.error("stripe webhook handler error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Webhook handler failed",
    });
  }
}

module.exports = {
  createTicketCheckout,
  demoCompleteTicketOrder,
  startTicketOrderPay,
  confirmTicketPayment,
  getTicketOrder,
  handleStripeWebhook,
};
