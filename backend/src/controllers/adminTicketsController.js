const { sequelize } = require("../models");
const { mapTicketRow } = require("../utils/ticketing");

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
      statusClause = "AND status = ?";
      replacements.push(status);
    }

    const [rows] = await sequelize.query(
      `
      SELECT *
      FROM tickets
      WHERE event_id = ?
        ${statusClause}
      ORDER BY issued_at DESC;
      `,
      { replacements }
    );

    return res.status(200).json({
      tickets: rows.map(mapTicketRow),
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
    // QR CODE
    const ticketCode = String(req.body?.ticketCode || req.body?.ticket_code || "")
      .trim();

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
      SELECT *
      FROM tickets
      WHERE event_id = ? AND ticket_code = ?
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

    if (ticket.status === "invalid") {
      return res.status(409).json({
        error: "Conflict",
        message: "Ticket is already invalid and cannot be used for entry",
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
      `SELECT * FROM tickets WHERE id = ? LIMIT 1;`,
      { replacements: [ticket.id] }
    );

    return res.status(200).json({
      ticket: mapTicketRow(updatedRows[0]),
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
