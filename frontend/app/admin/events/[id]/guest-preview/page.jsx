"use client";

/**
 * Admin guest-preview — full guest invitation experience with dummy data.
 * No public invite token; RSVP and post-RSVP flow stay client-side (no DB writes).
 *
 * Auth tokens live in sessionStorage (per-tab). The opener tab prefetches and
 * stashes template data in localStorage so this tab never needs to log in.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { InviteByType } from "@/lib/inviteRenderer";
import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { buildAdminGuestPreviewData } from "@/lib/adminInvitePreview";
import { guestPreviewStorageKey } from "@/lib/adminEvents";

const PREVIEW_MAX_AGE_MS = 30 * 60 * 1000;

function readStashedPreview(eventId) {
  if (typeof window === "undefined" || !eventId) return null;
  try {
    const raw = window.localStorage.getItem(guestPreviewStorageKey(eventId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.templateData) return null;
    if (
      parsed.savedAt &&
      Date.now() - Number(parsed.savedAt) > PREVIEW_MAX_AGE_MS
    ) {
      window.localStorage.removeItem(guestPreviewStorageKey(eventId));
      return null;
    }
    return parsed.templateData;
  } catch {
    return null;
  }
}

export default function AdminGuestPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || "").trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [templateData, setTemplateData] = useState(null);

  const load = useCallback(async () => {
    if (!eventId) {
      setError("Missing event id");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const stashed = readStashedPreview(eventId);
    if (stashed) {
      setTemplateData(stashed);
      setLoading(false);
      return;
    }

    // Same-tab navigation fallback: fetch with current session if available.
    const token = getAccessToken();
    if (!token) {
      setError(
        "Preview data was not found. Open Guest view again from the Events page."
      );
      setTemplateData(null);
      setLoading(false);
      return;
    }

    try {
      const [eventsRes, resourcesRes] = await Promise.all([
        apiRequest("/api/admin/events", { token }),
        apiRequest(`/api/admin/events/${encodeURIComponent(eventId)}/resources`, {
          token,
        }),
      ]);
      const found = (eventsRes.events || []).find((row) => row.id === eventId);
      if (!found) {
        setError("Event not found");
        setTemplateData(null);
        return;
      }
      const built = buildAdminGuestPreviewData(found, resourcesRes);
      setTemplateData(built);
      try {
        window.localStorage.setItem(
          guestPreviewStorageKey(eventId),
          JSON.stringify({ templateData: built, savedAt: Date.now() })
        );
      } catch {
        // ignore quota errors
      }
    } catch (err) {
      setError(err.message || "Failed to load guest preview");
      setTemplateData(null);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAF5FF] px-4">
        <p className="text-sm text-muted">Loading guest preview…</p>
      </div>
    );
  }

  if (error || !templateData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#EAF5FF] px-4">
        <p className="text-sm text-red-600 text-center">
          {error || "Could not build guest preview"}
        </p>
        <button
          type="button"
          onClick={() => router.push("/admin/events")}
          className="text-sm font-medium text-[#054380] hover:underline"
        >
          Back to events
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#EAF5FF]">
      <div className="pointer-events-none fixed top-3 left-1/2 z-50 -translate-x-1/2">
        <span className="inline-flex items-center rounded-full bg-[#054380]/90 px-3 py-1 text-[11px] font-medium tracking-wide text-white shadow-sm">
          Guest preview
        </span>
      </div>
      <div className="flex justify-center py-8 md:py-10">
        <InviteByType
          eventType={templateData?.static?.event?.type || templateData?.eventType}
          templateKey={
            templateData?.static?.event?.templateKey ||
            templateData?.templateKey ||
            "template-1"
          }
          templateData={templateData}
          guestToken={null}
          interactive
          embedded={["corporate", "party"].includes(
            String(
              templateData?.static?.event?.type || templateData?.eventType || ""
            ).toLowerCase()
          )}
        />
      </div>
    </div>
  );
}
