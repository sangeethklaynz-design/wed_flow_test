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
  formatTime,
};
