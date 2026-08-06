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

module.exports = { requireAuth, requireRole };
