const { sequelize } = require("../models");

async function getWeddingForUser(userId, weddingIdFromToken) {
  const replacements = weddingIdFromToken
    ? [userId, weddingIdFromToken]
    : [userId];

  const sql = weddingIdFromToken
    ? `
      SELECT id, user_id, couple_names, wedding_date
      FROM weddings
      WHERE user_id = ? AND id = ?
      LIMIT 1;
    `
    : `
      SELECT id, user_id, couple_names, wedding_date
      FROM weddings
      WHERE user_id = ?
      LIMIT 1;
    `;

  const [rows] = await sequelize.query(sql, { replacements });
  return rows[0] || null;
}

function toDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

function buildInitials(coupleNames) {
  if (!coupleNames) return "";
  const parts = String(coupleNames)
    .split("&")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] || "";
    const b = parts[1][0] || "";
    return `${a}&${b}`.toUpperCase();
  }
  return coupleNames.slice(0, 2).toUpperCase();
}

async function getDashboard(req, res) {
  try {
    const wedding = await getWeddingForUser(req.user.id, req.user.weddingId);

    if (!wedding) {
      return res.status(404).json({
        error: "Not Found",
        message: "No wedding found for this account",
      });
    }

    const weddingId = wedding.id;

    const [guestRows] = await sequelize.query(
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
      ORDER BY g.full_name ASC;
      `,
      { replacements: [weddingId] }
    );

    const [statRows] = await sequelize.query(
      `
      SELECT
        COUNT(*) AS guest_parties,
        COALESCE(SUM(g.invited_count), 0) AS guests_invited,
        COALESCE(SUM(
          CASE
            WHEN g.rsvp_status = 'CONFIRMED' THEN COALESCE(r.attending_count, g.invited_count)
            ELSE 0
          END
        ), 0) AS rsvp_confirmed,
        COALESCE(SUM(
          CASE WHEN g.rsvp_status = 'PENDING' THEN g.invited_count ELSE 0 END
        ), 0) AS pending,
        COALESCE(SUM(
          CASE WHEN g.rsvp_status = 'DECLINED' THEN g.invited_count ELSE 0 END
        ), 0) AS declined,
        COALESCE(SUM(CASE WHEN g.rsvp_status = 'CONFIRMED' THEN 1 ELSE 0 END), 0) AS confirmed_parties,
        COALESCE(SUM(CASE WHEN g.rsvp_status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pending_parties,
        COALESCE(SUM(CASE WHEN g.rsvp_status = 'DECLINED' THEN 1 ELSE 0 END), 0) AS declined_parties
      FROM guests g
      LEFT JOIN rsvps r ON r.guest_id = g.id
      WHERE g.wedding_id = ?;
      `,
      { replacements: [weddingId] }
    );

    const statsRow = statRows[0] || {};

    const guests = guestRows.map((g) => ({
      id: g.id,
      fullName: g.full_name,
      whatsappNumber: g.whatsapp_number,
      invitedCount: Number(g.invited_count) || 0,
      invitationNote: g.invitation_note,
      tableNumber: g.table_number,
      uniqueToken: g.unique_token,
      rsvpStatus: String(g.rsvp_status || "PENDING").toLowerCase(),
      rsvp: g.rsvp_id
        ? {
            id: g.rsvp_id,
            attendingStatus: g.attending_status,
            attendingCount: Number(g.attending_count) || 0,
            wishes: g.wishes,
            submittedAt: g.submitted_at,
          }
        : null,
    }));

    const weddingDate = toDateOnly(wedding.wedding_date);

    return res.status(200).json({
      wedding: {
        id: wedding.id,
        coupleNames: wedding.couple_names,
        initials: buildInitials(wedding.couple_names),
        weddingDate,
        weddingDateTime: wedding.wedding_date,
      },
      stats: {
        guestsInvited: Number(statsRow.guests_invited) || 0,
        rsvpConfirmed: Number(statsRow.rsvp_confirmed) || 0,
        pending: Number(statsRow.pending) || 0,
        declined: Number(statsRow.declined) || 0,
        guestParties: Number(statsRow.guest_parties) || 0,
        confirmedParties: Number(statsRow.confirmed_parties) || 0,
        pendingParties: Number(statsRow.pending_parties) || 0,
        declinedParties: Number(statsRow.declined_parties) || 0,
      },
      guests,
    });
  } catch (err) {
    console.error("dashboard error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load dashboard",
    });
  }
}

module.exports = { getDashboard };
