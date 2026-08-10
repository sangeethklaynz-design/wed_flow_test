"use client";

import { useEffect, useRef, useState } from "react";
import { resolveMediaUrl } from "@/lib/api";

/** Match invitation cover frame */
export const INVITE_FRAME_W = 390;
export const INVITE_FRAME_H = 844;

/**
 * Intro video locked to invitation cover size (390×844).
 * Music stays synced with the video: we never fade/unmount early.
 * On end: mute + pause, then fade out and hand off to the template.
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
  const fadingRef = useRef(false);
  const [fading, setFading] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  };

  const stopPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.muted = true;
      video.pause();
    } catch {
      // ignore
    }
  };

  const startFade = () => {
    if (fadingRef.current) return;
    fadingRef.current = true;
    // Stop audio immediately so music does not continue after visuals leave
    stopPlayback();
    setFading(true);
    onFadeStart?.();
    setTimeout(() => {
      finish();
    }, 700);
  };

  const tryPlay = async (withSound) => {
    const el = videoRef.current;
    if (!el) return false;
    el.muted = !withSound;
    await el.play();
    return true;
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
        await tryPlay(true);
        if (!cancelled) setNeedsTap(false);
      } catch {
        if (cancelled) return;
        // Browser blocked autoplay with sound — require a tap so music plays with video
        setNeedsTap(true);
        try {
          await tryPlay(false);
        } catch {
          if (!cancelled) finish();
        }
      }
    })();

    return () => {
      cancelled = true;
      stopPlayback();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedUrl, autoPlay]);

  const handleTapToPlay = async () => {
    try {
      await tryPlay(true);
      setNeedsTap(false);
    } catch {
      try {
        await tryPlay(false);
        setNeedsTap(false);
      } catch {
        finish();
      }
    }
  };

  if (!resolvedUrl) return null;

  return (
    <div
      className={`absolute top-0 left-0 z-30 w-[390px] h-[844px] bg-[#FAF6F0] overflow-hidden ${
        needsTap ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!needsTap}
    >
      <video
        ref={videoRef}
        src={resolvedUrl}
        className={`absolute inset-0 w-full h-full object-cover object-center bg-[#FAF6F0] select-none transition-opacity duration-700 scale-[1.02] origin-center ${
          fading ? "opacity-0" : "opacity-100"
        }`}
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        onEnded={startFade}
      />

      {needsTap && !fading ? (
        <button
          type="button"
          onClick={handleTapToPlay}
          className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#1c2333]/35 pointer-events-auto"
        >
          <span className="bg-white/95 text-navy font-serif font-bold text-base px-6 py-3 rounded-full shadow-md">
            Tap to open invitation
          </span>
          <span className="mt-3 text-white/90 text-xs font-sans">
            Sound on
          </span>
        </button>
      ) : null}
    </div>
  );
}
