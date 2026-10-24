const crypto = require("crypto");
const { sequelize } = require("../models");
const { hashPassword } = require("../utils/password");
const { generateClientPassword } = require("../utils/clientProvisioning");
const {
  listRolesForOrganization,
  getRoleByKey,
  normalizePermissions,
} = require("../services/orgRoles");
const {
  uniqueLoginUsername,
  countOrgStaff,
  getOrganizationById,
} = require("../services/organizations");
const { ADMIN_ROLE_KEY, PERMISSION_KEYS } = require("../utils/rbac");

function requireOrg(req, res) {
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    res.status(400).json({
      error: "Bad Request",
      message: "No organization on user",
    });
    return null;
  }
  return organizationId;
}

async function listRoles(req, res) {
  try {
    const organizationId = requireOrg(req, res);
    if (!organizationId) return;
    const roles = await listRolesForOrganization(organizationId);
    return res.status(200).json({ roles, permissionKeys: PERMISSION_KEYS });
  } catch (err) {
    console.error("listRoles error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to list roles",
    });
  }
}

async function updateRole(req, res) {
  try {
    const organizationId = requireOrg(req, res);
    if (!organizationId) return;

    const roleId = String(req.params.id || "").trim();
    const [rows] = await sequelize.query(
      `
      SELECT * FROM role_permissions
      WHERE id = ? AND organization_id = ?
      LIMIT 1;
      `,
      { replacements: [roleId, organizationId] }
    );
    const role = rows[0];
    if (!role) {
      return res.status(404).json({ error: "Not Found", message: "Role not found" });
    }
    if (role.locked || role.key === ADMIN_ROLE_KEY) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Admin role permissions cannot be changed",
      });
    }

    const permissions = normalizePermissions(
      req.body?.permissions || req.body
    );
    await sequelize.query(
      `
      UPDATE role_permissions
      SET permissions = ?, updated_at = NOW()
      WHERE id = ?;
      `,
      { replacements: [JSON.stringify(permissions), roleId] }
    );

    const roles = await listRolesForOrganization(organizationId);
    return res.status(200).json({
      role: roles.find((r) => r.id === roleId),
      roles,
    });
  } catch (err) {
    console.error("updateRole error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update role",
    });
  }
}

async function listStaff(req, res) {
  try {
    const organizationId = requireOrg(req, res);
    if (!organizationId) return;

    const [rows] = await sequelize.query(
      `
      SELECT
        u.id, u.email, u.login_username, u.is_org_owner, u.is_active,
        u.permission_role_id, u.created_at,
        r.\`key\` AS role_key, r.name AS role_name
      FROM users u
      LEFT JOIN role_permissions r ON r.id = u.permission_role_id
      WHERE u.organization_id = ?
      ORDER BY u.is_org_owner DESC, u.created_at ASC;
      `,
      { replacements: [organizationId] }
    );

    const org = await getOrganizationById(organizationId);
    return res.status(200).json({
      maxStaffAccounts: Number(org?.max_staff_accounts) || 0,
      staff: rows.map((r) => ({
        id: r.id,
        email: r.email,
        username: r.login_username,
        isOrgOwner: Boolean(r.is_org_owner),
        isActive: r.is_active !== 0,
        permissionRoleId: r.permission_role_id,
        roleKey: r.role_key,
        roleName: r.role_name,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error("listStaff error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to list staff",
    });
  }
}

async function createStaff(req, res) {
  try {
    const organizationId = requireOrg(req, res);
    if (!organizationId) return;

    const org = await getOrganizationById(organizationId);
    if (!org) {
      return res.status(404).json({ error: "Not Found", message: "Organization not found" });
    }

    const staffCount = await countOrgStaff(organizationId);
    const maxSeats = Number(org.max_staff_accounts) || 0;
    if (staffCount >= maxSeats) {
      return res.status(400).json({
        error: "Bad Request",
        message: `Staff seat limit reached (${maxSeats})`,
      });
    }

    const roleKey = String(req.body?.roleKey || req.body?.role_key || "agent")
      .trim()
      .toLowerCase();
    if (roleKey === ADMIN_ROLE_KEY) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Cannot assign locked admin role to staff",
      });
    }
    const role = await getRoleByKey(organizationId, roleKey);
    if (!role || role.locked) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Invalid roleKey for staff",
      });
    }

    const baseName =
      String(req.body?.username || req.body?.name || roleKey).trim() || roleKey;
    const loginUsername = await uniqueLoginUsername(baseName);
    const plainPassword =
      String(req.body?.password || "").trim() || generateClientPassword();
    const passwordHash = await hashPassword(plainPassword);
    const userId = crypto.randomUUID();
    // Synthetic unique email for DB constraint (no real email for staff)
    const syntheticEmail = `${loginUsername}@staff.local`;

    await sequelize.query(
      `
      INSERT INTO users (
        id, email, login_username, password_hash, role,
        organization_id, permission_role_id, is_org_owner, is_active
      ) VALUES (?, ?, ?, ?, 'CLIENT', ?, ?, 0, 1);
      `,
      {
        replacements: [
          userId,
          syntheticEmail,
          loginUsername,
          passwordHash,
          organizationId,
          role.id,
        ],
      }
    );

    return res.status(201).json({
      staff: {
        id: userId,
        username: loginUsername,
        roleKey: role.key,
        roleName: role.name,
        permissionRoleId: role.id,
        isOrgOwner: false,
        isActive: true,
      },
      credentials: {
        username: loginUsername,
        password: plainPassword,
      },
    });
  } catch (err) {
    console.error("createStaff error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create staff account",
    });
  }
}

async function updateStaff(req, res) {
  try {
    const organizationId = requireOrg(req, res);
    if (!organizationId) return;
    const staffId = String(req.params.id || "").trim();

    const [rows] = await sequelize.query(
      `
      SELECT * FROM users
      WHERE id = ? AND organization_id = ?
      LIMIT 1;
      `,
      { replacements: [staffId, organizationId] }
    );
    const staff = rows[0];
    if (!staff) {
      return res.status(404).json({ error: "Not Found", message: "Staff not found" });
    }
    if (staff.is_org_owner) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Cannot modify the organization owner via staff APIs",
      });
    }

    const updates = [];
    const replacements = [];

    if (req.body?.roleKey || req.body?.role_key || req.body?.permissionRoleId) {
      let role;
      if (req.body?.permissionRoleId || req.body?.permission_role_id) {
        const rid = req.body.permissionRoleId || req.body.permission_role_id;
        const [rrows] = await sequelize.query(
          `
          SELECT * FROM role_permissions
          WHERE id = ? AND organization_id = ?
          LIMIT 1;
          `,
          { replacements: [rid, organizationId] }
        );
        role = rrows[0];
      } else {
        const roleKey = String(req.body.roleKey || req.body.role_key)
          .trim()
          .toLowerCase();
        role = await getRoleByKey(organizationId, roleKey);
      }
      if (!role || role.key === ADMIN_ROLE_KEY || role.locked) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Invalid staff role",
        });
      }
      updates.push("permission_role_id = ?");
      replacements.push(role.id);
    }

    if (req.body?.isActive !== undefined || req.body?.is_active !== undefined) {
      updates.push("is_active = ?");
      replacements.push(
        Boolean(req.body.isActive ?? req.body.is_active) ? 1 : 0
      );
    }

    let newPassword = null;
    if (req.body?.resetPassword || req.body?.password) {
      newPassword =
        String(req.body.password || "").trim() || generateClientPassword();
      const passwordHash = await hashPassword(newPassword);
      updates.push("password_hash = ?");
      replacements.push(passwordHash);
    }

    if (!updates.length) {
      return res.status(400).json({
        error: "Bad Request",
        message: "No updates provided",
      });
    }

    replacements.push(staffId);
    await sequelize.query(
      `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?;`,
      { replacements }
    );

    const response = { ok: true, id: staffId };
    if (newPassword) {
      response.credentials = {
        username: staff.login_username,
        password: newPassword,
      };
    }
    return res.status(200).json(response);
  } catch (err) {
    console.error("updateStaff error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update staff",
    });
  }
}

async function deleteStaff(req, res) {
  try {
    const organizationId = requireOrg(req, res);
    if (!organizationId) return;
    const staffId = String(req.params.id || "").trim();

    const [rows] = await sequelize.query(
      `
      SELECT id, is_org_owner FROM users
      WHERE id = ? AND organization_id = ?
      LIMIT 1;
      `,
      { replacements: [staffId, organizationId] }
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Not Found", message: "Staff not found" });
    }
    if (rows[0].is_org_owner) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Cannot delete the organization owner",
      });
    }

    await sequelize.query(`DELETE FROM users WHERE id = ?;`, {
      replacements: [staffId],
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("deleteStaff error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete staff",
    });
  }
}

module.exports = {
  listRoles,
  updateRole,
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
};
