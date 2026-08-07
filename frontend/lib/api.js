const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Wed Flow API client.
 *
 * Connected endpoints (used by frontend):
 * - POST /api/auth/login                          → login page
 * - GET  /api/couple/dashboard                    → dashboard page
 * - GET  /api/couple/invitation-template          → invite tab, /invitation preview
 * - GET|POST|PUT|DELETE /api/couple/guests[...]   → guests page (note → invitation_note)
 * - GET|POST|PUT|DELETE /api/couple/schedule[...]  → schedule page
 * - GET  /api/couple/schedule/download            → schedule PDF download
 * - GET  /api/public/invite/:token/invitation-template → /i/[token] guest invite
 * - POST /api/public/invite/:token/rsvp           → InvitationPage RSVP form
 *
 * Static media (Express):
 * - GET  /assets/invitation_video/<slug>/...     → intro video
 * - GET  /assets/couple_images/<slug>/...        → Our Journey photos
 *
 * Backend-only (no couple UI yet):
 * - PUT  /api/couple/invitation-template
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

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    token,
    headers = {},
  } = options;

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
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
