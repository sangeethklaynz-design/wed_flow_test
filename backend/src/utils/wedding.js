const { sequelize } = require("../models");

async function getWeddingForUser(userId, weddingIdFromToken) {
  const replacements = weddingIdFromToken
    ? [userId, weddingIdFromToken]
    : [userId];

  const sql = weddingIdFromToken
    ? `
      SELECT id, user_id, couple_names, bride_name, groom_name, wedding_date
      FROM weddings
      WHERE user_id = ? AND id = ?
      LIMIT 1;
    `
    : `
      SELECT id, user_id, couple_names, bride_name, groom_name, wedding_date
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
  // MySQL TIME often comes as HH:MM:SS
  return str.length >= 5 ? str.slice(0, 5) : str;
}

module.exports = {
  getWeddingForUser,
  toDateOnly,
  buildInitials,
  formatDisplayCoupleNames,
  formatTime,
};
