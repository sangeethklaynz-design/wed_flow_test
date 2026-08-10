"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import InvitationPage from "@/components/invite/InvitationPage";
import { apiRequest } from "@/lib/api";
import { getAccessToken, clearAuthSession } from "@/lib/auth";

function ResponsivePhone({ children, onClick }) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        // Phone mockup is 418px wide and 872px tall
        // We add a tiny bit of padding (e.g. 32px) so it doesn't touch the edges
        const scaleX = (width - 32) / 418;
        const scaleY = (height - 32) / 872;
        setScale(Math.min(1, scaleX, scaleY));
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <button
        type="button"
        onClick={onClick}
        style={{ transform: `scale(${scale})` }}
        className="group origin-center w-[418px] h-[872px] shrink-0 rounded-[48px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-[14px] border-slate-900 bg-[#FAF6F0] overflow-hidden flex flex-col relative text-left cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#e69e46] transition-transform"
        aria-label="Open full wedding invitation template"
      >
        {children}
      </button>
    </div>
  );
}

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

      <div className="flex-1 relative bg-gray-50/50 border border-gray-200/50 rounded-[32px] card-shadow overflow-hidden min-h-[60vh] flex items-center justify-center">
        {loading ? (
          <p className="text-muted text-sm relative z-10">Loading invitation preview…</p>
        ) : (
          <ResponsivePhone onClick={openFullInvitation}>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-1 bg-slate-800 rounded-full mb-1" />
              <div className="w-2 h-2 bg-slate-800 rounded-full ml-3 mb-1" />
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none pointer-events-none select-none relative bg-[#FAF6F0] flex justify-center">
              <InvitationPage data={templateData} interactive={false} />
            </div>

            <div className="absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent px-6 pb-8 pt-20 pointer-events-none flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-navy shadow-lg group-hover:bg-white group-hover:scale-105 transition-all">
                <ExternalLink className="w-4 h-4 text-[#e69e46]" />
                Tap to open full invitation
              </span>
            </div>
          </ResponsivePhone>
        )}
      </div>
    </div>
  );
}
