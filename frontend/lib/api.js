const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Wed Flow API client.
 *
 * Connected endpoints (used by frontend):
 * - POST /api/auth/login                          → login page
 * - POST /api/auth/refresh                        → silent session renew
 * - GET  /api/couple/dashboard                    → dashboard page
 * - GET  /api/couple/invitation-template          → invite tab, /invitation preview
 * - GET|POST|PUT|DELETE /api/couple/guests[...]   → guests page (note → invitation_note)
 * - GET|POST|PUT|DELETE /api/couple/schedule[...]  → schedule page
 * - GET  /api/couple/schedule/download            → schedule PDF download
 * - GET  /api/couple/notifications                → notifications page + bell
 * - POST /api/couple/notifications/mark-read      → mark all read
 * - POST /api/couple/notifications/:id/mark-read  → mark one read
 * - DELETE /api/couple/notifications/:id          → delete notification
 * - GET  /api/public/invite/:token/invitation-template → /i/[token] guest invite
 * - POST /api/public/invite/:token/rsvp           → InvitationPage RSVP form
 *
 * Static media (Express):
 * - GET  /assets/invitation_video/<slug>/...     → intro video
 * - GET  /assets/couple_images/<slug>/...        → Our Journey photos
 *
 * Backend-only (no couple UI yet):
 * - PUT  /api/couple/invitation-template
 * - PUT  /api/couple/notifications/:id           → edit notification text
 *
 * Legacy aliases (superseded by invitation-template routes above):
 * - GET  /api/couple/invite
 * - GET  /api/public/invite/:token
 */

export function getApiBaseUrl() {
  return API_BASE_URL.replace(/\/$/, "");
}

/** Resolve API-relative media paths (e.g. /assets/...) to absolute URLs */
export function resolveMediaUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith("blob:")) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${getApiBaseUrl()}${path}`;
}

let refreshPromise = null;

async function refreshAccessToken() {
  if (typeof window === "undefined") return null;

  const { getRefreshToken, setAuthSession, clearAuthSession } = await import(
    "@/lib/auth"
  );
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          clearAuthSession();
          return null;
        }

        const data = await res.json();
        setAuthSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        });
        return data.accessToken || null;
      } catch {
        clearAuthSession();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    token,
    headers = {},
    skipAuthRefresh = false,
  } = options;

  const doFetch = (authToken) =>
    fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch(token);
  let data = null;
  let text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  // Access token expired — renew with refresh token and retry once
  if (
    res.status === 401 &&
    token &&
    !skipAuthRefresh &&
    !path.includes("/api/auth/")
  ) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
      text = await res.text();
      data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }
    }
  }

  if (!res.ok) {
    const error = new Error(
      data?.message || data?.error || `Request failed (${res.status})`
    );
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}
