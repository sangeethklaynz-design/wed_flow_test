"use client";

import { useEffect, useRef, useState } from "react";
import { resolveMediaUrl } from "@/lib/api";

/** Match invitation cover frame */
export const INVITE_FRAME_W = 390;
export const INVITE_FRAME_H = 844;

/**
 * Intro video locked to invitation cover size (390×844).
 * On end: fade out and hand off to the template card.
 */
export default function InvitationVideoIntro({
  videoUrl,
  onFadeStart,
  onComplete,
  autoPlay = true,
}) {
  const resolvedUrl = resolveMediaUrl(videoUrl);
  const videoRef = useRef(null);
  const completedRef = useRef(false);
  const [fading, setFading] = useState(false);

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  };

  const startFade = () => {
    if (fading) return;
    setFading(true);
    onFadeStart?.();
    setTimeout(() => {
      finish();
    }, 700);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    // Start fade out slightly before the video ends
    if (video.duration && video.currentTime >= video.duration - 0.7) {
      startFade();
    }
  };

  useEffect(() => {
    if (!resolvedUrl) {
      finish();
      return;
    }
    if (!autoPlay) return;

    let cancelled = false;
    const el = videoRef.current;
    if (!el) return;

    (async () => {
      try {
        el.muted = false;
        await el.play();
      } catch {
        try {
          if (cancelled) return;
          el.muted = true;
          await el.play();
        } catch {
          if (cancelled) return;
          try {
            await el.play();
          } catch {
            if (!cancelled) {
              finish();
            }
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedUrl, autoPlay]);

  if (!resolvedUrl) return null;

  return (
    <div
      className="absolute top-0 left-0 z-30 w-[390px] h-[844px] bg-transparent overflow-hidden pointer-events-none"
      aria-hidden
    >
      <video
        ref={videoRef}
        src={resolvedUrl}
        className={`absolute inset-0 w-full h-full object-cover object-center bg-transparent select-none transition-opacity duration-700 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
        playsInline
        autoPlay
        preload="auto"
        controls={false}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
        onEnded={startFade}
      />
    </div>
  );
}
