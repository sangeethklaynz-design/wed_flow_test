/**
 * Client slug + password helpers for admin-provisioned event accounts.
 */

function clientSlugFromName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 80);
}

function splitEventDisplayNames(name) {
  const raw = String(name || "").trim();
  if (!raw) return { brideName: "Client", groomName: "Event", coupleNames: "Client" };
  const parts = raw.split(/\s*&\s*|\s+and\s+/i).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      brideName: parts[0],
      groomName: parts[1],
      coupleNames: `${parts[0]} & ${parts[1]}`,
    };
  }
  return { brideName: raw, groomName: "Event", coupleNames: raw };
}

function generateClientPassword(length = 12) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out = "";
  const crypto = require("crypto");
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

module.exports = {
  clientSlugFromName,
  splitEventDisplayNames,
  generateClientPassword,
};
