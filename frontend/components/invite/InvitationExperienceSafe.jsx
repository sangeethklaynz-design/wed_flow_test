"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import InvitationPage from "@/components/invite/InvitationPage";
import InvitationVideoIntro, {
  INVITE_FRAME_H,
  INVITE_FRAME_W,
} from "@/components/invite/InvitationVideoIntro";
import InvitationSchedule from "@/components/invite/InvitationSchedule";
import InvitationThankYou from "@/components/invite/InvitationThankYou";
import InviteMobileScaler from "@/components/invite/InviteMobileScaler";

/**
 * Safe replacement for InvitationExperience.jsx.
 *
 * Flow for confirmed guests (after RSVP / revisit):
 *   video -> continuous scroll: schedule → thank you → full invitation
 *
 * Flow for first-time / unconfirmed guests:
 *   video -> full invitation (with live RSVP form)
 *   after RSVP submit -> continuous scroll: schedule → thank you → invitation
 */
export default function InvitationExperienceSafe({
  templateData,
  guestToken = null,
  interactive = false,
}) {
  const hasVideo = Boolean(
    templateData?.static?.video?.hasVideo && templateData?.static?.video?.url
  );

  const isGuestView = Boolean(guestToken);
  const scheduleEvents = templateData?.static?.scheduleEvents || [];
  const hasSchedule = scheduleEvents.length > 0;

  const [liveTemplateData, setLiveTemplateData] = useState(templateData);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    setLiveTemplateData(templateData);
  }, [templateData]);

  const hasSubmittedRsvp =
    Boolean(liveTemplateData?.guest?.rsvp?.hasSubmitted) || justSubmitted;

  // "video" | "invitation" | "postRsvp"
  const getInitialStep = () => {
    if (hasVideo) return "video";
    if (isGuestView && hasSubmittedRsvp) return "postRsvp";
    return "invitation";
  };

  const [step, setStep] = useState(getInitialStep);
  const [videoState, setVideoState] = useState(hasVideo ? "playing" : "done");
  const [templateVisible, setTemplateVisible] = useState(!hasVideo);
  const [guestCanSkip, setGuestCanSkip] = useState(false);

  const guestVideoSeenKey = useMemo(
    () => (guestToken ? `wedflow_invite_video_seen_${guestToken}` : null),
    [guestToken]
  );

  useEffect(() => {
    if (!hasVideo || !guestVideoSeenKey) return;
    if (typeof window === "undefined") return;

    const seenBefore =
      window.localStorage.getItem(guestVideoSeenKey) === "1";
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
    setVideoState("done");
    setTemplateVisible(true);
    if (isGuestView && hasSubmittedRsvp) {
      setStep("postRsvp");
    } else {
      setStep("invitation");
    }
  }, [isGuestView, hasSubmittedRsvp]);

  const handleRsvpSuccess = useCallback((rsvpPayload) => {
    setJustSubmitted(true);
    setLiveTemplateData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        guest: {
          ...(prev.guest || {}),
          rsvp: {
            ...(prev.guest?.rsvp || {}),
            hasSubmitted: true,
            attendingStatus: rsvpPayload?.attendingStatus || prev.guest?.rsvp?.attendingStatus,
            attendingCount:
              rsvpPayload?.attendingCount ?? prev.guest?.rsvp?.attendingCount,
            wishes: rsvpPayload?.wishes ?? prev.guest?.rsvp?.wishes,
          },
        },
      };
    });
    setStep("postRsvp");
    setVideoState("done");
    setTemplateVisible(true);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }, []);

  if (!liveTemplateData) return null;

  const isVideoActive = step === "video" && (videoState === "playing" || videoState === "fading");
  const showSkipButton = hasVideo && step === "video" && (!isGuestView || guestCanSkip);
  const showPostRsvpFlow = step === "postRsvp";

  // Continuous post-RSVP scroll: schedule → thank you → invitation
  if (showPostRsvpFlow) {
    return (
      <InviteMobileScaler className="md:mx-auto">
        <main
          className="relative overflow-hidden border-0 outline-none isolate card-shadow md:rounded-2xl"
          style={{ width: INVITE_FRAME_W, backgroundColor: "#FAF6F0" }}
        >
          <div className="relative w-[390px] flex flex-col">
            {hasSchedule ? (
              <InvitationSchedule events={scheduleEvents} guestToken={guestToken} />
            ) : null}
            <InvitationThankYou guestToken={guestToken} />
            <InvitationPage
              data={liveTemplateData}
              guestToken={guestToken}
              interactive={interactive}
              embedded
              onRsvpSuccess={handleRsvpSuccess}
            />
          </div>
        </main>
      </InviteMobileScaler>
    );
  }

  // Video or first-visit invitation
  return (
    <InviteMobileScaler
      mode={isVideoActive ? "cover" : "width"}
      fixedHeight={isVideoActive ? INVITE_FRAME_H : undefined}
      className="md:mx-auto"
    >
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
      <div
        className={
          isVideoActive
            ? "absolute inset-0 w-[390px] h-[844px] overflow-hidden"
            : "relative w-[390px]"
        }
      >
        {step === "invitation" ? (
          <div
            className={`w-full transition-opacity duration-700 ${
              templateVisible ? "opacity-100" : "opacity-0"
            } ${isVideoActive ? "pointer-events-none" : ""}`}
          >
            <InvitationPage
              data={liveTemplateData}
              guestToken={guestToken}
              interactive={interactive && !isVideoActive}
              embedded
              onRsvpSuccess={handleRsvpSuccess}
            />
          </div>
        ) : null}

        {isVideoActive ? (
          <InvitationVideoIntro
            videoUrl={liveTemplateData.static.video.url}
            onFadeStart={handleFadeStart}
            onComplete={handleVideoComplete}
            onSkip={handleVideoComplete}
            autoPlay
            showSkipButton={showSkipButton}
          />
        ) : null}
      </div>
    </main>
    </InviteMobileScaler>
  );
}
