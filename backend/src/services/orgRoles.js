const crypto = require("crypto");
const { sequelize } = require("../models");
const {
  ADMIN_ROLE_KEY,
  MANAGER_ROLE_KEY,
  AGENT_ROLE_KEY,
  defaultPermissionsForRoleKey,
  parsePermissionsJson,
  allPermissions,
  normalizePermissions,
} = require("../utils/rbac");

async function seedRolesForOrganization(organizationId, { transaction } = {}) {
  const seeds = [
    {
      key: ADMIN_ROLE_KEY,
      name: "Admin",
      locked: 1,
      permissions: defaultPermissionsForRoleKey(ADMIN_ROLE_KEY),
    },
    {
      key: MANAGER_ROLE_KEY,
      name: "Manager",
      locked: 0,
      permissions: defaultPermissionsForRoleKey(MANAGER_ROLE_KEY),
    },
    {
      key: AGENT_ROLE_KEY,
      name: "Agent",
      locked: 0,
      permissions: defaultPermissionsForRoleKey(AGENT_ROLE_KEY),
    },
  ];

  const created = {};
  for (const seed of seeds) {
    const id = crypto.randomUUID();
    await sequelize.query(
      `
      INSERT INTO role_permissions (
        id, organization_id, \`key\`, name, locked, permissions
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name);
      `,
      {
        replacements: [
          id,
          organizationId,
          seed.key,
          seed.name,
          seed.locked,
          JSON.stringify(seed.permissions),
        ],
        transaction,
      }
    );
    const [rows] = await sequelize.query(
      `
      SELECT id, \`key\` FROM role_permissions
      WHERE organization_id = ? AND \`key\` = ?
      LIMIT 1;
      `,
      { replacements: [organizationId, seed.key], transaction }
    );
    created[seed.key] = rows[0]?.id || id;
  }
  return created;
}

async function getRoleByKey(organizationId, key, { transaction } = {}) {
  const [rows] = await sequelize.query(
    `
    SELECT * FROM role_permissions
    WHERE organization_id = ? AND \`key\` = ?
    LIMIT 1;
    `,
    { replacements: [organizationId, key], transaction }
  );
  return rows[0] || null;
}

async function listRolesForOrganization(organizationId) {
  const [rows] = await sequelize.query(
    `
    SELECT * FROM role_permissions
    WHERE organization_id = ?
    ORDER BY locked DESC, \`key\` ASC;
    `,
    { replacements: [organizationId] }
  );
  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    key: row.key,
    name: row.name,
    locked: Boolean(row.locked),
    permissions: parsePermissionsJson(row.permissions),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function resolvePermissionsForUser(userRow) {
  if (userRow?.is_org_owner || userRow?.isOrgOwner) {
    return allPermissions();
  }
  if (userRow?.permission_role_id || userRow?.permissionRoleId) {
    const roleId = userRow.permission_role_id || userRow.permissionRoleId;
    const [rows] = await sequelize.query(
      `SELECT permissions, \`key\`, locked FROM role_permissions WHERE id = ? LIMIT 1;`,
      { replacements: [roleId] }
    );
    if (rows[0]) {
      if (rows[0].key === ADMIN_ROLE_KEY || rows[0].locked) {
        return allPermissions();
      }
      return parsePermissionsJson(rows[0].permissions);
    }
  }
  return defaultPermissionsForRoleKey(AGENT_ROLE_KEY);
}

function mapRoleRow(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    key: row.key,
    name: row.name,
    locked: Boolean(row.locked),
    permissions: parsePermissionsJson(row.permissions),
  };
}

module.exports = {
  seedRolesForOrganization,
  getRoleByKey,
  listRolesForOrganization,
  resolvePermissionsForUser,
  mapRoleRow,
  normalizePermissions,
};
