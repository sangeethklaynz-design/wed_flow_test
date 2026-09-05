"use client";

import { useEffect, useRef } from "react";
import { resolveMediaUrl } from "@/lib/api";

/**
 * Looping invitation background music.
 * Starts when `active` becomes true (typically after the opening video ends).
 */
export default function InvitationBackgroundMusic({ musicUrl, active = false }) {
  const resolvedUrl = resolveMediaUrl(musicUrl);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !resolvedUrl) return undefined;

    if (!active) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // ignore
      }
      return undefined;
    }

    audio.loop = true;
    audio.volume = 0.7;

    (async () => {
      try {
        await audio.play();
      } catch {
        // Autoplay may be blocked if there was no prior user gesture.
        // Video tap usually unlocks audio for this session.
      }
    })();

    return () => {
      try {
        audio.pause();
      } catch {
        // ignore
      }
    };
  }, [resolvedUrl, active]);

  if (!resolvedUrl) return null;

  return (
    <audio
      ref={audioRef}
      key={resolvedUrl}
      src={resolvedUrl}
      preload="auto"
      loop
      playsInline
      className="hidden"
      aria-hidden
    />
  );
}
