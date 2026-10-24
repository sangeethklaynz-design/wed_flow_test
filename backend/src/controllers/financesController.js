const { sequelize } = require("../models");
const { getWeddingForRequest } = require("../utils/wedding");
const {
  mapFinanceTicketRow,
  mapFinanceTicketDetail,
  isEventTicketingEnabled,
} = require("../utils/ticketing");

const FINANCE_SELECT = `
  t.id AS ticket_id,
  t.ticket_code,
  t.tier_id,
  t.tier_name,
  t.price,
  t.currency,
  t.status AS ticket_status,
  t.issued_at,
  t.invalidated_at,
  t.invalidated_by,
  t.guest_id,
  t.event_id,
  t.order_id,
  o.payment_status,
  o.payment_provider,
  o.payment_ref,
  o.stripe_checkout_session_id,
  o.buyer_name,
  o.buyer_contact,
  o.amount_total AS order_amount_total,
  o.created_at AS order_created_at,
  o.updated_at AS order_updated_at,
  o.checkout_items,
  e.name AS event_name,
  e.organization_id,
  e.ticketing_enabled,
  e.is_ticketing_enabled,
  org.name AS organization_name
`;

function buildFinanceFilters(query = {}, { prefixTicket = "t", prefixOrder = "o" } = {}) {
  const clauses = [];
  const replacements = [];

  const ticketStatus = String(query.ticketStatus || query.status || "")
    .trim()
    .toLowerCase();
  if (ticketStatus === "valid" || ticketStatus === "invalid") {
    clauses.push(`${prefixTicket}.status = ?`);
    replacements.push(ticketStatus);
  }

  const paymentStatus = String(query.paymentStatus || query.payment_status || "")
    .trim()
    .toLowerCase();
  if (paymentStatus === "paid" || paymentStatus === "pending" || paymentStatus === "failed") {
    clauses.push(`${prefixOrder}.payment_status = ?`);
    replacements.push(paymentStatus);
  }

  const from = String(query.from || "").trim();
  if (from) {
    clauses.push(`DATE(${prefixTicket}.issued_at) >= ?`);
    replacements.push(from);
  }
  const to = String(query.to || "").trim();
  if (to) {
    clauses.push(`DATE(${prefixTicket}.issued_at) <= ?`);
    replacements.push(to);
  }

  const q = String(query.q || "").trim();
  if (q) {
    const like = `%${q}%`;
    clauses.push(
      `(${prefixTicket}.ticket_code LIKE ? OR ${prefixOrder}.payment_ref LIKE ? OR ${prefixOrder}.buyer_name LIKE ? OR ${prefixOrder}.buyer_contact LIKE ? OR ${prefixOrder}.id LIKE ?)`
    );
    replacements.push(like, like, like, like, like);
  }

  return { clauses, replacements };
}

function summarizeRows(rows) {
  const byCurrencyMap = new Map();
  let ticketCount = 0;
  let grossRevenue = 0;
  let primaryCurrency = "LKR";

  for (const row of rows) {
    const paymentStatus = row.payment_status;
    // Gross = paid tickets only
    if (paymentStatus !== "paid") continue;
    ticketCount += 1;
    const price = Number(row.price) || 0;
    const currency = row.currency || "LKR";
    primaryCurrency = currency;
    grossRevenue += price;
    const prev = byCurrencyMap.get(currency) || { currency, ticketCount: 0, grossRevenue: 0 };
    prev.ticketCount += 1;
    prev.grossRevenue += price;
    byCurrencyMap.set(currency, prev);
  }

  return {
    ticketCount,
    grossRevenue,
    currency: primaryCurrency,
    byCurrency: Array.from(byCurrencyMap.values()),
  };
}

async function loadEventForCouple(req) {
  const wedding = await getWeddingForRequest(req.user);
  if (!wedding?.event_id) return null;
  const [rows] = await sequelize.query(
    `
    SELECT id, name, organization_id, ticketing_enabled, is_ticketing_enabled
    FROM events
    WHERE id = ?
    LIMIT 1;
    `,
    { replacements: [wedding.event_id] }
  );
  return rows[0] || null;
}

async function getCoupleFinances(req, res) {
  try {
    const event = await loadEventForCouple(req);
    if (!event) {
      return res.status(404).json({
        error: "Not Found",
        message: "No event selected for this account",
      });
    }
    if (!isEventTicketingEnabled(event)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Finances are only available when ticketing is enabled for this event",
      });
    }

    const organizationId = req.user.organizationId;
    if (
      organizationId &&
      event.organization_id &&
      event.organization_id !== organizationId
    ) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Event is not in your organization",
      });
    }

    const { clauses, replacements } = buildFinanceFilters(req.query);
    const whereExtra = clauses.length ? `AND ${clauses.join(" AND ")}` : "";

    const [rows] = await sequelize.query(
      `
      SELECT ${FINANCE_SELECT}
      FROM tickets t
      INNER JOIN ticket_orders o ON o.id = t.order_id
      INNER JOIN events e ON e.id = t.event_id
      LEFT JOIN organizations org ON org.id = e.organization_id
      WHERE t.event_id = ?
        ${organizationId ? "AND e.organization_id = ?" : ""}
        ${whereExtra}
      ORDER BY t.issued_at DESC;
      `,
      {
        replacements: organizationId
          ? [event.id, organizationId, ...replacements]
          : [event.id, ...replacements],
      }
    );

    const summary = summarizeRows(rows);
    return res.status(200).json({
      eventId: event.id,
      eventName: event.name,
      ticketingEnabled: true,
      summary,
      rows: rows.map(mapFinanceTicketRow),
    });
  } catch (err) {
    console.error("getCoupleFinances error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load finances",
    });
  }
}

async function getCoupleFinanceTicketDetail(req, res) {
  try {
    const ticketId = String(req.params.ticketId || "").trim();
    if (!ticketId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "ticketId is required",
      });
    }

    const event = await loadEventForCouple(req);
    if (!event) {
      return res.status(404).json({
        error: "Not Found",
        message: "No event selected for this account",
      });
    }
    if (!isEventTicketingEnabled(event)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Finances are only available when ticketing is enabled for this event",
      });
    }

    const organizationId = req.user.organizationId;
    const [rows] = await sequelize.query(
      `
      SELECT ${FINANCE_SELECT}
      FROM tickets t
      INNER JOIN ticket_orders o ON o.id = t.order_id
      INNER JOIN events e ON e.id = t.event_id
      LEFT JOIN organizations org ON org.id = e.organization_id
      WHERE t.id = ?
        AND t.event_id = ?
        ${organizationId ? "AND e.organization_id = ?" : ""}
      LIMIT 1;
      `,
      {
        replacements: organizationId
          ? [ticketId, event.id, organizationId]
          : [ticketId, event.id],
      }
    );

    if (!rows[0]) {
      return res.status(404).json({
        error: "Not Found",
        message: "Ticket not found",
      });
    }

    return res.status(200).json({
      ticket: mapFinanceTicketDetail(rows[0]),
    });
  } catch (err) {
    console.error("getCoupleFinanceTicketDetail error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load finance ticket detail",
    });
  }
}

async function getAdminFinances(req, res) {
  try {
    const organizationId = String(
      req.query.organizationId || req.query.organization_id || ""
    ).trim();
    const eventId = String(req.query.eventId || req.query.event_id || "").trim();

    if (eventId) {
      const [evRows] = await sequelize.query(
        `SELECT id, ticketing_enabled, is_ticketing_enabled FROM events WHERE id = ? LIMIT 1;`,
        { replacements: [eventId] }
      );
      if (!evRows[0]) {
        return res.status(404).json({
          error: "Not Found",
          message: "Event not found",
        });
      }
      if (!isEventTicketingEnabled(evRows[0])) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Finances are only available when ticketing is enabled for this event",
        });
      }
    }

    const { clauses, replacements } = buildFinanceFilters(req.query);
    const where = [
      "COALESCE(e.is_ticketing_enabled, e.ticketing_enabled) = 1",
    ];
    const params = [];

    if (organizationId) {
      where.push("e.organization_id = ?");
      params.push(organizationId);
    }
    if (eventId) {
      where.push("t.event_id = ?");
      params.push(eventId);
    }
    where.push(...clauses);
    params.push(...replacements);

    const [rows] = await sequelize.query(
      `
      SELECT ${FINANCE_SELECT}
      FROM tickets t
      INNER JOIN ticket_orders o ON o.id = t.order_id
      INNER JOIN events e ON e.id = t.event_id
      LEFT JOIN organizations org ON org.id = e.organization_id
      WHERE ${where.join(" AND ")}
      ORDER BY t.issued_at DESC;
      `,
      { replacements: params }
    );

    const summary = summarizeRows(rows);
    return res.status(200).json({
      summary,
      rows: rows.map(mapFinanceTicketRow),
    });
  } catch (err) {
    console.error("getAdminFinances error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load finances",
    });
  }
}

async function getAdminFinanceTicketDetail(req, res) {
  try {
    const ticketId = String(req.params.ticketId || "").trim();
    if (!ticketId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "ticketId is required",
      });
    }

    const [rows] = await sequelize.query(
      `
      SELECT ${FINANCE_SELECT}
      FROM tickets t
      INNER JOIN ticket_orders o ON o.id = t.order_id
      INNER JOIN events e ON e.id = t.event_id
      LEFT JOIN organizations org ON org.id = e.organization_id
      WHERE t.id = ?
      LIMIT 1;
      `,
      { replacements: [ticketId] }
    );

    if (!rows[0]) {
      return res.status(404).json({
        error: "Not Found",
        message: "Ticket not found",
      });
    }

    if (!isEventTicketingEnabled(rows[0])) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Finances are only available when ticketing is enabled for this event",
      });
    }

    return res.status(200).json({
      ticket: mapFinanceTicketDetail(rows[0]),
    });
  } catch (err) {
    console.error("getAdminFinanceTicketDetail error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load finance ticket detail",
    });
  }
}

async function getAdminFinancesMeta(req, res) {
  try {
    const [vendors] = await sequelize.query(
      `
      SELECT
        o.id,
        o.name,
        u.email AS owner_email,
        (
          SELECT COUNT(*) FROM events e
          WHERE e.organization_id = o.id
            AND COALESCE(e.is_ticketing_enabled, e.ticketing_enabled) = 1
        ) AS ticketing_event_count
      FROM organizations o
      LEFT JOIN users u ON u.id = o.owner_user_id
      WHERE o.type = 'vendor'
      ORDER BY o.name ASC;
      `
    );

    const [events] = await sequelize.query(
      `
      SELECT
        e.id,
        e.name,
        e.organization_id,
        e.ticketing_enabled,
        e.is_ticketing_enabled,
        e.type,
        e.event_date,
        org.name AS organization_name
      FROM events e
      LEFT JOIN organizations org ON org.id = e.organization_id
      ORDER BY e.event_date DESC, e.created_at DESC;
      `
    );

    return res.status(200).json({
      vendors: vendors.map((v) => ({
        id: v.id,
        name: v.name,
        ownerEmail: v.owner_email || null,
        ticketingEventCount: Number(v.ticketing_event_count) || 0,
      })),
      events: events.map((e) => ({
        id: e.id,
        name: e.name,
        organizationId: e.organization_id || null,
        organizationName: e.organization_name || null,
        ticketingEnabled: isEventTicketingEnabled(e),
        type: e.type,
        eventDate: e.event_date ? String(e.event_date).slice(0, 10) : null,
      })),
    });
  } catch (err) {
    console.error("getAdminFinancesMeta error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load finances meta",
    });
  }
}

module.exports = {
  getCoupleFinances,
  getCoupleFinanceTicketDetail,
  getAdminFinances,
  getAdminFinanceTicketDetail,
  getAdminFinancesMeta,
};
