"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Volume2, VolumeX } from "lucide-react";
import { resolveMediaUrl } from "@/lib/api";

/**
 * Looping invitation background music.
 * Starts when `active` becomes true (typically after the opening video ends).
 * Mute control matches the invitation video skip button style and stays fixed
 * to the viewport (ported outside InviteMobileScaler transforms).
 */
export default function InvitationBackgroundMusic({
  musicUrl,
  active = false,
  showMuteButton = true,
}) {
  const resolvedUrl = resolveMediaUrl(musicUrl);
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

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
    audio.muted = muted;

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
  }, [muted]);

  if (!resolvedUrl) return null;

  const muteButton =
    active && showMuteButton && portalReady
      ? createPortal(
          <button
            type="button"
            onClick={() => setMuted((prev) => !prev)}
            className="fixed right-4 bottom-4 z-[100] inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/95 backdrop-blur-sm border border-border card-shadow hover:bg-cream transition-colors pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e69e46]/60"
            aria-label={muted ? "Unmute background music" : "Mute background music"}
            aria-pressed={muted}
          >
            {muted ? (
              <VolumeX className="w-5 h-5 text-gold-text" strokeWidth={2.4} />
            ) : (
              <Volume2 className="w-5 h-5 text-gold-text" strokeWidth={2.4} />
            )}
          </button>,
          document.body
        )
      : null;

  return (
    <>
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
      {muteButton}
    </>
  );
}
