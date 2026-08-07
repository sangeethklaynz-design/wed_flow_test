"use client";

import { useCallback, useState } from "react";
import InvitationPage from "@/components/invite/InvitationPage";
import InvitationVideoIntro, {
  INVITE_FRAME_H,
  INVITE_FRAME_W,
} from "@/components/invite/InvitationVideoIntro";

/**
 * Shared phone shell: video and invitation share the exact 390×844 frame.
 *
 * Seamless handoff: the video’s last frame becomes a permanent cover image
 * over page 1 (same pixels) — no fade onto a different HTML render.
 */
export default function InvitationExperience({
  templateData,
  guestToken = null,
  interactive = false,
}) {
  const hasVideo = Boolean(
    templateData?.static?.video?.hasVideo && templateData?.static?.video?.url
  );
  const [playing, setPlaying] = useState(hasVideo);
  const [coverDataUrl, setCoverDataUrl] = useState(null);

  const handleVideoComplete = useCallback((dataUrl) => {
    // Same React tick: mount last-frame cover + unmount <video> (no fade gap)
    if (dataUrl) setCoverDataUrl(dataUrl);
    setPlaying(false);
  }, []);

  if (!templateData) return null;

  return (
    <main
      className="relative bg-[#FAF6F0] card-shadow md:rounded-2xl overflow-hidden"
      style={{
        width: INVITE_FRAME_W,
        height: playing ? INVITE_FRAME_H : undefined,
      }}
    >
      <div className="relative w-[390px]">
        <InvitationPage
          data={templateData}
          guestToken={guestToken}
          interactive={interactive && !playing}
          embedded
        />

        {/* Permanent cover = last video frame (pixel-identical to end of video) */}
        {coverDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverDataUrl}
            alt=""
            width={INVITE_FRAME_W}
            height={INVITE_FRAME_H}
            draggable={false}
            className="absolute top-0 left-0 z-20 w-[390px] h-[844px] object-cover object-center pointer-events-none select-none"
          />
        ) : null}

        {playing && hasVideo ? (
          <InvitationVideoIntro
            videoUrl={templateData.static.video.url}
            onComplete={handleVideoComplete}
            autoPlay
          />
        ) : null}
      </div>
    </main>
  );
}
