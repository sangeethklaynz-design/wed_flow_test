const crypto = require("crypto");
const { sequelize } = require("../models");

function mapTierRow(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    price: Number(row.price),
    currency: row.currency || "LKR",
    sortOrder: Number(row.sort_order) || 0,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTicketRow(row) {
  return {
    ticketId: row.id,
    eventId: row.event_id,
    orderId: row.order_id,
    tierId: row.tier_id,
    guestId: row.guest_id || null,
    // QR CODE
    ticketCode: row.ticket_code,
    tierName: row.tier_name,
    price: Number(row.price),
    currency: row.currency || "LKR",
    status: row.status,
    issuedAt: row.issued_at,
    invalidatedAt: row.invalidated_at || null,
    invalidatedBy: row.invalidated_by || null,
  };
}

function mapOrderRow(row) {
  return {
    orderId: row.id,
    eventId: row.event_id,
    guestId: row.guest_id || null,
    buyerName: row.buyer_name || null,
    buyerContact: row.buyer_contact || null,
    paymentProvider: row.payment_provider,
    paymentRef: row.payment_ref || null,
    paymentStatus: row.payment_status,
    amountTotal: Number(row.amount_total),
    currency: row.currency || "LKR",
    stripeCheckoutSessionId: row.stripe_checkout_session_id || null,
    expiresAt: row.expires_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const RESERVATION_HOURS = 1;

function formatTicketQrText({ guestName, tierName, ticketCode }) {
  return [
    `Guest: ${String(guestName || "Guest").trim() || "Guest"}`,
    `Ticket type: ${String(tierName || "Ticket").trim() || "Ticket"}`,
    `Ticket ID: ${String(ticketCode || "").trim()}`,
  ].join("\n");
}

function parseTicketIdFromScan(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  const idLine = text.match(/Ticket\s*ID\s*:\s*(.+)/i);
  if (idLine?.[1]) return String(idLine[1]).trim();
  // Raw ticket code pasted/scanned alone
  if (/^tkt_[a-zA-Z0-9]+$/i.test(text) || /^[a-zA-Z0-9_-]{8,}$/.test(text)) {
    return text;
  }
  return text;
}

/**
 * Expire stale pending orders and restore guest status when appropriate.
 */
async function expireStalePendingOrders({ eventId, guestId, transaction } = {}) {
  const replacements = [];
  let where = `payment_status = 'pending' AND expires_at IS NOT NULL AND expires_at < NOW()`;
  if (eventId) {
    where += ` AND event_id = ?`;
    replacements.push(eventId);
  }
  if (guestId) {
    where += ` AND guest_id = ?`;
    replacements.push(guestId);
  }

  const [expired] = await sequelize.query(
    `SELECT id, guest_id, event_id FROM ticket_orders WHERE ${where};`,
    { replacements, transaction }
  );

  if (!expired.length) return [];

  await sequelize.query(
    `
    UPDATE ticket_orders
    SET payment_status = 'expired', updated_at = NOW()
    WHERE ${where};
    `,
    { replacements, transaction }
  );

  const guestIds = [
    ...new Set(expired.map((r) => r.guest_id).filter(Boolean)),
  ];
  for (const gid of guestIds) {
    const [open] = await sequelize.query(
      `
      SELECT id FROM ticket_orders
      WHERE guest_id = ?
        AND payment_status = 'pending'
        AND (expires_at IS NULL OR expires_at >= NOW())
      LIMIT 1;
      `,
      { replacements: [gid], transaction }
    );
    if (open[0]) continue;

    const [paid] = await sequelize.query(
      `
      SELECT id FROM tickets
      WHERE guest_id = ? AND status = 'valid'
      LIMIT 1;
      `,
      { replacements: [gid], transaction }
    );
    if (paid[0]) continue;

    await sequelize.query(
      `
      UPDATE guests
      SET rsvp_status = 'REGISTERED',
          payment_due_at = NULL
      WHERE id = ? AND rsvp_status = 'PAYMENT_PENDING';
      `,
      { replacements: [gid], transaction }
    );
  }

  return expired;
}

async function countSoldForTier(eventId, tierId, { transaction } = {}) {
  const [rows] = await sequelize.query(
    `
    SELECT COUNT(*) AS c
    FROM tickets
    WHERE event_id = ? AND tier_id = ?;
    `,
    { replacements: [eventId, tierId], transaction }
  );
  return Number(rows[0]?.c || 0);
}

async function countHeldForTier(eventId, tierId, { transaction } = {}) {
  const [rows] = await sequelize.query(
    `
    SELECT checkout_items
    FROM ticket_orders
    WHERE event_id = ?
      AND payment_status = 'pending'
      AND (expires_at IS NULL OR expires_at >= NOW());
    `,
    { replacements: [eventId], transaction }
  );
  let held = 0;
  for (const row of rows) {
    const items = parseCheckoutItems(row.checkout_items);
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (String(item.tierId) === String(tierId)) {
        held += Number(item.quantity) || 0;
      }
    }
  }
  return held;
}

async function assertInventoryAvailable(
  eventId,
  tier,
  quantity,
  { transaction } = {}
) {
  if (tier.quantity == null || Number.isNaN(Number(tier.quantity))) {
    return null;
  }
  const cap = Number(tier.quantity);
  const sold = await countSoldForTier(eventId, tier.id, { transaction });
  const held = await countHeldForTier(eventId, tier.id, { transaction });
  const remaining = Math.max(0, cap - sold - held);
  if (quantity > remaining) {
    return `Only ${remaining} ticket(s) remaining for ${tier.name}`;
  }
  return null;
}

function mapFinanceTicketRow(row) {
  return {
    ticketId: row.ticket_id || row.id,
    ticketCode: row.ticket_code,
    tierId: row.tier_id || null,
    tierName: row.tier_name,
    price: Number(row.price),
    currency: row.currency || "LKR",
    ticketStatus: row.ticket_status || row.status,
    issuedAt: row.issued_at,
    invalidatedAt: row.invalidated_at || null,
    invalidatedBy: row.invalidated_by || null,
    orderId: row.order_id,
    paymentStatus: row.payment_status || null,
    paymentProvider: row.payment_provider || null,
    paymentRef: row.payment_ref || null,
    stripeCheckoutSessionId: row.stripe_checkout_session_id || null,
    buyerName: row.buyer_name || null,
    buyerContact: row.buyer_contact || null,
    guestId: row.guest_id || null,
    orderAmountTotal:
      row.order_amount_total != null
        ? Number(row.order_amount_total)
        : row.amount_total != null
          ? Number(row.amount_total)
          : null,
    orderCreatedAt: row.order_created_at || null,
    eventId: row.event_id || null,
    eventName: row.event_name || null,
    organizationId: row.organization_id || null,
    organizationName: row.organization_name || null,
  };
}

function mapFinanceTicketDetail(row) {
  const base = mapFinanceTicketRow(row);
  let checkoutItems = null;
  if (row.checkout_items != null) {
    if (typeof row.checkout_items === "object") {
      checkoutItems = row.checkout_items;
    } else {
      try {
        checkoutItems = JSON.parse(String(row.checkout_items));
      } catch {
        checkoutItems = null;
      }
    }
  }
  return {
    ...base,
    checkoutItems,
    orderUpdatedAt: row.order_updated_at || null,
  };
}

function parseTicketTiersInput(body = {}) {
  if (body.ticketTiers === undefined && body.ticket_tiers === undefined) {
    return undefined;
  }
  const raw = body.ticketTiers ?? body.ticket_tiers;
  if (!Array.isArray(raw)) return null;
  return raw.map((item, index) => {
    const name = String(item?.name || "").trim();
    const price = Number(item?.price);
    const currency = String(item?.currency || "LKR")
      .trim()
      .toUpperCase()
      .slice(0, 3) || "LKR";
    const sortOrder =
      item?.sortOrder !== undefined || item?.sort_order !== undefined
        ? Number(item.sortOrder ?? item.sort_order)
        : index;
    const isActive =
      item?.isActive === undefined && item?.is_active === undefined
        ? true
        : Boolean(item?.isActive ?? item?.is_active);
    return { name, price, currency, sortOrder, isActive };
  });
}

function validateTicketTiersInput(tiers) {
  if (tiers === undefined) return null;
  if (tiers === null) return "ticketTiers must be an array";
  for (let i = 0; i < tiers.length; i += 1) {
    const tier = tiers[i];
    if (!tier.name) return `ticketTiers[${i}].name is required`;
    if (!Number.isFinite(tier.price) || tier.price < 0) {
      return `ticketTiers[${i}].price must be a non-negative number`;
    }
    if (!/^[A-Z]{3}$/.test(tier.currency)) {
      return `ticketTiers[${i}].currency must be a 3-letter code`;
    }
  }
  return null;
}

function isEventTicketingEnabled(row) {
  if (!row) return false;
  if (row.is_ticketing_enabled != null) {
    return Boolean(Number(row.is_ticketing_enabled));
  }
  return Boolean(Number(row.ticketing_enabled));
}

function mapTicketTypeAsTier(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    price: Number(row.price),
    currency: "LKR",
    sortOrder: Number(row.display_order) || 0,
    isActive: true,
    description: row.description || "",
    quantity: row.quantity != null ? Number(row.quantity) : null,
    source: "ticket_types",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadTicketTypesForEvent(eventId) {
  const [rows] = await sequelize.query(
    `
    SELECT *
    FROM ticket_types
    WHERE event_id = ?
    ORDER BY display_order ASC, created_at ASC;
    `,
    { replacements: [eventId] }
  );
  return rows.map(mapTicketTypeAsTier);
}

async function loadTicketTiersForEvent(eventId, { activeOnly = false } = {}) {
  const [rows] = await sequelize.query(
    `
    SELECT *
    FROM ticket_tiers
    WHERE event_id = ?
      ${activeOnly ? "AND is_active = 1" : ""}
    ORDER BY sort_order ASC, created_at ASC;
    `,
    { replacements: [eventId] }
  );
  return rows.map(mapTierRow);
}

/**
 * Prefer ticket_types (admin Ticketing tab); fall back to legacy ticket_tiers.
 */
async function loadTicketCatalogForEvent(eventId, { activeOnly = false } = {}) {
  try {
    const types = await loadTicketTypesForEvent(eventId);
    if (types.length) return types;
  } catch {
    // table may not exist yet during early boot
  }
  return loadTicketTiersForEvent(eventId, { activeOnly });
}

/**
 * Resolve a purchasable line by id from ticket_types or ticket_tiers.
 */
async function resolvePurchasableTier(eventId, tierId, { transaction } = {}) {
  const [typeRows] = await sequelize.query(
    `
    SELECT *
    FROM ticket_types
    WHERE id = ? AND event_id = ?
    LIMIT 1;
    `,
    { replacements: [tierId, eventId], transaction }
  );
  if (typeRows[0]) {
    return mapTicketTypeAsTier(typeRows[0]);
  }

  const [tierRows] = await sequelize.query(
    `
    SELECT *
    FROM ticket_tiers
    WHERE id = ? AND event_id = ? AND is_active = 1
    LIMIT 1;
    `,
    { replacements: [tierId, eventId], transaction }
  );
  return tierRows[0] ? mapTierRow(tierRows[0]) : null;
}

async function loadTicketTiersByEventIds(eventIds) {
  if (!eventIds.length) return new Map();
  const placeholders = eventIds.map(() => "?").join(",");
  const [rows] = await sequelize.query(
    `
    SELECT *
    FROM ticket_tiers
    WHERE event_id IN (${placeholders})
    ORDER BY sort_order ASC, created_at ASC;
    `,
    { replacements: eventIds }
  );
  const map = new Map();
  for (const id of eventIds) map.set(id, []);
  for (const row of rows) {
    const list = map.get(row.event_id) || [];
    list.push(mapTierRow(row));
    map.set(row.event_id, list);
  }
  return map;
}

async function replaceTicketTiers(eventId, tiers, { transaction } = {}) {
  await sequelize.query(`DELETE FROM ticket_tiers WHERE event_id = ?;`, {
    replacements: [eventId],
    transaction,
  });
  for (const tier of tiers) {
    await sequelize.query(
      `
      INSERT INTO ticket_tiers (
        id, event_id, name, price, currency, sort_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
      {
        replacements: [
          crypto.randomUUID(),
          eventId,
          tier.name,
          tier.price,
          tier.currency,
          Number.isFinite(tier.sortOrder) ? tier.sortOrder : 0,
          tier.isActive ? 1 : 0,
        ],
        transaction,
      }
    );
  }
}

function generateTicketCode() {
  // QR CODE
  return `tkt_${crypto.randomUUID().replace(/-/g, "")}`;
}

function parseCheckoutItems(raw) {
  if (raw == null) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return null;
  }
}

async function loadTicketsForOrder(orderId, { transaction } = {}) {
  const [rows] = await sequelize.query(
    `
    SELECT *
    FROM tickets
    WHERE order_id = ?
    ORDER BY issued_at ASC;
    `,
    { replacements: [orderId], transaction }
  );
  return rows.map(mapTicketRow);
}

/**
 * Mark order paid (if still pending) and issue one ticket per purchased unit.
 * Idempotent when already paid.
 */
async function issueTicketsForPaidOrder(
  orderId,
  { paymentRef, paymentProvider = "stripe", transaction: outerTx } = {}
) {
  const ownTx = !outerTx;
  const transaction = outerTx || (await sequelize.transaction());
  try {
    const [orderRows] = await sequelize.query(
      `SELECT * FROM ticket_orders WHERE id = ? LIMIT 1 FOR UPDATE;`,
      { replacements: [orderId], transaction }
    );
    const order = orderRows[0];
    if (!order) {
      const err = new Error("Order not found");
      err.code = "ORDER_NOT_FOUND";
      throw err;
    }

    if (order.payment_status === "paid") {
      const tickets = await loadTicketsForOrder(orderId, { transaction });
      if (ownTx) await transaction.commit();
      return { order, tickets, alreadyPaid: true };
    }

    if (order.payment_status !== "pending") {
      const err = new Error(
        `Order cannot be confirmed from status ${order.payment_status}`
      );
      err.code = "ORDER_BAD_STATUS";
      throw err;
    }

    const snapshot = parseCheckoutItems(order.checkout_items);
    if (!Array.isArray(snapshot) || !snapshot.length) {
      const err = new Error("Checkout snapshot missing; recreate checkout");
      err.code = "CHECKOUT_SNAPSHOT_MISSING";
      throw err;
    }

    await sequelize.query(
      `
      UPDATE ticket_orders
      SET payment_status = 'paid',
          payment_provider = ?,
          payment_ref = ?,
          updated_at = NOW()
      WHERE id = ?;
      `,
      {
        replacements: [
          paymentProvider,
          paymentRef || order.payment_ref || order.id,
          orderId,
        ],
        transaction,
      }
    );

    const issued = [];
    for (const item of snapshot) {
      const qty = Number(item.quantity) || 0;
      for (let i = 0; i < qty; i += 1) {
        const ticketId = crypto.randomUUID();
        const ticketCode = generateTicketCode();
        await sequelize.query(
          `
          INSERT INTO tickets (
            id, event_id, order_id, tier_id, guest_id,
            ticket_code, tier_name, price, currency, status, issued_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'valid', NOW());
          `,
          {
            replacements: [
              ticketId,
              order.event_id,
              orderId,
              item.tierId,
              order.guest_id,
              ticketCode,
              item.tierName,
              item.price,
              item.currency || order.currency || "LKR",
            ],
            transaction,
          }
        );
        issued.push({
          ticketId,
          // QR CODE
          ticketCode,
          tierName: item.tierName,
          price: Number(item.price),
          currency: item.currency || order.currency || "LKR",
          status: "valid",
        });
      }
    }

    const [freshOrderRows] = await sequelize.query(
      `SELECT * FROM ticket_orders WHERE id = ? LIMIT 1;`,
      { replacements: [orderId], transaction }
    );

    if (ownTx) await transaction.commit();
    return {
      order: freshOrderRows[0],
      tickets: issued,
      alreadyPaid: false,
    };
  } catch (err) {
    if (ownTx) {
      try {
        await transaction.rollback();
      } catch {
        // ignore
      }
    }
    throw err;
  }
}

module.exports = {
  mapTierRow,
  mapTicketRow,
  mapOrderRow,
  mapFinanceTicketRow,
  mapFinanceTicketDetail,
  parseTicketTiersInput,
  validateTicketTiersInput,
  isEventTicketingEnabled,
  mapTicketTypeAsTier,
  loadTicketTypesForEvent,
  loadTicketTiersForEvent,
  loadTicketCatalogForEvent,
  resolvePurchasableTier,
  loadTicketTiersByEventIds,
  replaceTicketTiers,
  generateTicketCode,
  parseCheckoutItems,
  loadTicketsForOrder,
  issueTicketsForPaidOrder,
  RESERVATION_HOURS,
  formatTicketQrText,
  parseTicketIdFromScan,
  expireStalePendingOrders,
  countSoldForTier,
  countHeldForTier,
  assertInventoryAvailable,
};
