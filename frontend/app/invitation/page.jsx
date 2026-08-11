"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InvitationExperienceSafe from "@/components/invite/InvitationExperienceSafe";
import InvitationPreviewBackButton from "@/components/invite/InvitationPreviewBackButton";
import { apiRequest } from "@/lib/api";
import { getAccessToken, clearAuthSession } from "@/lib/auth";

/**
 * Couple full invitation template preview (scrollable).
 * API: GET /api/couple/invitation-template
 * Flow: 390×844 intro video freezes on last frame → instant cut to invitation cover.
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

  return (
    <div className="min-h-screen-zoom w-full relative flex flex-col items-center bg-gradient-to-br from-[#F5EFE6] via-[#E8DFD8] to-[#DCD3CB] overflow-x-hidden md:py-10">
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
        <InvitationExperienceSafe
          templateData={templateData}
          interactive={false}
        />
      ) : null}
    </div>
  );
}
