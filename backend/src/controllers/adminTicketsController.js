const { sequelize } = require("../models");
const {
  mapTicketRow,
  parseTicketIdFromScan,
  formatTicketQrText,
} = require("../utils/ticketing");

async function listEventTickets(req, res) {
  try {
    const eventId = String(req.params.id || "").trim();
    if (!eventId) {
      return res.status(400).json({ error: "Bad Request", message: "id is required" });
    }

    const [events] = await sequelize.query(
      `SELECT id FROM events WHERE id = ? LIMIT 1;`,
      { replacements: [eventId] }
    );
    if (!events[0]) {
      return res.status(404).json({ error: "Not Found", message: "Event not found" });
    }

    const status = String(req.query.status || "").trim().toLowerCase();
    const replacements = [eventId];
    let statusClause = "";
    if (status === "valid" || status === "invalid") {
      statusClause = "AND t.status = ?";
      replacements.push(status);
    }

    const [rows] = await sequelize.query(
      `
      SELECT
        t.*,
        g.full_name AS guest_name
      FROM tickets t
      LEFT JOIN guests g ON g.id = t.guest_id
      WHERE t.event_id = ?
        ${statusClause}
      ORDER BY t.issued_at DESC;
      `,
      { replacements }
    );

    return res.status(200).json({
      tickets: rows.map((row) => ({
        ...mapTicketRow(row),
        guestName: row.guest_name || null,
        qrText: formatTicketQrText({
          guestName: row.guest_name || "Guest",
          tierName: row.tier_name,
          ticketCode: row.ticket_code,
        }),
      })),
    });
  } catch (err) {
    console.error("admin listEventTickets error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to list tickets",
    });
  }
}

async function scanEventTicket(req, res) {
  try {
    const eventId = String(req.params.id || "").trim();
    const rawScan = String(
      req.body?.ticketCode ||
        req.body?.ticket_code ||
        req.body?.qrText ||
        req.body?.qr_text ||
        req.body?.scan ||
        ""
    ).trim();
    const ticketCode = parseTicketIdFromScan(rawScan);

    if (!eventId) {
      return res.status(400).json({ error: "Bad Request", message: "id is required" });
    }
    if (!ticketCode) {
      return res.status(400).json({
        error: "Bad Request",
        message: "ticketCode is required",
      });
    }

    const [events] = await sequelize.query(
      `SELECT id FROM events WHERE id = ? LIMIT 1;`,
      { replacements: [eventId] }
    );
    if (!events[0]) {
      return res.status(404).json({ error: "Not Found", message: "Event not found" });
    }

    const [rows] = await sequelize.query(
      `
      SELECT
        t.*,
        g.full_name AS guest_name
      FROM tickets t
      LEFT JOIN guests g ON g.id = t.guest_id
      WHERE t.event_id = ? AND t.ticket_code = ?
      LIMIT 1;
      `,
      { replacements: [eventId, ticketCode] }
    );
    const ticket = rows[0];
    if (!ticket) {
      return res.status(404).json({
        error: "Not Found",
        message: "Ticket not found",
      });
    }

    const guestName = ticket.guest_name || "Guest";
    const details = {
      guestName,
      ticketType: ticket.tier_name || "",
      ticketId: ticket.ticket_code,
      ticketCode: ticket.ticket_code,
      qrText: formatTicketQrText({
        guestName,
        tierName: ticket.tier_name,
        ticketCode: ticket.ticket_code,
      }),
    };

    if (ticket.status === "invalid") {
      return res.status(409).json({
        error: "Conflict",
        message: "Ticket is already invalid and cannot be used for entry",
        ...details,
        ticket: mapTicketRow(ticket),
      });
    }

    const adminUserId = req.user?.id || null;
    await sequelize.query(
      `
      UPDATE tickets
      SET status = 'invalid',
          invalidated_at = NOW(),
          invalidated_by = ?,
          updated_at = NOW()
      WHERE id = ? AND status = 'valid';
      `,
      { replacements: [adminUserId, ticket.id] }
    );

    const [updatedRows] = await sequelize.query(
      `
      SELECT t.*, g.full_name AS guest_name
      FROM tickets t
      LEFT JOIN guests g ON g.id = t.guest_id
      WHERE t.id = ?
      LIMIT 1;
      `,
      { replacements: [ticket.id] }
    );

    const updated = updatedRows[0];
    return res.status(200).json({
      ...details,
      guestName: updated.guest_name || guestName,
      authorized: true,
      ticket: {
        ...mapTicketRow(updated),
        guestName: updated.guest_name || guestName,
      },
    });
  } catch (err) {
    console.error("admin scanEventTicket error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to scan ticket",
    });
  }
}

module.exports = {
  listEventTickets,
  scanEventTicket,
};
