"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InviteByType } from "@/lib/inviteRenderer";
import InvitationPreviewBackButton from "@/components/invite/InvitationPreviewBackButton";
import { apiRequest } from "@/lib/api";
import { getAccessToken, clearAuthSession } from "@/lib/auth";

/**
 * Client full invitation template preview (scrollable).
 * API: GET /api/couple/invitation-template
 */
export default function PublicInvitationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [templateData, setTemplateData] = useState(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await apiRequest("/api/couple/invitation-template", { token });
        if (!cancelled) {
          setTemplateData(data);
          setError("");
        }
      } catch (err) {
        if (cancelled) return;
        if (err.status === 401) {
          clearAuthSession();
          router.replace("/login");
          return;
        }
        setError(err.message || "Failed to load invitation");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const eventType =
    templateData?.static?.event?.type || templateData?.eventType || "wedding";
  const templateKey =
    templateData?.static?.event?.templateKey ||
    templateData?.templateKey ||
    "template-1";
  const isCorporate = String(eventType).toLowerCase() === "corporate";
  const isParty = String(eventType).toLowerCase() === "party";
  const useEmbeddedInvite = isCorporate || isParty;

  return (
    <div className="min-h-screen-zoom w-full relative flex flex-col items-stretch md:items-center bg-[#EAF5FF] md:bg-gradient-to-br md:from-[#EAF5FF] md:via-[#E8DFD8] md:to-[#DCD3CB] overflow-x-hidden md:py-10">
      <InvitationPreviewBackButton />

      {error ? (
        <div className="mb-4 w-[390px] bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-muted text-sm py-20">Loading invitation…</p>
      ) : null}

      {templateData ? (
        <InviteByType
          eventType={eventType}
          templateKey={templateKey}
          templateData={templateData}
          interactive={false}
          embedded={useEmbeddedInvite}
        />
      ) : null}
    </div>
  );
}
