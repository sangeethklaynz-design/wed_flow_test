"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { MapPin, Play, SkipForward } from "lucide-react";
import { apiRequest } from "@/lib/api";
import GuestRsvpForm from "@/components/invite/GuestRsvpForm";

function preloadImages(urls) {
  urls.filter(Boolean).forEach((url) => {
    const img = new window.Image();
    img.src = url;
  });
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PublicInviteTemplate({ data }) {
  const { wedding, invitation, images, milestones, contacts } = data;
  const heroImage = images?.[0]?.url;

  return (
    <div className="bg-white rounded-[32px] border border-border card-shadow overflow-hidden">
      {heroImage ? (
        <div className="relative w-full h-56 sm:h-72 bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt={images[0]?.caption || "Couple"}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-40 bg-gold/60 flex items-center justify-center px-4">
          <p className="font-serif text-2xl text-navy text-center">
            {wedding?.coupleNames || "Our Wedding"}
          </p>
        </div>
      )}

      <div className="p-6 md:p-8 space-y-8">
        <div className="text-center">
          <p className="text-muted text-sm mb-2">You are invited</p>
          <h1 className="font-serif font-bold text-3xl md:text-4xl text-navy mb-3">
            {wedding?.coupleNames || "—"}
          </h1>
          {wedding?.weddingDate ? (
            <p className="text-navy font-medium">
              {formatDisplayDate(wedding.weddingDate)}
            </p>
          ) : null}
          {invitation?.specialText ? (
            <p className="text-muted text-sm md:text-base mt-4 max-w-xl mx-auto leading-relaxed">
              {invitation.specialText}
            </p>
          ) : null}
        </div>

        {(invitation?.hotelName ||
          invitation?.poruwaTime ||
          invitation?.googleMapsLink) && (
          <div className="bg-cream rounded-2xl border border-border p-5 space-y-3">
            <h2 className="font-serif font-bold text-xl text-navy">Ceremony</h2>
            {invitation.poruwaTime ? (
              <p className="text-navy text-sm">
                Poruwa time:{" "}
                <span className="font-medium">{invitation.poruwaTime}</span>
              </p>
            ) : null}
            {invitation.hotelName ? (
              <p className="text-navy text-sm flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#e69e46]" />
                <span>{invitation.hotelName}</span>
              </p>
            ) : null}
            {invitation.googleMapsLink ? (
              <a
                href={invitation.googleMapsLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-sm font-medium text-[#e69e46] hover:underline"
              >
                Open in Google Maps
              </a>
            ) : null}
          </div>
        )}

        {images?.length > 1 ? (
          <div>
            <h2 className="font-serif font-bold text-xl text-navy mb-4">
              Our moments
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {images.slice(1).map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-cream border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.caption || "Couple photo"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {milestones?.length ? (
          <div>
            <h2 className="font-serif font-bold text-xl text-navy mb-4">
              Our story
            </h2>
            <div className="space-y-4">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="border-l-2 border-[#e69e46]/50 pl-4 py-1"
                >
                  <p className="text-xs font-medium text-[#e69e46] mb-1">
                    {m.yearOrDate}
                  </p>
                  <p className="font-medium text-navy">{m.title}</p>
                  {m.description ? (
                    <p className="text-sm text-muted mt-1">{m.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {(invitation?.weatherNote || invitation?.parkingNote) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {invitation.weatherNote ? (
              <div className="bg-cream rounded-2xl border border-border p-4">
                <p className="text-xs font-medium text-muted mb-1">Weather</p>
                <p className="text-sm text-navy">{invitation.weatherNote}</p>
              </div>
            ) : null}
            {invitation.parkingNote ? (
              <div className="bg-cream rounded-2xl border border-border p-4">
                <p className="text-xs font-medium text-muted mb-1">Parking</p>
                <p className="text-sm text-navy">{invitation.parkingNote}</p>
              </div>
            ) : null}
          </div>
        )}

        {contacts?.length ? (
          <div>
            <h2 className="font-serif font-bold text-xl text-navy mb-4">
              Contacts
            </h2>
            <div className="space-y-3">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 bg-cream rounded-xl border border-border px-4 py-3"
                >
                  <div>
                    <p className="text-navy font-medium text-sm">{c.name}</p>
                    {c.relationType ? (
                      <p className="text-xs text-muted">{c.relationType}</p>
                    ) : null}
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="text-sm text-[#e69e46] font-medium"
                  >
                    {c.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {invitation?.thankYouNote ? (
          <p className="text-center text-muted text-sm leading-relaxed">
            {invitation.thankYouNote}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function PublicGuestInvitePage() {
  const params = useParams();
  const token = String(params?.token || "");
  const videoRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invite, setInvite] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [videoStarted, setVideoStarted] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing invitation link");
      setLoading(false);
      setPhase("empty");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await apiRequest(`/api/public/invite/${encodeURIComponent(token)}`);
        if (cancelled) return;
        setInvite(data);
        preloadImages((data.images || []).map((img) => img.url));

        if (data.video?.hasVideo && data.video.url) {
          setPhase("video");
        } else {
          setPhase("template");
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Invitation not found");
        setPhase("empty");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const showTemplate = () => setPhase("template");

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-10 space-y-6">
        <div className="text-center">
          <p className="font-serif text-2xl font-bold text-navy">Wed Flow</p>
          <p className="text-muted text-xs mt-1">Wedding invitation</p>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3 text-center">
            {error}
          </div>
        ) : null}

        {loading || phase === "loading" ? (
          <div className="min-h-[40vh] rounded-[32px] bg-white border border-border card-shadow flex items-center justify-center">
            <p className="text-muted text-sm">Opening invitation…</p>
          </div>
        ) : null}

        {phase === "video" && invite?.video?.url ? (
          <div className="relative w-full min-h-[55vh] rounded-[32px] overflow-hidden card-shadow bg-[#1A1D2E]">
            <video
              ref={videoRef}
              src={invite.video.url}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              controls={videoStarted}
              onEnded={showTemplate}
            />
            {!videoStarted ? (
              <button
                type="button"
                onClick={async () => {
                  setVideoStarted(true);
                  try {
                    await videoRef.current?.play();
                  } catch {
                    // controls available if autoplay blocked
                  }
                }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-navy/35"
              >
                <span className="w-16 h-16 rounded-full bg-white/95 text-navy flex items-center justify-center shadow-lg">
                  <Play className="w-7 h-7 ml-0.5" fill="currentColor" />
                </span>
                <span className="text-white font-medium text-sm">Play intro</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={showTemplate}
                className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 bg-white/90 text-navy text-xs font-medium px-3 py-2 rounded-full"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Skip
              </button>
            )}
          </div>
        ) : null}

        {phase === "template" && invite ? (
          <div className="space-y-6">
            <PublicInviteTemplate data={invite} />
            <GuestRsvpForm
              token={token}
              guest={invite.guest}
              onSubmitted={(guest) =>
                setInvite((prev) => (prev ? { ...prev, guest } : prev))
              }
            />
          </div>
        ) : null}

        {phase === "empty" && !loading ? (
          <div className="min-h-[40vh] rounded-[32px] bg-white border border-border card-shadow flex flex-col items-center justify-center px-6 text-center">
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
    </div>
  );
}
