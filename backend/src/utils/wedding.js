const { sequelize } = require("../models");

/**
 * Resolve the active wedding/event for a client user.
 * Prefers organization + token wedding/event scope so staff and multi-event owners stay isolated.
 */
async function getWeddingForUser(userId, weddingIdFromToken, extras = {}) {
  const organizationId = extras.organizationId || null;
  const eventId = extras.eventId || null;

  if (organizationId) {
    const replacements = [organizationId];
    let where = "e.organization_id = ?";
    if (weddingIdFromToken) {
      where += " AND w.id = ?";
      replacements.push(weddingIdFromToken);
    } else if (eventId) {
      where += " AND e.id = ?";
      replacements.push(eventId);
    }

    const [rows] = await sequelize.query(
      `
      SELECT
        w.id, w.user_id, w.couple_names, w.bride_name, w.groom_name, w.wedding_date,
        w.event_id,
        e.type AS event_type,
        e.template_key AS template_key,
        e.client_slug AS client_slug,
        e.organization_id AS organization_id,
        e.name AS event_name
      FROM weddings w
      INNER JOIN events e ON e.id = w.event_id
      WHERE ${where}
      ORDER BY w.created_at DESC
      LIMIT 1;
      `,
      { replacements }
    );
    return rows[0] || null;
  }

  // Legacy fallback (pre-org users)
  const replacements = weddingIdFromToken
    ? [userId, weddingIdFromToken]
    : [userId];

  const sql = weddingIdFromToken
    ? `
      SELECT
        w.id, w.user_id, w.couple_names, w.bride_name, w.groom_name, w.wedding_date,
        w.event_id,
        e.type AS event_type,
        e.template_key AS template_key,
        e.client_slug AS client_slug,
        e.organization_id AS organization_id,
        e.name AS event_name
      FROM weddings w
      LEFT JOIN events e ON e.id = w.event_id
      WHERE w.user_id = ? AND w.id = ?
      LIMIT 1;
    `
    : `
      SELECT
        w.id, w.user_id, w.couple_names, w.bride_name, w.groom_name, w.wedding_date,
        w.event_id,
        e.type AS event_type,
        e.template_key AS template_key,
        e.client_slug AS client_slug,
        e.organization_id AS organization_id,
        e.name AS event_name
      FROM weddings w
      LEFT JOIN events e ON e.id = w.event_id
      WHERE w.user_id = ?
      LIMIT 1;
    `;

  const [rows] = await sequelize.query(sql, { replacements });
  return rows[0] || null;
}

function getWeddingForRequest(user) {
  if (!user?.id) return Promise.resolve(null);
  return getWeddingForUser(user.id, user.weddingId, {
    organizationId: user.organizationId || null,
    eventId: user.eventId || null,
  });
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

/** Display order for UI: bride first, then groom. Does not change stored couple_names (used for asset slugs). */
function formatDisplayCoupleNames({ brideName, groomName, coupleNames } = {}) {
  const bride = String(brideName || "").trim();
  const groom = String(groomName || "").trim();
  if (bride && groom) return `${bride} & ${groom}`;

  // Registration stores couple_names as "Groom & Bride" — reverse for display
  // when bride_name / groom_name columns are empty.
  const raw = String(coupleNames || "").trim();
  if (raw.includes("&")) {
    const [left, ...rest] = raw.split("&").map((p) => p.trim());
    const right = rest.join(" & ").trim();
    if (left && right) return `${right} & ${left}`;
  }

  return coupleNames || null;
}

function formatTime(value) {
  if (!value) return null;
  const str = String(value);
  return str.length >= 5 ? str.slice(0, 5) : str;
}

module.exports = {
  getWeddingForUser,
  getWeddingForRequest,
  toDateOnly,
  buildInitials,
  formatDisplayCoupleNames,
  formatTime,
};
