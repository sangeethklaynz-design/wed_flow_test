"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import InvitationExperienceSafe from "@/components/invite/InvitationExperienceSafe";
import { apiRequest } from "@/lib/api";

/**
 * Public guest invitation page (unique link per guest).
 * APIs:
 * - GET  /api/public/invite/:token/invitation-template
 * - POST /api/public/invite/:token/rsvp
 * Flow: 390×844 intro video freezes on last frame → instant cut to invitation cover.
 */
export default function PublicGuestInvitePage() {
  const params = useParams();
  const token = String(params?.token || "");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [templateData, setTemplateData] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("Missing invitation link");
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await apiRequest(
          `/api/public/invite/${encodeURIComponent(token)}/invitation-template`
        );
        if (cancelled) return;
        setTemplateData(data);
        setError("");
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Invitation not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen-zoom w-full relative flex flex-col items-center bg-gradient-to-br from-[#F5EFE6] via-[#E8DFD8] to-[#DCD3CB] overflow-x-hidden md:py-10">
      {error ? (
        <div className="mb-4 w-[390px] bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3 text-center">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-muted text-sm py-20">Opening invitation…</p>
      ) : null}

      {templateData ? (
        <InvitationExperienceSafe
          templateData={templateData}
          guestToken={token}
          interactive
        />
      ) : null}

      {!loading && !templateData && error ? (
        <div className="w-[390px] min-h-[40vh] rounded-2xl bg-[#FAF6F0] flex flex-col items-center justify-center px-6 text-center">
          <p className="font-serif font-bold text-2xl text-navy mb-2">
            Invitation unavailable
          </p>
          <p className="text-muted text-sm">
            This link may be invalid or expired. Please contact the couple for
            a new invitation.
          </p>
        </div>
      ) : null}
    </div>
  );
}
