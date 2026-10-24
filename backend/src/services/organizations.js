const crypto = require("crypto");
const { sequelize } = require("../models");
const { hashPassword } = require("../utils/password");
const {
  clientSlugFromName,
  generateClientPassword,
} = require("../utils/clientProvisioning");
const {
  seedRolesForOrganization,
  getRoleByKey,
} = require("./orgRoles");

async function uniqueLoginUsername(base, { transaction } = {}) {
  let slug = String(base || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 40) || "user";
  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? slug : `${slug}${i + 1}`;
    const [rows] = await sequelize.query(
      `SELECT id FROM users WHERE login_username = ? LIMIT 1;`,
      { replacements: [candidate], transaction }
    );
    if (!rows[0]) return candidate;
  }
  return `${slug}${crypto.randomUUID().slice(0, 8)}`;
}

async function createOrganizationWithOwner({
  name,
  type,
  ownerEmail,
  maxStaffAccounts = 5,
  transaction,
}) {
  const orgId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const plainPassword = generateClientPassword();
  const passwordHash = await hashPassword(plainPassword);
  const loginUsername = await uniqueLoginUsername(
    clientSlugFromName(name) || ownerEmail.split("@")[0],
    { transaction }
  );

  await sequelize.query(
    `
    INSERT INTO users (
      id, email, login_username, password_hash, role,
      organization_id, is_org_owner, is_active
    ) VALUES (?, ?, ?, ?, 'CLIENT', ?, 1, 1);
    `,
    {
      replacements: [
        userId,
        ownerEmail,
        loginUsername,
        passwordHash,
        orgId,
      ],
      transaction,
    }
  );

  await sequelize.query(
    `
    INSERT INTO organizations (id, name, type, owner_user_id, max_staff_accounts)
    VALUES (?, ?, ?, ?, ?);
    `,
    {
      replacements: [
        orgId,
        name,
        type,
        userId,
        Math.max(0, Number(maxStaffAccounts) || 0),
      ],
      transaction,
    }
  );

  const roleIds = await seedRolesForOrganization(orgId, { transaction });
  await sequelize.query(
    `UPDATE users SET permission_role_id = ? WHERE id = ?;`,
    { replacements: [roleIds.admin, userId], transaction }
  );

  return {
    organizationId: orgId,
    userId,
    loginUsername,
    plainPassword,
    email: ownerEmail,
  };
}

async function listVendorOrganizations() {
  const [rows] = await sequelize.query(
    `
    SELECT
      o.id,
      o.name,
      o.type,
      o.max_staff_accounts,
      o.owner_user_id,
      u.email AS owner_email,
      u.login_username AS owner_username,
      (
        SELECT COUNT(*) FROM events e WHERE e.organization_id = o.id
      ) AS event_count
    FROM organizations o
    LEFT JOIN users u ON u.id = o.owner_user_id
    WHERE o.type = 'vendor'
    ORDER BY o.name ASC;
    `
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    maxStaffAccounts: Number(r.max_staff_accounts) || 0,
    ownerUserId: r.owner_user_id,
    ownerEmail: r.owner_email || null,
    ownerUsername: r.owner_username || null,
    eventCount: Number(r.event_count) || 0,
  }));
}

async function getOrganizationById(id, { transaction } = {}) {
  const [rows] = await sequelize.query(
    `SELECT * FROM organizations WHERE id = ? LIMIT 1;`,
    { replacements: [id], transaction }
  );
  return rows[0] || null;
}

async function countOrgEvents(organizationId, { transaction } = {}) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM events WHERE organization_id = ?;`,
    { replacements: [organizationId], transaction }
  );
  return Number(rows[0]?.c || 0);
}

async function countOrgStaff(organizationId, { transaction } = {}) {
  const [rows] = await sequelize.query(
    `
    SELECT COUNT(*) AS c FROM users
    WHERE organization_id = ? AND is_org_owner = 0;
    `,
    { replacements: [organizationId], transaction }
  );
  return Number(rows[0]?.c || 0);
}

module.exports = {
  uniqueLoginUsername,
  createOrganizationWithOwner,
  listVendorOrganizations,
  getOrganizationById,
  countOrgEvents,
  countOrgStaff,
  getRoleByKey,
};
