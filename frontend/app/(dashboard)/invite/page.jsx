"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import InvitationPage from "@/components/invite/InvitationPage";
import { apiRequest } from "@/lib/api";
import { getAccessToken, clearAuthSession } from "@/lib/auth";

/**
 * Dashboard Invite tab — phone preview of the visual template.
 * API: GET /api/couple/invitation-template (static wedding data)
 * Full template route: /invitation — plays intro video fullscreen, then template
 * Clicking the phone preview navigates to /invitation (video starts immediately).
 */
export default function InvitePage() {
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
        setError(err.message || "Failed to load invitation preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const openFullInvitation = () => {
    router.push("/invitation");
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 w-full flex flex-col h-full min-h-[calc(100vh-80px)] md:min-h-screen">
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-3xl md:text-4xl text-navy mb-2">
            Invitation Preview
          </h1>
          <p className="text-muted text-sm md:text-base">
            Preview the cover section of your wedding invite, then open the full
            template
          </p>
        </div>

        <button
          type="button"
          onClick={openFullInvitation}
          className="inline-flex items-center gap-2 self-start sm:self-auto bg-navy text-white font-medium px-4 py-2.5 rounded-xl hover:bg-navy/90 transition-colors"
        >
          <ExternalLink className="w-4 h-4" strokeWidth={2.25} />
          View full invitation
        </button>
      </div>

      {error ? (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">
          {error}
        </div>
      ) : null}

      <div className="flex justify-center items-center flex-1 py-8 bg-gray-50/50 border border-gray-200/50 rounded-[32px] card-shadow overflow-hidden min-h-[70vh]">
        {loading ? (
          <p className="text-muted text-sm">Loading invitation preview…</p>
        ) : (
          <button
            type="button"
            onClick={openFullInvitation}
            className="group w-[390px] h-[875px] max-h-[85vh] rounded-[48px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border-[14px] border-slate-900 bg-[#FAF6F0] overflow-hidden flex flex-col relative text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e69e46] focus-visible:ring-offset-2"
            aria-label="Open full wedding invitation template"
          >
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-1 bg-slate-800 rounded-full mb-1" />
              <div className="w-2 h-2 bg-slate-800 rounded-full ml-3 mb-1" />
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none pointer-events-none select-none">
              <InvitationPage data={templateData} interactive={false} />
            </div>

            <div className="absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-navy/80 via-navy/35 to-transparent px-6 pb-6 pt-16 pointer-events-none">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-navy shadow-md group-hover:bg-white transition-colors">
                <ExternalLink className="w-4 h-4 text-[#e69e46]" />
                Tap to open full invitation
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
