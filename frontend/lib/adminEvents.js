import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { buildAdminGuestPreviewData } from "@/lib/adminInvitePreview";

export const EVENT_TYPE_LABELS = {
  wedding: "Wedding",
  corporate: "Corporate",
  party: "Party",
};

export const EVENT_TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "wedding", label: "Wedding" },
  { id: "corporate", label: "Corporate" },
  { id: "party", label: "Party" },
];

export const EVENT_STATUS_FILTERS = [
  { id: "all", label: "All status" },
  { id: "ongoing", label: "Ongoing" },
  { id: "past", label: "Past" },
];

export function formatEventType(type) {
  return EVENT_TYPE_LABELS[type] || type || "—";
}

export function formatEventStatus(status) {
  if (status === "ongoing") return "Ongoing";
  if (status === "past") return "Past";
  return status || "—";
}

export function formatEventDate(value) {
  if (!value) return "—";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** localStorage key for cross-tab guest preview handoff (sessionStorage is per-tab). */
export function guestPreviewStorageKey(eventId) {
  return `wedflow_admin_guest_preview_${eventId}`;
}

/** Load event + resources and build guest preview payload (caller must be authenticated). */
export async function fetchAdminGuestPreviewData(eventId, eventHint = null) {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");

  let event = eventHint;
  if (!event?.id || event.templateConfig == null) {
    const eventsRes = await apiRequest("/api/admin/events", { token });
    event = (eventsRes.events || []).find((row) => row.id === eventId);
  }
  if (!event) throw new Error("Event not found");

  const resources = await apiRequest(
    `/api/admin/events/${encodeURIComponent(eventId)}/resources`,
    { token }
  );
  return buildAdminGuestPreviewData(event, resources);
}

/**
 * Prefetch invitation payload in the authenticated tab, stash it for the new tab,
 * then open guest preview (avoids login — sessionStorage is not shared across tabs).
 */
export async function openAdminGuestPreview(eventId, eventHint = null) {
  if (!eventId || typeof window === "undefined") return;

  const url = `/admin/events/${encodeURIComponent(eventId)}/guest-preview`;

  try {
    const templateData = await fetchAdminGuestPreviewData(eventId, eventHint);
    if (templateData) {
      window.localStorage.setItem(
        guestPreviewStorageKey(eventId),
        JSON.stringify({
          templateData,
          savedAt: Date.now(),
        })
      );
    }
  } catch {
    // Still open the tab; page shows a recoverable error if stash failed.
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
