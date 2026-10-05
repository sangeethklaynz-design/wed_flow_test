/**
 * Template chrome URLs (design assets shared per template).
 *
 * Disk: backend/events/{weddings|corporate-events|parties}/templates/{key}/chrome/...
 * URL:  /assets/events/{folder}/templates/{key}/chrome/...
 * Served by Express `/assets/events` and proxied via Next rewrites in local/dev.
 */

import { getApiBaseUrl, resolveMediaUrl } from "@/lib/api";

export const EVENT_TYPE_FOLDER = {
  wedding: "weddings",
  corporate: "corporate-events",
  party: "parties",
};

export function folderForEventType(eventType) {
  const type = String(eventType || "wedding").toLowerCase();
  return EVENT_TYPE_FOLDER[type] || EVENT_TYPE_FOLDER.wedding;
}

/**
 * Path-only chrome URL (works with Next rewrite → API).
 * @param {string} eventType wedding | corporate | party
 * @param {string} relativePath e.g. "landing/logo.webp" or "9.1.png"
 * @param {string} [templateKey="template-1"]
 */
export function chromePath(
  eventType,
  relativePath,
  templateKey = "template-1"
) {
  if (!relativePath) return null;
  const folder = folderForEventType(eventType);
  const key = String(templateKey || "template-1").trim() || "template-1";
  const rel = String(relativePath)
    .replace(/^[/\\]+/, "")
    .replace(/\\/g, "/");
  return `/assets/events/${folder}/templates/${key}/chrome/${rel}`;
}

/** Absolute chrome URL (API host). Prefer chromePath + rewrite for <img>/CSS. */
export function chromeUrl(eventType, relativePath, templateKey = "template-1") {
  const path = chromePath(eventType, relativePath, templateKey);
  return resolveMediaUrl(path);
}

export function weddingChrome(relativePath, templateKey = "template-1") {
  return chromePath("wedding", relativePath, templateKey);
}

export function corporateChrome(relativePath, templateKey = "template-1") {
  return chromePath("corporate", relativePath, templateKey);
}

export function partyChrome(relativePath, templateKey = "template-1") {
  return chromePath("party", relativePath, templateKey);
}

export function chromeBasePath(eventType, templateKey = "template-1") {
  const folder = folderForEventType(eventType);
  const key = String(templateKey || "template-1").trim() || "template-1";
  return `/assets/events/${folder}/templates/${key}/chrome`;
}

export { getApiBaseUrl };
