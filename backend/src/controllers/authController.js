const { sequelize } = require("../models");
const { verifyPassword } = require("../utils/password");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const { formatDisplayCoupleNames, buildInitials } = require("../utils/wedding");

async function findUserWithWeddingByEmail(email) {
  const [rows] = await sequelize.query(
    `
    SELECT
      u.id AS user_id,
      u.email,
      u.password_hash,
      u.role,
      w.id AS wedding_id,
      w.couple_names,
      w.bride_name,
      w.groom_name,
      w.wedding_date
    FROM users u
    LEFT JOIN weddings w ON w.user_id = u.id
    WHERE u.email = ?
    LIMIT 1;
    `,
    { replacements: [email] }
  );
  return rows[0] || null;
}

async function findUserWithWeddingById(userId) {
  const [rows] = await sequelize.query(
    `
    SELECT
      u.id AS user_id,
      u.email,
      u.role,
      w.id AS wedding_id,
      w.couple_names,
      w.bride_name,
      w.groom_name,
      w.wedding_date
    FROM users u
    LEFT JOIN weddings w ON w.user_id = u.id
    WHERE u.id = ?
    LIMIT 1;
    `,
    { replacements: [userId] }
  );
  return rows[0] || null;
}

function formatUser(row) {
  const brideName = row.bride_name || null;
  const groomName = row.groom_name || null;
  const displayCoupleNames =
    formatDisplayCoupleNames({
      brideName,
      groomName,
      coupleNames: row.couple_names,
    }) || null;

  return {
    id: row.user_id,
    email: row.email,
    role: row.role,
    coupleNames: displayCoupleNames,
    brideName,
    groomName,
    initials: buildInitials(displayCoupleNames),
    weddingId: row.wedding_id || null,
    weddingDate: row.wedding_date
      ? String(row.wedding_date).slice(0, 10)
      : null,
  };
}

function issueTokens(row) {
  const payload = {
    sub: row.user_id,
    email: row.email,
    role: row.role,
    weddingId: row.wedding_id || null,
  };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({
      sub: row.user_id,
      role: row.role,
    }),
  };
}

async function login(req, res) {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({
        error: "Bad Request",
        message: "email and password are required",
      });
    }

    const row = await findUserWithWeddingByEmail(email);
    if (!row) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid email or password",
      });
    }

    const ok = await verifyPassword(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid email or password",
      });
    }

    const tokens = issueTokens(row);

    return res.status(200).json({
      ...tokens,
      user: formatUser(row),
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

    const row = await findUserWithWeddingById(decoded.sub);
    if (!row) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User no longer exists",
      });
    }

    const tokens = issueTokens(row);

    return res.status(200).json({
      ...tokens,
      user: formatUser(row),
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
    const row = await findUserWithWeddingById(req.user.id);
    if (!row) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
    }

    return res.status(200).json({
      user: formatUser(row),
    });
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load current user",
    });
  }
}

module.exports = { login, refresh, me };
