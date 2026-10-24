const { sequelize } = require("../models");
const { verifyPassword } = require("../utils/password");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const { formatDisplayCoupleNames, buildInitials } = require("../utils/wedding");
const {
  matchAdminCredentials,
  formatAdminUser,
  isAdminSubject,
  loadAdminCredentials,
  ADMIN_ID,
} = require("../utils/adminCredentials");
const { resolvePermissionsForUser } = require("../services/orgRoles");

function isClientRole(role) {
  return role === "CLIENT" || role === "COUPLE" || role === "STAFF";
}

async function findClientUser(identifier, { eventId } = {}) {
  const emailOrUser = String(identifier || "").trim();
  const isEmail = emailOrUser.includes("@");
  const replacements = [];
  let userWhere;

  if (isEmail) {
    userWhere = "u.email = ?";
    replacements.push(emailOrUser.toLowerCase());
  } else {
    userWhere = "u.login_username = ?";
    replacements.push(emailOrUser.toLowerCase());
  }

  if (eventId) {
    replacements.push(eventId);
    const [rows] = await sequelize.query(
      `
      SELECT
        u.id AS user_id,
        u.email,
        u.login_username,
        u.password_hash,
        u.role,
        u.organization_id,
        u.permission_role_id,
        u.is_org_owner,
        u.is_active,
        w.id AS wedding_id,
        w.couple_names,
        w.bride_name,
        w.groom_name,
        w.wedding_date,
        e.id AS event_id,
        e.type AS event_type,
        e.template_key AS template_key,
        e.name AS event_name,
        e.client_slug AS client_slug
      FROM users u
      INNER JOIN events e ON e.organization_id = u.organization_id AND e.id = ?
      INNER JOIN weddings w ON w.event_id = e.id
      WHERE ${userWhere}
      LIMIT 1;
      `,
      { replacements: [eventId, replacements[0]] }
    );
    return rows[0] || null;
  }

  // Without event: join latest event in org (or legacy user_id wedding)
  const [rows] = await sequelize.query(
    `
    SELECT
      u.id AS user_id,
      u.email,
      u.login_username,
      u.password_hash,
      u.role,
      u.organization_id,
      u.permission_role_id,
      u.is_org_owner,
      u.is_active,
      w.id AS wedding_id,
      w.couple_names,
      w.bride_name,
      w.groom_name,
      w.wedding_date,
      e.id AS event_id,
      e.type AS event_type,
      e.template_key AS template_key,
      e.name AS event_name,
      e.client_slug AS client_slug
    FROM users u
    LEFT JOIN events e ON (
      (u.organization_id IS NOT NULL AND e.organization_id = u.organization_id)
      OR (u.organization_id IS NULL AND e.user_id = u.id)
    )
    LEFT JOIN weddings w ON w.event_id = e.id
    WHERE ${userWhere}
    ORDER BY e.created_at DESC
    LIMIT 1;
    `,
    { replacements }
  );
  return rows[0] || null;
}

async function findClientUserById(userId, { eventId } = {}) {
  if (eventId) {
    const [rows] = await sequelize.query(
      `
      SELECT
        u.id AS user_id,
        u.email,
        u.login_username,
        u.password_hash,
        u.role,
        u.organization_id,
        u.permission_role_id,
        u.is_org_owner,
        u.is_active,
        w.id AS wedding_id,
        w.couple_names,
        w.bride_name,
        w.groom_name,
        w.wedding_date,
        e.id AS event_id,
        e.type AS event_type,
        e.template_key AS template_key,
        e.name AS event_name,
        e.client_slug AS client_slug
      FROM users u
      INNER JOIN events e ON e.organization_id = u.organization_id AND e.id = ?
      INNER JOIN weddings w ON w.event_id = e.id
      WHERE u.id = ?
      LIMIT 1;
      `,
      { replacements: [eventId, userId] }
    );
    if (rows[0]) return rows[0];
  }

  const [rows] = await sequelize.query(
    `
    SELECT
      u.id AS user_id,
      u.email,
      u.login_username,
      u.password_hash,
      u.role,
      u.organization_id,
      u.permission_role_id,
      u.is_org_owner,
      u.is_active,
      w.id AS wedding_id,
      w.couple_names,
      w.bride_name,
      w.groom_name,
      w.wedding_date,
      e.id AS event_id,
      e.type AS event_type,
      e.template_key AS template_key,
      e.name AS event_name,
      e.client_slug AS client_slug
    FROM users u
    LEFT JOIN events e ON (
      (u.organization_id IS NOT NULL AND e.organization_id = u.organization_id)
      OR (u.organization_id IS NULL AND e.user_id = u.id)
    )
    LEFT JOIN weddings w ON w.event_id = e.id
    WHERE u.id = ?
    ORDER BY e.created_at DESC
    LIMIT 1;
    `,
    { replacements: [userId] }
  );
  return rows[0] || null;
}

async function formatUser(row) {
  const brideName = row.bride_name || null;
  const groomName = row.groom_name || null;
  const displayCoupleNames =
    formatDisplayCoupleNames({
      brideName,
      groomName,
      coupleNames: row.couple_names,
    }) || row.event_name || null;

  const permissionsMap = await resolvePermissionsForUser(row);

  return {
    id: row.user_id,
    email: row.email,
    username: row.login_username || null,
    role: row.role === "COUPLE" ? "CLIENT" : row.role,
    isOrgOwner: Boolean(row.is_org_owner),
    organizationId: row.organization_id || null,
    permissionRoleId: row.permission_role_id || null,
    permissionsMap,
    coupleNames: displayCoupleNames,
    brideName,
    groomName,
    initials: buildInitials(displayCoupleNames),
    weddingId: row.wedding_id || null,
    weddingDate: row.wedding_date
      ? String(row.wedding_date).slice(0, 10)
      : null,
    eventId: row.event_id || null,
    eventType: row.event_type || null,
    templateKey: row.template_key || null,
    eventName: row.event_name || null,
    clientSlug: row.client_slug || null,
  };
}

async function issueTokens(row) {
  const permissionsMap = await resolvePermissionsForUser(row);
  const role = row.role === "COUPLE" ? "CLIENT" : row.role;
  const payload = {
    sub: row.user_id,
    email: row.email,
    role,
    weddingId: row.wedding_id || null,
    eventId: row.event_id || null,
    eventType: row.event_type || null,
    organizationId: row.organization_id || null,
    permissionRoleId: row.permission_role_id || null,
    isOrgOwner: Boolean(row.is_org_owner),
    permissionsMap,
  };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({
      sub: row.user_id,
      role,
      eventId: row.event_id || null,
    }),
  };
}

function issueAdminTokens(email) {
  const payload = {
    sub: ADMIN_ID,
    email,
    role: "ADMIN",
    weddingId: null,
  };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({
      sub: ADMIN_ID,
      role: "ADMIN",
    }),
  };
}

async function login(req, res) {
  try {
    const identifier = String(
      req.body?.email || req.body?.username || req.body?.login || ""
    ).trim();
    const password = String(req.body?.password || "");
    const eventId = String(req.body?.eventId || req.body?.event_id || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({
        error: "Bad Request",
        message: "email/username and password are required",
      });
    }

    const admin = matchAdminCredentials(identifier.toLowerCase(), password);
    if (admin) {
      const tokens = issueAdminTokens(admin.email);
      return res.status(200).json({
        ...tokens,
        user: formatAdminUser(admin.email),
      });
    }

    const row = await findClientUser(identifier, {
      eventId: eventId || undefined,
    });
    if (!row || row.is_active === 0) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid credentials",
      });
    }

    if (!isClientRole(row.role) && row.role !== "CLIENT") {
      // still allow
    }

    const ok = await verifyPassword(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid credentials",
      });
    }

    const tokens = await issueTokens(row);
    const user = await formatUser(row);

    return res.status(200).json({
      ...tokens,
      user,
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Login failed",
    });
  }
}

async function refresh(req, res) {
  try {
    const refreshToken = String(req.body?.refreshToken || "");

    if (!refreshToken) {
      return res.status(400).json({
        error: "Bad Request",
        message: "refreshToken is required",
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Refresh token is invalid or expired",
      });
    }

    if (decoded.role === "ADMIN" || isAdminSubject(decoded.sub)) {
      const creds = loadAdminCredentials();
      if (!creds) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Admin credentials are not configured",
        });
      }
      const tokens = issueAdminTokens(creds.email);
      return res.status(200).json({
        ...tokens,
        user: formatAdminUser(creds.email),
      });
    }

    const row = await findClientUserById(decoded.sub, {
      eventId: decoded.eventId || undefined,
    });
    if (!row || row.is_active === 0) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User no longer exists",
      });
    }

    const tokens = await issueTokens(row);
    const user = await formatUser(row);

    return res.status(200).json({
      ...tokens,
      user,
    });
  } catch (err) {
    console.error("refresh error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Token refresh failed",
    });
  }
}

async function me(req, res) {
  try {
    if (req.user?.role === "ADMIN" || isAdminSubject(req.user?.id)) {
      const creds = loadAdminCredentials();
      return res.status(200).json({
        user: formatAdminUser(creds?.email || req.user.email),
      });
    }

    const row = await findClientUserById(req.user.id, {
      eventId: req.user.eventId || undefined,
    });
    if (!row) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
    }

    return res.status(200).json({
      user: await formatUser(row),
    });
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load current user",
    });
  }
}

async function listClientEvents(req, res) {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "No organization on user",
      });
    }

    const [rows] = await sequelize.query(
      `
      SELECT
        e.id AS event_id,
        e.name AS event_name,
        e.type AS event_type,
        e.event_date,
        e.client_slug,
        w.id AS wedding_id
      FROM events e
      LEFT JOIN weddings w ON w.event_id = e.id
      WHERE e.organization_id = ?
      ORDER BY e.event_date DESC, e.created_at DESC;
      `,
      { replacements: [organizationId] }
    );

    return res.status(200).json({
      events: rows.map((r) => ({
        eventId: r.event_id,
        eventName: r.event_name,
        eventType: r.event_type,
        eventDate: r.event_date ? String(r.event_date).slice(0, 10) : null,
        clientSlug: r.client_slug,
        weddingId: r.wedding_id,
      })),
    });
  } catch (err) {
    console.error("listClientEvents error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to list events",
    });
  }
}

async function selectClientEvent(req, res) {
  try {
    const eventId = String(req.body?.eventId || req.body?.event_id || "").trim();
    if (!eventId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "eventId is required",
      });
    }

    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "No organization on user",
      });
    }

    const [owned] = await sequelize.query(
      `
      SELECT id FROM events
      WHERE id = ? AND organization_id = ?
      LIMIT 1;
      `,
      { replacements: [eventId, organizationId] }
    );
    if (!owned[0]) {
      return res.status(404).json({
        error: "Not Found",
        message: "Event not found in your organization",
      });
    }

    const row = await findClientUserById(req.user.id, { eventId });
    if (!row) {
      return res.status(404).json({
        error: "Not Found",
        message: "User/event binding not found",
      });
    }

    const tokens = await issueTokens(row);
    const user = await formatUser(row);
    return res.status(200).json({ ...tokens, user });
  } catch (err) {
    console.error("selectClientEvent error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to select event",
    });
  }
}

module.exports = {
  login,
  refresh,
  me,
  listClientEvents,
  selectClientEvent,
};
