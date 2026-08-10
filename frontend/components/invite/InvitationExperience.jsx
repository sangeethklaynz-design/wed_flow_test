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
  }, []);

  const handleVideoComplete = useCallback(() => {
    setVideoState("done");
    // Start fading in the template only AFTER the video has fully faded out and unmounted
    setTemplateVisible(true);
  }, []);

  if (!templateData) return null;

  const isVideoActive = videoState === "playing" || videoState === "fading";

  return (
    <main
      className="relative card-shadow md:rounded-2xl overflow-hidden"
      style={{
        width: INVITE_FRAME_W,
        height: isVideoActive ? INVITE_FRAME_H : undefined,
        backgroundColor: "#FFFDF3",
        backgroundImage: "radial-gradient(at 20% 20%, rgba(181, 74, 182, 0.12) 0%, transparent 60%), radial-gradient(at 80% 80%, rgba(119, 50, 164, 0.12) 0%, transparent 60%)"
      }}
    >
      <div className="relative w-[390px]">
        {/* Template Card - hidden while video fades out, then fades in smoothly */}
        <div 
          className={`relative w-full h-full transition-opacity duration-700 ${
            templateVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <InvitationPage
            data={templateData}
            guestToken={guestToken}
            interactive={interactive && !isVideoActive}
            embedded
          />
        </div>

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
