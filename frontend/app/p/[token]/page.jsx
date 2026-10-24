"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { InviteByType } from "@/lib/inviteRenderer";
import { apiRequest } from "@/lib/api";

/**
 * Public (non-personalized) event invitation.
 * APIs:
 * - GET  /api/public/p/:token
 * - POST /api/public/p/:token/rsvp  (via RsvpPage)
 * After RSVP, redirects to /i/{guestToken} for ticketing.
 */
export default function PublicEventInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params?.token || "");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [templateData, setTemplateData] = useState(null);

  const loadTemplate = useCallback(async () => {
    if (!token) {
      setError("Missing public invitation link");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest(
        `/api/public/p/${encodeURIComponent(token)}`
      );
      setTemplateData(data);
      setError("");
    } catch (err) {
      setError(err.message || "Invitation not found");
      setTemplateData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const handleRsvpSuccess = useCallback(
    (payload) => {
      const guestToken = payload?.guestToken || payload?.uniqueToken;
      if (guestToken) {
        router.replace(`/i/${encodeURIComponent(guestToken)}`);
      }
    },
    [router]
  );

  const eventType =
    templateData?.static?.event?.type || templateData?.eventType || "corporate";
  const templateKey =
    templateData?.static?.event?.templateKey ||
    templateData?.templateKey ||
    "template-1";

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
          guestToken={null}
          publicEventToken={token}
          onRsvpSuccess={handleRsvpSuccess}
          interactive
          embedded={false}
        />
      ) : null}

      {!loading && !templateData && error ? (
        <div className="w-[390px] min-h-[40vh] rounded-2xl bg-[#EAF5FF] flex flex-col items-center justify-center px-6 text-center">
          <p className="font-serif font-bold text-2xl text-navy mb-2">
            Invitation unavailable
          </p>
          <p className="text-muted text-sm">
            This public link may be invalid or disabled. Please contact the
            event organizer.
          </p>
        </div>
      ) : null}
    </div>
  );
}
