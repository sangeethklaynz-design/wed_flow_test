const crypto = require("crypto");
const { sequelize } = require("../models");

const DEFAULT_TICKETS = [
  {
    name: "Standard",
    price: 1000,
    description: "General Admission",
    display_order: 1,
  },
  {
    name: "VIP",
    price: 2000,
    description: "Access to VIP Lounge",
    display_order: 2,
  },
  {
    name: "Premium",
    price: 5000,
    description: "Front Row Seating",
    display_order: 3,
  },
];

function isCorporateOrParty(type) {
  const t = String(type || "").toLowerCase();
  return t === "corporate" || t === "party" || t === "corporate-events" || t === "parties";
}

/**
 * Resolve event from admin :eventId param, JWT selected event, or org ownership.
 * Does not auto-create wedding events.
 */
async function resolveEventId(req) {
  if (req.params?.eventId) {
    return String(req.params.eventId).trim() || null;
  }

  if (req.user?.eventId) {
    return String(req.user.eventId).trim() || null;
  }

  const userId = req.user?.id;
  const organizationId = req.user?.organizationId;
  if (!userId) return null;

  if (organizationId) {
    const [orgEvents] = await sequelize.query(
      `
      SELECT id FROM events
      WHERE organization_id = ?
      ORDER BY updated_at DESC
      LIMIT 1;
      `,
      { replacements: [organizationId] }
    );
    if (orgEvents[0]?.id) return orgEvents[0].id;
  }

  const [eventRows] = await sequelize.query(
    "SELECT id FROM events WHERE user_id = ? LIMIT 1;",
    { replacements: [userId] }
  );
  if (eventRows[0]?.id) return eventRows[0].id;

  const [weddingRows] = await sequelize.query(
    "SELECT event_id FROM weddings WHERE user_id = ? AND event_id IS NOT NULL LIMIT 1;",
    { replacements: [userId] }
  );
  return weddingRows[0]?.event_id || null;
}

async function loadEventRow(eventId) {
  const [rows] = await sequelize.query(
    `
    SELECT id, name, type, organization_id, user_id,
           ticketing_enabled, is_ticketing_enabled,
           total_ticket_limit, free_ticket_allocation, template_config
    FROM events
    WHERE id = ?
    LIMIT 1;
    `,
    { replacements: [eventId] }
  );
  return rows[0] || null;
}

function parseTemplateConfig(raw) {
  if (!raw) return {};
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
}

function eventTicketingEnabled(row) {
  if (!row) return false;
  if (row.is_ticketing_enabled != null) {
    return Boolean(Number(row.is_ticketing_enabled));
  }
  return Boolean(Number(row.ticketing_enabled));
}

async function setTicketingFlags(eventId, isEnabled, { totalLimit, freeAllocation, config } = {}) {
  const enabled = isEnabled ? 1 : 0;
  const replacements = [enabled, enabled];
  let sql =
    "UPDATE events SET is_ticketing_enabled = ?, ticketing_enabled = ?";

  if (totalLimit != null) {
    sql += ", total_ticket_limit = ?";
    replacements.push(totalLimit);
  }
  if (freeAllocation != null) {
    sql += ", free_ticket_allocation = ?";
    replacements.push(freeAllocation);
  }
  if (config != null) {
    sql += ", template_config = ?";
    replacements.push(JSON.stringify(config));
  }
  sql += ", updated_at = NOW() WHERE id = ?;";
  replacements.push(eventId);
  await sequelize.query(sql, { replacements });
}

async function seedDefaultTicketsIfEmpty(eventId) {
  const [existing] = await sequelize.query(
    "SELECT COUNT(*) AS cnt FROM ticket_types WHERE event_id = ?;",
    { replacements: [eventId] }
  );
  if (Number(existing[0]?.cnt || 0) === 0) {
    for (const item of DEFAULT_TICKETS) {
      await sequelize.query(
        `INSERT INTO ticket_types (id, event_id, name, price, description, display_order)
         VALUES (?, ?, ?, ?, ?, ?);`,
        {
          replacements: [
            crypto.randomUUID(),
            eventId,
            item.name,
            item.price,
            item.description,
            item.display_order,
          ],
        }
      );
    }
  }
}

function mapTicketTypeRow(t) {
  const quantity = t.quantity != null ? Number(t.quantity) : null;
  const soldCount = Number(t.sold_count || 0);
  const remaining =
    quantity == null || Number.isNaN(quantity)
      ? null
      : Math.max(0, quantity - soldCount);
  return {
    id: t.id,
    name: t.name,
    price: Number(t.price),
    description: t.description || "",
    quantity,
    soldCount,
    remaining,
    displayOrder: t.display_order,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

async function getTicketingSettings(req, res) {
  try {
    const eventId = await resolveEventId(req);
    if (!eventId) {
      return res.status(404).json({
        error: "Not Found",
        message: "No event found for this account",
      });
    }

    const event = await loadEventRow(eventId);
    if (!event) {
      return res.status(404).json({
        error: "Not Found",
        message: "Event not found",
      });
    }

    const config = parseTemplateConfig(event.template_config);
    const totalTicketLimit =
      event.total_ticket_limit != null
        ? Number(event.total_ticket_limit)
        : config?.totalTicketLimit != null
          ? Number(config.totalTicketLimit)
          : 1000;

    const freeTicketAllocation =
      event.free_ticket_allocation != null
        ? Number(event.free_ticket_allocation)
        : config?.freeTicketAllocation != null
          ? Number(config.freeTicketAllocation)
          : 50;

    if (eventTicketingEnabled(event) && isCorporateOrParty(event.type)) {
      await seedDefaultTicketsIfEmpty(eventId);
    }

    const [ticketTypes] = await sequelize.query(
      `
      SELECT
        tt.id,
        tt.event_id,
        tt.name,
        tt.price,
        tt.description,
        tt.quantity,
        tt.display_order,
        tt.created_at,
        tt.updated_at,
        (
          SELECT COUNT(*)
          FROM tickets tk
          WHERE tk.tier_id = tt.id
            AND tk.event_id = tt.event_id
        ) AS sold_count
      FROM ticket_types tt
      WHERE tt.event_id = ?
      ORDER BY tt.display_order ASC, tt.created_at ASC;
      `,
      { replacements: [eventId] }
    );

    return res.status(200).json({
      ok: true,
      eventId,
      eventName: event.name,
      eventType: event.type,
      isTicketingEnabled: eventTicketingEnabled(event),
      totalTicketLimit,
      freeTicketAllocation,
      ticketTypes: ticketTypes.map(mapTicketTypeRow),
    });
  } catch (err) {
    console.error("getTicketingSettings error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load ticketing settings",
    });
  }
}

async function updateTicketingSettings(req, res) {
  try {
    const eventId = await resolveEventId(req);
    if (!eventId) {
      return res.status(404).json({
        error: "Not Found",
        message: "No event found for this account",
      });
    }

    const event = await loadEventRow(eventId);
    if (!event) {
      return res.status(404).json({
        error: "Not Found",
        message: "Event not found",
      });
    }

    if (!isCorporateOrParty(event.type)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Ticketing settings are only available for party or corporate events",
      });
    }

    const config = parseTemplateConfig(event.template_config);

    let isEnabled = eventTicketingEnabled(event);
    if (req.body?.isTicketingEnabled !== undefined) {
      isEnabled = Boolean(req.body.isTicketingEnabled);
      config.isTicketingEnabled = isEnabled;
    }

    let totalLimit =
      event.total_ticket_limit != null
        ? Number(event.total_ticket_limit)
        : config.totalTicketLimit ?? 1000;
    if (req.body?.totalTicketLimit !== undefined) {
      totalLimit = Math.max(1, Number(req.body.totalTicketLimit) || 1000);
      config.totalTicketLimit = totalLimit;
    }

    let freeAllocation =
      event.free_ticket_allocation != null
        ? Number(event.free_ticket_allocation)
        : config.freeTicketAllocation ?? 50;
    if (req.body?.freeTicketAllocation !== undefined) {
      freeAllocation = Math.max(0, Number(req.body.freeTicketAllocation) || 0);
      config.freeTicketAllocation = freeAllocation;
    }

    if (freeAllocation > totalLimit) freeAllocation = totalLimit;

    await setTicketingFlags(eventId, isEnabled, {
      totalLimit,
      freeAllocation,
      config,
    });

    if (isEnabled) {
      await seedDefaultTicketsIfEmpty(eventId);
    }

    return res.status(200).json({
      ok: true,
      isTicketingEnabled: isEnabled,
      totalTicketLimit: totalLimit,
      freeTicketAllocation: freeAllocation,
    });
  } catch (err) {
    console.error("updateTicketingSettings error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update ticketing settings",
    });
  }
}

async function toggleTicketing(req, res) {
  try {
    const eventId = await resolveEventId(req);
    if (!eventId) {
      return res.status(404).json({
        error: "Not Found",
        message: "No event found for this account",
      });
    }

    const event = await loadEventRow(eventId);
    if (!event) {
      return res.status(404).json({
        error: "Not Found",
        message: "Event not found",
      });
    }

    const isEnabled = Boolean(req.body?.isTicketingEnabled);

    if (isEnabled && !isCorporateOrParty(event.type)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Ticketing cannot be enabled for wedding events",
      });
    }

    const config = parseTemplateConfig(event.template_config);
    config.isTicketingEnabled = isEnabled;

    let totalLimit =
      event.total_ticket_limit != null
        ? Number(event.total_ticket_limit)
        : config.totalTicketLimit || 1000;
    let freeAllocation =
      event.free_ticket_allocation != null
        ? Number(event.free_ticket_allocation)
        : config.freeTicketAllocation || 50;

    if (req.body?.totalTicketLimit !== undefined) {
      totalLimit = Math.max(1, Number(req.body.totalTicketLimit) || 1000);
      config.totalTicketLimit = totalLimit;
    }
    if (req.body?.freeTicketAllocation !== undefined) {
      freeAllocation = Math.max(0, Number(req.body.freeTicketAllocation) || 0);
      config.freeTicketAllocation = freeAllocation;
    }

    await setTicketingFlags(eventId, isEnabled, {
      totalLimit,
      freeAllocation,
      config,
    });

    if (isEnabled) {
      await seedDefaultTicketsIfEmpty(eventId);
    }

    return res.status(200).json({
      ok: true,
      isTicketingEnabled: isEnabled,
      totalTicketLimit: totalLimit,
      freeTicketAllocation: freeAllocation,
    });
  } catch (err) {
    console.error("toggleTicketing error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update ticketing option",
    });
  }
}

async function createTicketType(req, res) {
  try {
    const eventId = await resolveEventId(req);
    if (!eventId) {
      return res.status(404).json({
        error: "Not Found",
        message: "No event found for this account",
      });
    }

    const event = await loadEventRow(eventId);
    if (!event) {
      return res.status(404).json({
        error: "Not Found",
        message: "Event not found",
      });
    }
    if (!isCorporateOrParty(event.type)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Ticket types are only available for party or corporate events",
      });
    }

    const name = String(req.body?.name || "").trim();
    const price = Number(req.body?.price ?? 0);
    const description = String(req.body?.description || "").trim();
    const quantity =
      req.body?.quantity != null && req.body?.quantity !== ""
        ? Number(req.body.quantity)
        : null;

    if (!name) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Ticket name is required",
      });
    }

    if (Number.isNaN(price) || price < 0) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Ticket price must be a valid non-negative number",
      });
    }

    if (
      quantity != null &&
      (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 1)
    ) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Ticket amount must be a whole number of at least 1",
      });
    }

    const id = crypto.randomUUID();
    const [maxOrderRows] = await sequelize.query(
      "SELECT COALESCE(MAX(display_order), 0) AS max_order FROM ticket_types WHERE event_id = ?;",
      { replacements: [eventId] }
    );
    const displayOrder = Number(maxOrderRows[0]?.max_order || 0) + 1;

    await sequelize.query(
      `INSERT INTO ticket_types (id, event_id, name, price, description, quantity, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      {
        replacements: [
          id,
          eventId,
          name,
          price,
          description || null,
          quantity,
          displayOrder,
        ],
      }
    );

    const [createdRows] = await sequelize.query(
      `
      SELECT
        tt.id,
        tt.event_id,
        tt.name,
        tt.price,
        tt.description,
        tt.quantity,
        tt.display_order,
        tt.created_at,
        tt.updated_at,
        0 AS sold_count
      FROM ticket_types tt
      WHERE tt.id = ?
      LIMIT 1;
      `,
      { replacements: [id] }
    );

    return res.status(201).json({
      ok: true,
      ticketType: mapTicketTypeRow(createdRows[0]),
    });
  } catch (err) {
    console.error("createTicketType error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create ticket type",
    });
  }
}

async function updateTicketType(req, res) {
  try {
    const eventId = await resolveEventId(req);
    const ticketId = String(req.params?.id || "").trim();

    if (!eventId || !ticketId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Event and ticket ID are required",
      });
    }

    const name = String(req.body?.name || "").trim();
    const price = Number(req.body?.price ?? 0);
    const description = String(req.body?.description || "").trim();
    const quantity =
      req.body?.quantity != null && req.body?.quantity !== ""
        ? Number(req.body.quantity)
        : null;

    if (!name) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Ticket name is required",
      });
    }

    if (Number.isNaN(price) || price < 0) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Ticket price must be a valid non-negative number",
      });
    }

    if (
      quantity != null &&
      (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 1)
    ) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Ticket amount must be a whole number of at least 1",
      });
    }

    if (quantity != null) {
      const [soldRows] = await sequelize.query(
        `
        SELECT COUNT(*) AS sold_count
        FROM tickets
        WHERE tier_id = ? AND event_id = ?;
        `,
        { replacements: [ticketId, eventId] }
      );
      const soldCount = Number(soldRows[0]?.sold_count || 0);
      if (quantity < soldCount) {
        return res.status(400).json({
          error: "Bad Request",
          message: `Ticket amount cannot be less than already sold tickets (${soldCount})`,
        });
      }
    }

    await sequelize.query(
      `UPDATE ticket_types
       SET name = ?, price = ?, description = ?, quantity = ?, updated_at = NOW()
       WHERE id = ? AND event_id = ?;`,
      {
        replacements: [
          name,
          price,
          description || null,
          quantity,
          ticketId,
          eventId,
        ],
      }
    );

    const [updatedRows] = await sequelize.query(
      `
      SELECT
        tt.id,
        tt.event_id,
        tt.name,
        tt.price,
        tt.description,
        tt.quantity,
        tt.display_order,
        tt.created_at,
        tt.updated_at,
        (
          SELECT COUNT(*)
          FROM tickets tk
          WHERE tk.tier_id = tt.id
            AND tk.event_id = tt.event_id
        ) AS sold_count
      FROM ticket_types tt
      WHERE tt.id = ?
      LIMIT 1;
      `,
      { replacements: [ticketId] }
    );

    if (!updatedRows.length) {
      return res.status(404).json({
        error: "Not Found",
        message: "Ticket type not found",
      });
    }

    return res.status(200).json({
      ok: true,
      ticketType: mapTicketTypeRow(updatedRows[0]),
    });
  } catch (err) {
    console.error("updateTicketType error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update ticket type",
    });
  }
}

async function deleteTicketType(req, res) {
  try {
    const eventId = await resolveEventId(req);
    const ticketId = String(req.params?.id || "").trim();

    if (!eventId || !ticketId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Event and ticket ID are required",
      });
    }

    await sequelize.query(
      "DELETE FROM ticket_types WHERE id = ? AND event_id = ?;",
      { replacements: [ticketId, eventId] }
    );

    return res.status(200).json({
      ok: true,
      message: "Ticket type deleted successfully",
    });
  } catch (err) {
    console.error("deleteTicketType error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete ticket type",
    });
  }
}

module.exports = {
  getTicketingSettings,
  toggleTicketing,
  updateTicketingSettings,
  createTicketType,
  updateTicketType,
  deleteTicketType,
  resolveEventId,
  eventTicketingEnabled,
};
