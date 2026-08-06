const crypto = require("crypto");
const { sequelize } = require("../models");
const { getWeddingForUser } = require("../utils/wedding");

function mapGuestRow(row) {
  const status = String(row.rsvp_status || "PENDING").toLowerCase();
  const invitedCount = Number(row.invited_count) || 1;
  const rsvpCount = Number(row.attending_count) || 0;
  const attendingStatus = row.attending_status
    ? String(row.attending_status).toLowerCase()
    : "pending";

  return {
    id: row.id,
    name: row.full_name,
    phone: row.whatsapp_number,
    status,
    guestCount: invitedCount,
    invitedCount,
    rsvpCount,
    tableNumber: row.table_number || "",
    note: row.invitation_note || "",
    guestNotes: row.wishes || "",
    uniqueToken: row.unique_token,
    rsvp: {
      hasSubmitted: Boolean(row.submitted_at),
      attendingStatus,
      attendingCount: rsvpCount,
      wishes: row.wishes || "",
      submittedAt: row.submitted_at,
    },
  };
}

async function fetchGuestsForWedding(weddingId, guestId = null) {
  const replacements = guestId ? [weddingId, guestId] : [weddingId];
  const whereGuest = guestId ? "AND g.id = ?" : "";

  const [rows] = await sequelize.query(
    `
    SELECT
      g.id,
      g.full_name,
      g.whatsapp_number,
      g.invited_count,
      g.invitation_note,
      g.table_number,
      g.unique_token,
      g.rsvp_status,
      r.id AS rsvp_id,
      r.attending_status,
      r.attending_count,
      r.wishes,
      r.submitted_at
    FROM guests g
    LEFT JOIN rsvps r ON r.guest_id = g.id
    WHERE g.wedding_id = ?
    ${whereGuest}
    ORDER BY g.full_name ASC;
    `,
    { replacements }
  );

  return rows;
}

async function assertWedding(req) {
  const wedding = await getWeddingForUser(req.user.id, req.user.weddingId);
  if (!wedding) {
    return { error: { status: 404, message: "No wedding found for this account" } };
  }
  return { wedding };
}

async function listGuests(req, res) {
  try {
    const { wedding, error } = await assertWedding(req);
    if (error) {
      return res.status(error.status).json({
        error: "Not Found",
        message: error.message,
      });
    }

    const rows = await fetchGuestsForWedding(wedding.id);
    return res.status(200).json({
      guests: rows.map(mapGuestRow),
    });
  } catch (err) {
    console.error("listGuests error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load guests",
    });
  }
}

async function getGuest(req, res) {
  try {
    const { wedding, error } = await assertWedding(req);
    if (error) {
      return res.status(error.status).json({
        error: "Not Found",
        message: error.message,
      });
    }

    const guestId = String(req.params.id || "").trim();
    const rows = await fetchGuestsForWedding(wedding.id, guestId);
    if (!rows.length) {
      return res.status(404).json({
        error: "Not Found",
        message: "Guest not found",
      });
    }

    return res.status(200).json({
      guest: mapGuestRow(rows[0]),
    });
  } catch (err) {
    console.error("getGuest error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load guest",
    });
  }
}

function parseGuestBody(body) {
  const name = String(body?.name || body?.fullName || "").trim();
  const phone = String(body?.phone || body?.whatsappNumber || "").trim();
  const guestCount = Number(body?.guestCount ?? body?.invitedCount ?? body?.invitees);
  const note =
    body?.note === undefined && body?.invitationNote === undefined
      ? undefined
      : String(body?.note ?? body?.invitationNote ?? "").trim();
  const tableNumber =
    body?.tableNumber === undefined && body?.tableNo === undefined
      ? undefined
      : String(body?.tableNumber ?? body?.tableNo ?? "").trim();

  return { name, phone, guestCount, note, tableNumber };
}

async function createGuest(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const { wedding, error } = await assertWedding(req);
    if (error) {
      await transaction.rollback();
      return res.status(error.status).json({
        error: "Not Found",
        message: error.message,
      });
    }

    const { name, phone, guestCount, note, tableNumber } = parseGuestBody(req.body);

    if (!name || !phone) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Bad Request",
        message: "name and phone are required",
      });
    }

    if (!Number.isInteger(guestCount) || guestCount < 1) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Bad Request",
        message: "guestCount must be an integer of at least 1",
      });
    }

    const guestId = crypto.randomUUID();
    const rsvpId = crypto.randomUUID();
    const uniqueToken = `token_${crypto.randomUUID().replace(/-/g, "")}`;

    await sequelize.query(
      `
      INSERT INTO guests (
        id, wedding_id, full_name, whatsapp_number, invited_count,
        invitation_note, table_number, unique_token, rsvp_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING');
      `,
      {
        replacements: [
          guestId,
          wedding.id,
          name,
          phone,
          guestCount,
          note || null,
          tableNumber || null,
          uniqueToken,
        ],
        transaction,
      }
    );

    await sequelize.query(
      `
      INSERT INTO rsvps (
        id, guest_id, attending_status, attending_count, wishes, submitted_at
      )
      VALUES (?, ?, 'PENDING', 0, NULL, NULL);
      `,
      {
        replacements: [rsvpId, guestId],
        transaction,
      }
    );

    await transaction.commit();

    const rows = await fetchGuestsForWedding(wedding.id, guestId);
    return res.status(201).json({
      guest: mapGuestRow(rows[0]),
    });
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (_) {
      // ignore
    }
    console.error("createGuest error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create guest",
    });
  }
}

async function updateGuest(req, res) {
  try {
    const { wedding, error } = await assertWedding(req);
    if (error) {
      return res.status(error.status).json({
        error: "Not Found",
        message: error.message,
      });
    }

    const guestId = String(req.params.id || "").trim();
    const existing = await fetchGuestsForWedding(wedding.id, guestId);
    if (!existing.length) {
      return res.status(404).json({
        error: "Not Found",
        message: "Guest not found",
      });
    }

    const { name, phone, guestCount, note, tableNumber } = parseGuestBody(req.body);
    const current = existing[0];

    const nextName = name || current.full_name;
    const nextPhone = phone || current.whatsapp_number;
    const nextCount =
      req.body?.guestCount !== undefined ||
      req.body?.invitedCount !== undefined ||
      req.body?.invitees !== undefined
        ? guestCount
        : Number(current.invited_count) || 1;
    const nextNote =
      note !== undefined ? note || null : current.invitation_note;
    const nextTable =
      tableNumber !== undefined ? tableNumber || null : current.table_number;

    if (!Number.isInteger(nextCount) || nextCount < 1) {
      return res.status(400).json({
        error: "Bad Request",
        message: "guestCount must be an integer of at least 1",
      });
    }

    await sequelize.query(
      `
      UPDATE guests
      SET
        full_name = ?,
        whatsapp_number = ?,
        invited_count = ?,
        invitation_note = ?,
        table_number = ?
      WHERE id = ? AND wedding_id = ?;
      `,
      {
        replacements: [
          nextName,
          nextPhone,
          nextCount,
          nextNote,
          nextTable,
          guestId,
          wedding.id,
        ],
      }
    );

    const rows = await fetchGuestsForWedding(wedding.id, guestId);
    return res.status(200).json({
      guest: mapGuestRow(rows[0]),
    });
  } catch (err) {
    console.error("updateGuest error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update guest",
    });
  }
}

async function deleteGuest(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const { wedding, error } = await assertWedding(req);
    if (error) {
      await transaction.rollback();
      return res.status(error.status).json({
        error: "Not Found",
        message: error.message,
      });
    }

    const guestId = String(req.params.id || "").trim();
    const existing = await fetchGuestsForWedding(wedding.id, guestId);
    if (!existing.length) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Not Found",
        message: "Guest not found",
      });
    }

    await sequelize.query(`DELETE FROM rsvps WHERE guest_id = ?;`, {
      replacements: [guestId],
      transaction,
    });

    await sequelize.query(
      `DELETE FROM guests WHERE id = ? AND wedding_id = ?;`,
      {
        replacements: [guestId, wedding.id],
        transaction,
      }
    );

    await transaction.commit();

    return res.status(200).json({
      message: "Guest deleted",
      id: guestId,
    });
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (_) {
      // ignore
    }
    console.error("deleteGuest error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete guest",
    });
  }
}

module.exports = {
  listGuests,
  getGuest,
  createGuest,
  updateGuest,
  deleteGuest,
};
