"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import InvitationPage from "@/components/invite/InvitationPage";
import InvitationVideoIntro, {
  INVITE_FRAME_H,
  INVITE_FRAME_W,
} from "@/components/invite/InvitationVideoIntro";
import InvitationSchedule from "@/components/invite/InvitationSchedule";
import InvitationThankYou from "@/components/invite/InvitationThankYou";

/**
 * Safe replacement for InvitationExperience.jsx.
 *
 * Flow for confirmed guests (revisit after RSVP):
 *   video -> schedule -> thank you -> full invitation
 *
 * Flow for first-time / unconfirmed guests:
 *   video -> full invitation (with live RSVP form)
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
  const hasSubmittedRsvp = Boolean(templateData?.guest?.rsvp?.hasSubmitted);
  const scheduleEvents = templateData?.static?.scheduleEvents || [];
  const hasSchedule = scheduleEvents.length > 0;

  // Possible steps for confirmed guests: "video" | "schedule" | "thankyou" | "invitation"
  // For unconfirmed: "video" | "invitation"
  const getInitialStep = () => {
    if (!hasVideo) {
      if (isGuestView && hasSubmittedRsvp && hasSchedule) return "schedule";
      if (isGuestView && hasSubmittedRsvp) return "thankyou";
      return "invitation";
    }
    return "video";
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
    // After video, decide next step
    if (isGuestView && hasSubmittedRsvp && hasSchedule) {
      setStep("schedule");
    } else if (isGuestView && hasSubmittedRsvp) {
      setStep("thankyou");
    } else {
      setStep("invitation");
    }
  }, [isGuestView, hasSubmittedRsvp, hasSchedule]);

  const handleScheduleContinue = useCallback(() => {
    setStep("thankyou");
  }, []);

  const handleThankYouContinue = useCallback(() => {
    setStep("invitation");
  }, []);

  if (!templateData) return null;

  const isVideoActive = step === "video" && (videoState === "playing" || videoState === "fading");
  const showSkipButton = hasVideo && step === "video" && (!isGuestView || guestCanSkip);

  // Schedule step
  if (step === "schedule") {
    return (
      <main
        className="relative overflow-hidden border-0 outline-none isolate card-shadow md:rounded-2xl"
        style={{ width: INVITE_FRAME_W, backgroundColor: "#FAF6F0" }}
      >
        <InvitationSchedule
          events={scheduleEvents}
          onContinue={handleScheduleContinue}
        />
      </main>
    );
  }

  // Thank you step
  if (step === "thankyou") {
    return (
      <main
        className="relative overflow-hidden border-0 outline-none isolate card-shadow md:rounded-2xl"
        style={{ width: INVITE_FRAME_W, backgroundColor: "#FAF6F0" }}
      >
        <InvitationThankYou
          guestToken={guestToken}
          onContinue={handleThankYouContinue}
        />
      </main>
    );
  }

  // Video or invitation step
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
            onSkip={handleVideoComplete}
            autoPlay
            showSkipButton={showSkipButton}
          />
        ) : null}
      </div>
    </main>
  );
}
