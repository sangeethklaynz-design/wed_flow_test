"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import InvitationPage from "@/components/invite/InvitationPage";
import InvitationVideoIntro, {
  INVITE_FRAME_H,
  INVITE_FRAME_W,
} from "@/components/invite/InvitationVideoIntro";
import InvitationBackgroundMusic from "@/components/invite/InvitationBackgroundMusic";
import { invitePage, dynamicField } from "@/templates/weddings/template-1/manifest";

/**
 * Shared phone shell: video and invitation share the exact 390x844 frame.
 *
 * Crossfade handoff: video fades out and template fades in for a smooth transition.
 * Pages: openingVideo (this shell) then InvitationPage sections.
 *
 * Admin preview extras:
 * - skipIntro: jump straight to invitation pages
 * - previewMuted: keep intro muted for autoplay in admin modal
 */
export default function InvitationExperience({
  templateData,
  guestToken = null,
  interactive = false,
  skipIntro = false,
  previewMuted = false,
  templateConfig = null,
}) {
  const hasVideo = Boolean(
    !skipIntro &&
      templateData?.static?.video?.hasVideo &&
      templateData?.static?.video?.url
  );
  const musicUrl =
    templateData?.static?.music?.hasMusic && templateData?.static?.music?.url
      ? templateData.static.music.url
      : null;
  const [videoState, setVideoState] = useState(hasVideo ? "playing" : "done");
  const [templateVisible, setTemplateVisible] = useState(!hasVideo);
  const [guestCanSkip, setGuestCanSkip] = useState(false);

  const isGuestView = Boolean(guestToken);
  const guestVideoSeenKey = useMemo(
    () => (guestToken ? `wedflow_invite_video_seen_${guestToken}` : null),
    [guestToken]
  );

  useEffect(() => {
    if (skipIntro || !hasVideo) {
      setVideoState("done");
      setTemplateVisible(true);
      return;
    }
    setVideoState("playing");
    setTemplateVisible(false);
  }, [skipIntro, hasVideo, templateData?.static?.video?.url]);

  useEffect(() => {
    if (!hasVideo || !guestVideoSeenKey || typeof window === "undefined") return;
    const seenBefore = window.localStorage.getItem(guestVideoSeenKey) === "1";
    setGuestCanSkip(seenBefore);
    if (!seenBefore) {
      window.localStorage.setItem(guestVideoSeenKey, "1");
    }
  }, [guestVideoSeenKey, hasVideo]);

  const handleFadeStart = useCallback(() => {
    setVideoState("fading");
    setTemplateVisible(true);
  }, []);

  const handleVideoComplete = useCallback(() => {
    setTemplateVisible(true);
    setVideoState("done");
  }, []);

  if (!templateData) return null;

  const isVideoActive = videoState === "playing" || videoState === "fading";
  const showTemplate = videoState !== "playing";
  const showSkipButton = hasVideo && (previewMuted || !isGuestView || guestCanSkip);
  const musicActive = videoState === "done" && !previewMuted;

  const accent =
    templateConfig?.fields?.colorAccent ||
    templateData?.templateConfig?.fields?.colorAccent ||
    "#FAF6F0";

  return (
    <main
      className={`relative overflow-hidden border-0 outline-none isolate ${
        isVideoActive ? "" : "card-shadow md:rounded-2xl"
      }`}
      style={{
        width: INVITE_FRAME_W,
        height: isVideoActive ? INVITE_FRAME_H : undefined,
        backgroundColor: accent,
        backgroundImage: isVideoActive
          ? "none"
          : "radial-gradient(at 20% 20%, rgba(181, 74, 182, 0.12) 0%, transparent 60%), radial-gradient(at 80% 80%, rgba(119, 50, 164, 0.12) 0%, transparent 60%)",
      }}
      {...invitePage("openingVideo")}
      {...dynamicField("openingVideo")}
    >
      <InvitationBackgroundMusic musicUrl={musicUrl} active={musicActive} />
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
              templateConfig={
                templateConfig || templateData?.templateConfig || null
              }
            />
          </div>
        ) : null}

        {isVideoActive ? (
          <InvitationVideoIntro
            videoUrl={templateData.static.video.url}
            onFadeStart={handleFadeStart}
            onComplete={handleVideoComplete}
            onSkip={handleVideoComplete}
            autoPlay
            showSkipButton={showSkipButton}
          />
        ) : null}
      </div>
    </main>
  );
}
