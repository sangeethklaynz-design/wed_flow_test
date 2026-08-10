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
 * Crossfade handoff: video fades out and template fades in for a smooth transition.
 */
export default function InvitationExperience({
  templateData,
  guestToken = null,
  interactive = false,
}) {
  const hasVideo = Boolean(
    templateData?.static?.video?.hasVideo && templateData?.static?.video?.url
  );
  const [videoState, setVideoState] = useState(hasVideo ? "playing" : "done");
  const [templateVisible, setTemplateVisible] = useState(!hasVideo);

  const handleFadeStart = useCallback(() => {
    setVideoState("fading");
    // Reveal template under the fading video (clipped to the 390×844 frame)
    setTemplateVisible(true);
  }, []);

  const handleVideoComplete = useCallback(() => {
    setVideoState("done");
  }, []);

  if (!templateData) return null;

  const isVideoActive = videoState === "playing" || videoState === "fading";
  const showTemplate = videoState !== "playing";

  return (
    <main
      className={`relative overflow-hidden border-0 outline-none isolate ${
        isVideoActive ? "" : "card-shadow md:rounded-2xl"
      }`}
      style={{
        width: INVITE_FRAME_W,
        height: isVideoActive ? INVITE_FRAME_H : undefined,
        backgroundColor: "#FAF6F0",
        backgroundImage: isVideoActive
          ? "none"
          : "radial-gradient(at 20% 20%, rgba(181, 74, 182, 0.12) 0%, transparent 60%), radial-gradient(at 80% 80%, rgba(119, 50, 164, 0.12) 0%, transparent 60%)",
      }}
    >
      {/*
        While the video plays, keep the tall invitation out of document flow
        (absolute + clipped) so it cannot create a white strip below the frame.
      */}
      <div
        className={
          isVideoActive
            ? "absolute inset-0 w-[390px] h-[844px] overflow-hidden"
            : "relative w-[390px]"
        }
      >
        {showTemplate ? (
          <div
            className={`w-full transition-opacity duration-700 ${
              templateVisible ? "opacity-100" : "opacity-0"
            } ${isVideoActive ? "pointer-events-none" : ""}`}
          >
            <InvitationPage
              data={templateData}
              guestToken={guestToken}
              interactive={interactive && !isVideoActive}
              embedded
            />
          </div>
        ) : null}

        {isVideoActive ? (
          <InvitationVideoIntro
            videoUrl={templateData.static.video.url}
            onFadeStart={handleFadeStart}
            onComplete={handleVideoComplete}
            autoPlay
          />
        ) : null}
      </div>
    </main>
  );
}
