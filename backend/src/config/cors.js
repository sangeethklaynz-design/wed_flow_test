/**
 * Parse FRONTEND_ORIGIN — comma-separated list, origin only (no path).
 */
function parseAllowedOrigins(frontendOrigin) {
  if (!frontendOrigin || typeof frontendOrigin !== "string") return [];
  return frontendOrigin
    .split(",")
    .map((value) => value.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

/**
 * Vercel production: wed-flow-test.vercel.app
 * Vercel preview:   wed-flow-test-9m68eay17-klaynz.vercel.app
 */
function vercelProjectSlug(hostname) {
  if (!hostname.endsWith(".vercel.app")) return null;
  const sub = hostname.slice(0, -".vercel.app".length);
  const parts = sub.split("-");
  // Preview deployments append {id}-{team} after the project slug.
  if (parts.length >= 4) {
    return parts.slice(0, -2).join("-");
  }
  return sub;
}

function isSameVercelProject(origin, allowedOrigin) {
  try {
    const originHost = new URL(origin).hostname;
    const allowedHost = new URL(allowedOrigin).hostname;
    const originSlug = vercelProjectSlug(originHost);
    const allowedSlug = vercelProjectSlug(allowedHost);
    return Boolean(originSlug && allowedSlug && originSlug === allowedSlug);
  } catch {
    return false;
  }
}

function isVercelPreviewOfProduction(origin, allowedOrigin) {
  try {
    const allowedHost = new URL(allowedOrigin).hostname;
    const originHost = new URL(origin).hostname;
    if (!allowedHost.endsWith(".vercel.app") || !originHost.endsWith(".vercel.app")) {
      return false;
    }
    const prefix = allowedHost.replace(/\.vercel\.app$/, "");
    return originHost === allowedHost || originHost.startsWith(`${prefix}-`);
  } catch {
    return false;
  }
}

function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return allowedOrigins.some(
    (allowed) =>
      isSameVercelProject(origin, allowed) ||
      isVercelPreviewOfProduction(origin, allowed)
  );
}

function createCorsOptions(frontendOrigin) {
  const allowedOrigins = parseAllowedOrigins(frontendOrigin);

  if (allowedOrigins.length === 0) {
    return {};
  }

  return {
    origin(origin, callback) {
      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  };
}

module.exports = {
  parseAllowedOrigins,
  vercelProjectSlug,
  isOriginAllowed,
  createCorsOptions,
};
