const PERMISSION_KEYS = [
  "viewDashboard",
  "viewGuests",
  "addGuests",
  "editGuests",
  "deleteGuests",
  "viewSchedule",
  "editSchedule",
  "viewInvitation",
  "editInvitation",
  "viewNotifications",
  "editNotifications",
  "viewPayments",
  "editPayments",
  "viewTickets",
  "scanTickets",
];

const ADMIN_ROLE_KEY = "admin";
const MANAGER_ROLE_KEY = "manager";
const AGENT_ROLE_KEY = "agent";

function emptyPermissions() {
  const perms = {};
  for (const key of PERMISSION_KEYS) perms[key] = false;
  return perms;
}

function allPermissions() {
  const perms = {};
  for (const key of PERMISSION_KEYS) perms[key] = true;
  return perms;
}

function normalizePermissions(raw) {
  const perms = emptyPermissions();
  if (raw && typeof raw === "object") {
    for (const key of PERMISSION_KEYS) {
      perms[key] = Boolean(raw[key]);
    }
  }
  return perms;
}

function viewOnlyPermissions() {
  const perms = emptyPermissions();
  for (const key of PERMISSION_KEYS) {
    if (key.startsWith("view")) perms[key] = true;
  }
  return perms;
}

function agentDefaultPermissions() {
  const perms = emptyPermissions();
  perms.viewGuests = true;
  perms.deleteGuests = true;
  return perms;
}

function defaultPermissionsForRoleKey(key) {
  if (key === ADMIN_ROLE_KEY) return allPermissions();
  if (key === MANAGER_ROLE_KEY) return viewOnlyPermissions();
  if (key === AGENT_ROLE_KEY) return agentDefaultPermissions();
  return emptyPermissions();
}

function parsePermissionsJson(raw) {
  if (raw == null) return emptyPermissions();
  if (typeof raw === "object") return normalizePermissions(raw);
  try {
    return normalizePermissions(JSON.parse(String(raw)));
  } catch {
    return emptyPermissions();
  }
}

module.exports = {
  PERMISSION_KEYS,
  ADMIN_ROLE_KEY,
  MANAGER_ROLE_KEY,
  AGENT_ROLE_KEY,
  emptyPermissions,
  allPermissions,
  normalizePermissions,
  viewOnlyPermissions,
  agentDefaultPermissions,
  defaultPermissionsForRoleKey,
  parsePermissionsJson,
};
