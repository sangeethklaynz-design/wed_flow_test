const { verifyAccessToken } = require("../utils/jwt");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid Authorization header. Use: Bearer <accessToken>",
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      weddingId: decoded.weddingId || null,
      eventId: decoded.eventId || null,
      eventType: decoded.eventType || null,
      organizationId: decoded.organizationId || null,
      permissionRoleId: decoded.permissionRoleId || null,
      isOrgOwner: Boolean(decoded.isOrgOwner),
      permissionsMap: decoded.permissionsMap || {},
    };
    return next();
  } catch (err) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Access token is invalid or expired",
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to access this resource",
      });
    }
    return next();
  };
}

function requirePermission(...keys) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Not authenticated",
      });
    }
    if (req.user.role === "ADMIN") return next();
    if (req.user.isOrgOwner) return next();

    const map = req.user.permissionsMap || {};
    const ok = keys.some((k) => Boolean(map[k]));
    if (!ok) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Missing permission: ${keys.join(" or ")}`,
      });
    }
    return next();
  };
}

function requireOrgOwner(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Not authenticated",
    });
  }
  if (req.user.role === "ADMIN" || req.user.isOrgOwner) return next();
  return res.status(403).json({
    error: "Forbidden",
    message: "Only the organization owner can perform this action",
  });
}

module.exports = {
  requireAuth,
  requireRole,
  requirePermission,
  requireOrgOwner,
};
