const fs = require("fs");
const path = require("path");

const ADMIN_ID = "admin";
const CREDENTIALS_PATH = path.join(__dirname, "..", "..", "admin-credentials.txt");

function parseCredentialsFile(filePath) {
  if (!fs.existsSync(filePath)) return null;

  const text = fs.readFileSync(filePath, "utf8");
  const values = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim().toLowerCase();
    const value = line.slice(eq + 1).trim();
    values[key] = value;
  }

  const email = String(values.email || "")
    .trim()
    .toLowerCase();
  const password = String(values.password || "");

  if (!email || !password) return null;
  return { email, password };
}

function loadAdminCredentials() {
  return parseCredentialsFile(CREDENTIALS_PATH);
}

function matchAdminCredentials(email, password) {
  const creds = loadAdminCredentials();
  if (!creds) return null;
  if (creds.email !== email) return null;
  if (creds.password !== password) return null;
  return {
    id: ADMIN_ID,
    email: creds.email,
    role: "ADMIN",
  };
}

function formatAdminUser(email) {
  return {
    id: ADMIN_ID,
    email: email || loadAdminCredentials()?.email || "admin@wedflow.local",
    role: "ADMIN",
    coupleNames: null,
    brideName: null,
    groomName: null,
    initials: "AD",
    weddingId: null,
    weddingDate: null,
  };
}

function isAdminSubject(sub) {
  return String(sub || "") === ADMIN_ID;
}

module.exports = {
  ADMIN_ID,
  CREDENTIALS_PATH,
  loadAdminCredentials,
  matchAdminCredentials,
  formatAdminUser,
  isAdminSubject,
};
