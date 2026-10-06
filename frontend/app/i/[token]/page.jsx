"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { InviteByType } from "@/lib/inviteRenderer";
import { apiRequest } from "@/lib/api";
import { useVisibilityPolling } from "@/lib/useVisibilityPolling";

/**
 * Public guest invitation page (unique link per guest).
 * APIs:
 * - GET  /api/public/invite/:token/invitation-template
 * - POST /api/public/invite/:token/rsvp
 */
export default function PublicGuestInvitePage() {
  const params = useParams();
  const token = String(params?.token || "");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [templateData, setTemplateData] = useState(null);

  const loadTemplate = useCallback(
    async ({ silent = false } = {}) => {
      if (!token) {
        setError("Missing invitation link");
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);

      try {
        const data = await apiRequest(
          `/api/public/invite/${encodeURIComponent(token)}/invitation-template`
        );
        setTemplateData((prev) => {
          if (prev && JSON.stringify(prev) === JSON.stringify(data)) {
            return prev;
          }
          return data;
        });
        setError("");
      } catch (err) {
        if (!silent) {
          setError(err.message || "Invitation not found");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  useVisibilityPolling(() => loadTemplate({ silent: true }));

  const eventType =
    templateData?.static?.event?.type || templateData?.eventType || "wedding";
  const templateKey =
    templateData?.static?.event?.templateKey ||
    templateData?.templateKey ||
    "template-1";
  const useEmbeddedInvite = false;

  return (
    <div className="min-h-screen-zoom w-full relative flex flex-col items-center justify-start bg-[#EAF5FF] md:bg-gradient-to-br md:from-[#EAF5FF] md:via-[#E8DFD8] md:to-[#DCD3CB] overflow-x-hidden md:py-10">
      {error ? (
        <div className="mb-4 w-[390px] bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3 text-center">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-muted text-sm py-20">Opening invitation…</p>
      ) : null}

      {templateData ? (
        <InviteByType
          eventType={eventType}
          templateKey={templateKey}
          templateData={templateData}
          guestToken={token}
          interactive
          embedded={useEmbeddedInvite}
        />
      ) : null}

      {!loading && !templateData && error ? (
        <div className="w-[390px] min-h-[40vh] rounded-2xl bg-[#EAF5FF] flex flex-col items-center justify-center px-6 text-center">
          <p className="font-serif font-bold text-2xl text-navy mb-2">
            Invitation unavailable
          </p>
          <p className="text-muted text-sm">
            This link may be invalid or expired. Please contact the hosts for
            a new invitation.
          </p>
        </div>
      ) : null}
    </div>
  );
}
