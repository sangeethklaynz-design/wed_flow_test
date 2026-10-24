const { sequelize } = require("../models");
const { mapGuestRow } = require("./guestsController");

function mapTicketRow(row) {
  const status = String(row.status || "valid").toLowerCase();
  return {
    id: row.id,
    ticketCode: row.ticket_code || "",
    ticketType: row.tier_name || "",
    price: Number(row.price) || 0,
    currency: row.currency || "LKR",
    status: status === "invalid" ? "used" : "unused",
    rawStatus: status,
    issuedAt: row.issued_at || null,
    invalidatedAt: row.invalidated_at || null,
  };
}

function mapAdminGuestRow(row, tickets = []) {
  const base = mapGuestRow(row);
  const ticketStatus = String(row.ticket_usage_status || "none").toLowerCase();
  return {
    ...base,
    ticketStatus,
    ticketCount: Number(row.ticket_count) || 0,
    ticketsBought: Number(row.ticket_count) || 0,
    usedTicketCount: Number(row.used_ticket_count) || 0,
    unusedTicketCount: Number(row.unused_ticket_count) || 0,
    weddingId: row.wedding_id || null,
    tickets,
  };
}

const GUEST_SELECT = `
  g.id,
  g.wedding_id,
  g.full_name,
  g.whatsapp_number,
  g.email,
  g.id_number,
  g.invited_count,
  g.invitation_note,
  g.table_number,
  g.unique_token,
  g.source,
  g.payment_due_at,
  g.event_id,
  g.organization_id,
  g.rsvp_status,
  g.has_change_request,
  g.invite_shared_at,
  g.is_pinned,
  r.id AS rsvp_id,
  r.attending_status,
  r.attending_count,
  r.wishes,
  r.submitted_at,
  e.name AS event_name,
  e.type AS event_type,
  COALESCE(e.is_ticketing_enabled, e.ticketing_enabled, 0) AS is_ticketing_enabled,
  org.name AS organization_name,
  (
    SELECT COUNT(*) FROM tickets tk WHERE tk.guest_id = g.id
  ) AS ticket_count,
  (
    SELECT COUNT(*) FROM tickets tk WHERE tk.guest_id = g.id AND tk.status = 'invalid'
  ) AS used_ticket_count,
  (
    SELECT COUNT(*) FROM tickets tk WHERE tk.guest_id = g.id AND tk.status = 'valid'
  ) AS unused_ticket_count,
  (
    CASE
      WHEN (SELECT COUNT(*) FROM tickets tk WHERE tk.guest_id = g.id) = 0 THEN 'none'
      WHEN (SELECT COUNT(*) FROM tickets tk WHERE tk.guest_id = g.id AND tk.status = 'valid') = 0 THEN 'used'
      WHEN (SELECT COUNT(*) FROM tickets tk WHERE tk.guest_id = g.id AND tk.status = 'invalid') = 0 THEN 'unused'
      ELSE 'partial'
    END
  ) AS ticket_usage_status
`;

async function listAdminGuests(req, res) {
  try {
    const organizationId = String(
      req.query.organizationId || req.query.organization_id || ""
    ).trim();
    const eventId = String(req.query.eventId || req.query.event_id || "").trim();
    const eventType = String(
      req.query.eventType || req.query.event_type || ""
    )
      .trim()
      .toLowerCase();
    const source = String(req.query.source || "").trim().toLowerCase();
    const q = String(req.query.q || req.query.search || "").trim();

    // Admin guests track party/corporate only — never weddings
    const where = ["e.type IN ('corporate', 'party')"];
    const replacements = [];

    if (organizationId) {
      where.push("(g.organization_id = ? OR e.organization_id = ?)");
      replacements.push(organizationId, organizationId);
    }
    if (eventId) {
      where.push("(g.event_id = ? OR w.event_id = ?)");
      replacements.push(eventId, eventId);
    }
    if (eventType === "corporate" || eventType === "party") {
      where.push("e.type = ?");
      replacements.push(eventType);
    }
    if (source === "manual" || source === "public") {
      where.push("g.source = ?");
      replacements.push(source);
    }
    if (q) {
      const like = `%${q}%`;
      where.push(
        "(g.full_name LIKE ? OR g.whatsapp_number LIKE ? OR g.email LIKE ? OR g.id_number LIKE ?)"
      );
      replacements.push(like, like, like, like);
    }

    const [rows] = await sequelize.query(
      `
      SELECT
        ${GUEST_SELECT},
        rcr.reason AS change_request_reason
      FROM guests g
      LEFT JOIN weddings w ON w.id = g.wedding_id
      INNER JOIN events e ON e.id = COALESCE(g.event_id, w.event_id)
      LEFT JOIN organizations org ON org.id = COALESCE(g.organization_id, e.organization_id)
      LEFT JOIN rsvps r ON r.guest_id = g.id
      LEFT JOIN rsvp_change_requests rcr
        ON rcr.guest_id = g.id
        AND rcr.created_at = (
          SELECT MAX(rcr2.created_at)
          FROM rsvp_change_requests rcr2
          WHERE rcr2.guest_id = g.id
        )
      WHERE ${where.join(" AND ")}
      ORDER BY g.is_pinned DESC, g.full_name ASC
      LIMIT 1000;
      `,
      { replacements }
    );

    return res.status(200).json({
      guests: rows.map((row) => mapAdminGuestRow(row)),
    });
  } catch (err) {
    console.error("listAdminGuests error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to list guests",
    });
  }
}

async function getAdminGuestsMeta(req, res) {
  try {
    const [organizations] = await sequelize.query(
      `
      SELECT id, name, type
      FROM organizations
      WHERE type = 'vendor'
      ORDER BY name ASC;
      `
    );
    const [events] = await sequelize.query(
      `
      SELECT
        e.id,
        e.name,
        e.type,
        e.organization_id,
        org.name AS organization_name
      FROM events e
      LEFT JOIN organizations org ON org.id = e.organization_id
      WHERE e.type IN ('corporate', 'party')
      ORDER BY e.event_date DESC, e.name ASC;
      `
    );

    return res.status(200).json({
      organizations: organizations.map((o) => ({
        id: o.id,
        name: o.name,
        type: o.type,
      })),
      events: events.map((e) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        organizationId: e.organization_id || null,
        organizationName: e.organization_name || null,
      })),
    });
  } catch (err) {
    console.error("getAdminGuestsMeta error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load guests meta",
    });
  }
}

async function loadTicketsForGuest(guestId) {
  const [rows] = await sequelize.query(
    `
    SELECT
      id, ticket_code, tier_name, price, currency, status,
      issued_at, invalidated_at
    FROM tickets
    WHERE guest_id = ?
    ORDER BY issued_at ASC, tier_name ASC;
    `,
    { replacements: [guestId] }
  );
  return rows.map(mapTicketRow);
}

async function loadAdminGuestById(guestId) {
  const [rows] = await sequelize.query(
    `
    SELECT
      ${GUEST_SELECT},
      NULL AS change_request_reason
    FROM guests g
    LEFT JOIN weddings w ON w.id = g.wedding_id
    INNER JOIN events e ON e.id = COALESCE(g.event_id, w.event_id)
    LEFT JOIN organizations org ON org.id = COALESCE(g.organization_id, e.organization_id)
    LEFT JOIN rsvps r ON r.guest_id = g.id
    WHERE g.id = ?
      AND e.type IN ('corporate', 'party')
    LIMIT 1;
    `,
    { replacements: [guestId] }
  );
  if (!rows[0]) return null;
  const tickets = await loadTicketsForGuest(guestId);
  return mapAdminGuestRow(rows[0], tickets);
}

async function getAdminGuest(req, res) {
  try {
    const guestId = String(req.params.id || "").trim();
    if (!guestId) {
      return res.status(400).json({ error: "Bad Request", message: "id is required" });
    }
    const guest = await loadAdminGuestById(guestId);
    if (!guest) {
      return res.status(404).json({ error: "Not Found", message: "Guest not found" });
    }
    return res.status(200).json({ guest });
  } catch (err) {
    console.error("getAdminGuest error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load guest",
    });
  }
}

async function updateAdminGuest(req, res) {
  try {
    const guestId = String(req.params.id || "").trim();
    if (!guestId) {
      return res.status(400).json({ error: "Bad Request", message: "id is required" });
    }

    const [existing] = await sequelize.query(
      `
      SELECT g.id
      FROM guests g
      LEFT JOIN weddings w ON w.id = g.wedding_id
      INNER JOIN events e ON e.id = COALESCE(g.event_id, w.event_id)
      WHERE g.id = ?
        AND e.type IN ('corporate', 'party')
      LIMIT 1;
      `,
      { replacements: [guestId] }
    );
    if (!existing[0]) {
      return res.status(404).json({ error: "Not Found", message: "Guest not found" });
    }

    // Only guest-owned fields are editable — ticket/status/system fields are not
    const name = String(req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const email =
      req.body?.email !== undefined
        ? String(req.body.email || "").trim() || null
        : undefined;
    const idNumber =
      req.body?.idNumber !== undefined || req.body?.id_number !== undefined
        ? String(req.body?.idNumber || req.body?.id_number || "").trim() || null
        : undefined;

    if (!name || !phone) {
      return res.status(400).json({
        error: "Bad Request",
        message: "name and phone are required",
      });
    }

    const sets = ["full_name = ?", "whatsapp_number = ?"];
    const replacements = [name, phone];

    if (email !== undefined) {
      sets.push("email = ?");
      replacements.push(email);
    }
    if (idNumber !== undefined) {
      sets.push("id_number = ?");
      replacements.push(idNumber);
    }

    replacements.push(guestId);

    await sequelize.query(
      `
      UPDATE guests
      SET ${sets.join(",\n          ")}
      WHERE id = ?;
      `,
      { replacements }
    );

    const guest = await loadAdminGuestById(guestId);
    return res.status(200).json({ guest });
  } catch (err) {
    console.error("updateAdminGuest error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update guest",
    });
  }
}

async function deleteAdminGuest(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const guestId = String(req.params.id || "").trim();
    if (!guestId) {
      await transaction.rollback();
      return res.status(400).json({ error: "Bad Request", message: "id is required" });
    }

    const [existing] = await sequelize.query(
      `
      SELECT g.id
      FROM guests g
      LEFT JOIN weddings w ON w.id = g.wedding_id
      INNER JOIN events e ON e.id = COALESCE(g.event_id, w.event_id)
      WHERE g.id = ?
        AND e.type IN ('corporate', 'party')
      LIMIT 1;
      `,
      { replacements: [guestId], transaction }
    );
    if (!existing[0]) {
      await transaction.rollback();
      return res.status(404).json({ error: "Not Found", message: "Guest not found" });
    }

    await sequelize.query(`DELETE FROM rsvp_change_requests WHERE guest_id = ?;`, {
      replacements: [guestId],
      transaction,
    });
    await sequelize.query(`DELETE FROM rsvps WHERE guest_id = ?;`, {
      replacements: [guestId],
      transaction,
    });
    await sequelize.query(`UPDATE tickets SET guest_id = NULL WHERE guest_id = ?;`, {
      replacements: [guestId],
      transaction,
    });
    await sequelize.query(`DELETE FROM guests WHERE id = ?;`, {
      replacements: [guestId],
      transaction,
    });

    await transaction.commit();
    return res.status(200).json({ ok: true });
  } catch (err) {
    try {
      await transaction.rollback();
    } catch {
      // ignore
    }
    console.error("deleteAdminGuest error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete guest",
    });
  }
}

module.exports = {
  listAdminGuests,
  getAdminGuestsMeta,
  getAdminGuest,
  updateAdminGuest,
  deleteAdminGuest,
};
