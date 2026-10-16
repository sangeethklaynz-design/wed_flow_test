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

async function resolveEventId(req) {
  // If explicitly specified in params (e.g., admin endpoint)
  if (req.params?.eventId) {
    return req.params.eventId;
  }

  const userId = req.user?.id;
  if (!userId) return null;

  // 1. Direct event_id on req.user
  if (req.user?.eventId) {
    return req.user.eventId;
  }

  // 2. Query events table by user_id
  const [eventRows] = await sequelize.query(
    "SELECT id FROM events WHERE user_id = ? LIMIT 1;",
    { replacements: [userId] }
  );
  if (eventRows[0]?.id) {
    return eventRows[0].id;
  }

  // 3. Query weddings table for linked event_id
  const [weddingRows] = await sequelize.query(
    "SELECT event_id FROM weddings WHERE user_id = ? AND event_id IS NOT NULL LIMIT 1;",
    { replacements: [userId] }
  );
  if (weddingRows[0]?.event_id) {
    return weddingRows[0].event_id;
  }

  // 4. Fallback: check if wedding exists and create/link an event if needed
  const [fallbackWeddings] = await sequelize.query(
    "SELECT id, couple_names, wedding_date FROM weddings WHERE user_id = ? LIMIT 1;",
    { replacements: [userId] }
  );
  if (fallbackWeddings[0]) {
    const wedding = fallbackWeddings[0];
    const newEventId = crypto.randomUUID();
    await sequelize.query(
      `INSERT INTO events (id, user_id, name, type, template_key, resource_pack_id, event_date, is_ticketing_enabled)
       VALUES (?, ?, ?, 'wedding', 'template-1', ?, ?, 0);`,
      {
        replacements: [
          newEventId,
          userId,
          wedding.couple_names || "Event",
          newEventId,
          wedding.wedding_date || new Date().toISOString().slice(0, 10),
        ],
      }
    );
    await sequelize.query(
      "UPDATE weddings SET event_id = ? WHERE id = ?;",
      { replacements: [newEventId, wedding.id] }
    );
    return newEventId;
  }

  return null;
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

async function getTicketingSettings(req, res) {
  try {
    const eventId = await resolveEventId(req);
    if (!eventId) {
      return res.status(404).json({
        error: "Not Found",
        message: "No event found for this account",
      });
    }

    const [eventRows] = await sequelize.query(
      "SELECT id, name, is_ticketing_enabled, template_config FROM events WHERE id = ? LIMIT 1;",
      { replacements: [eventId] }
    );
    if (!eventRows.length) {
      return res.status(404).json({
        error: "Not Found",
        message: "Event not found",
      });
    }

    await seedDefaultTicketsIfEmpty(eventId);

    const [ticketTypes] = await sequelize.query(
      `SELECT id, event_id, name, price, description, quantity, display_order, created_at, updated_at
       FROM ticket_types
       WHERE event_id = ?
       ORDER BY display_order ASC, created_at ASC;`,
      { replacements: [eventId] }
    );

    return res.status(200).json({
      ok: true,
      eventId,
      eventName: eventRows[0].name,
      isTicketingEnabled: Boolean(Number(eventRows[0].is_ticketing_enabled)),
      ticketTypes: ticketTypes.map((t) => ({
        id: t.id,
        name: t.name,
        price: Number(t.price),
        description: t.description || "",
        quantity: t.quantity != null ? Number(t.quantity) : null,
        displayOrder: t.display_order,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })),
    });
  } catch (err) {
    console.error("getTicketingSettings error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load ticketing settings",
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

    const isEnabled = Boolean(req.body?.isTicketingEnabled);

    // Update is_ticketing_enabled column
    await sequelize.query(
      "UPDATE events SET is_ticketing_enabled = ?, updated_at = NOW() WHERE id = ?;",
      { replacements: [isEnabled ? 1 : 0, eventId] }
    );

    // Also update template_config JSON
    const [eventRows] = await sequelize.query(
      "SELECT template_config FROM events WHERE id = ? LIMIT 1;",
      { replacements: [eventId] }
    );

    let config = {};
    if (eventRows[0]?.template_config) {
      try {
        config =
          typeof eventRows[0].template_config === "string"
            ? JSON.parse(eventRows[0].template_config)
            : eventRows[0].template_config;
      } catch {
        config = {};
      }
    }

    config.isTicketingEnabled = isEnabled;
    await sequelize.query(
      "UPDATE events SET template_config = ?, updated_at = NOW() WHERE id = ?;",
      { replacements: [JSON.stringify(config), eventId] }
    );

    return res.status(200).json({
      ok: true,
      isTicketingEnabled: isEnabled,
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
      "SELECT id, event_id, name, price, description, quantity, display_order, created_at, updated_at FROM ticket_types WHERE id = ? LIMIT 1;",
      { replacements: [id] }
    );

    const t = createdRows[0];
    return res.status(201).json({
      ok: true,
      ticketType: {
        id: t.id,
        name: t.name,
        price: Number(t.price),
        description: t.description || "",
        quantity: t.quantity != null ? Number(t.quantity) : null,
        displayOrder: t.display_order,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      },
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
      "SELECT id, event_id, name, price, description, quantity, display_order, created_at, updated_at FROM ticket_types WHERE id = ? LIMIT 1;",
      { replacements: [ticketId] }
    );

    if (!updatedRows.length) {
      return res.status(404).json({
        error: "Not Found",
        message: "Ticket type not found",
      });
    }

    const t = updatedRows[0];
    return res.status(200).json({
      ok: true,
      ticketType: {
        id: t.id,
        name: t.name,
        price: Number(t.price),
        description: t.description || "",
        quantity: t.quantity != null ? Number(t.quantity) : null,
        displayOrder: t.display_order,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      },
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

    const [result] = await sequelize.query(
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
  createTicketType,
  updateTicketType,
  deleteTicketType,
};
