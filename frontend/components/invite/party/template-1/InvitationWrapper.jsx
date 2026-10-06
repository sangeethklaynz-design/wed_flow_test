"use client";

/**
 * Party template-1 invitation experience (gala CSS pages).
 * Guest mode: scrollable pages + confirmation/payment overlays.
 * Admin preview: pass `previewPageId` for a single page.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  PARTY_PAGE_COMPONENTS,
  PARTY_PAGE_ORDER,
  PARTY_PAGE_HEIGHT,
  PARTY_PAGE_WIDTH,
} from "./pages";
import { computePartyPageHeight } from "@/lib/partyLayoutMetrics";
import { partyThemeVars } from "@/lib/partyPageStyles";
import InvitationVideoIntro, {
  INVITE_FRAME_H,
  INVITE_FRAME_W,
} from "@/components/invite/InvitationVideoIntro";
import InvitationBackgroundMusic from "@/components/invite/InvitationBackgroundMusic";
import InviteMobileScaler from "@/components/invite/InviteMobileScaler";
import InvitationPreviewBackButton from "@/components/invite/InvitationPreviewBackButton";
import RsvpChangeRequestPage from "./pages/RsvpChangeRequestPage";
import RsvpConfirmationPage from "./pages/RsvpConfirmationPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import styles from "./InvitationViewer.module.css";
import "./partyTokens.css";

function resolveFields(templateData, templateConfigProp) {
  const templateConfig =
    templateConfigProp ||
    templateData?.static?.templateConfig ||
    templateData?.templateConfig ||
    null;
  return {
    templateConfig,
    pagesCfg: templateConfig?.pages || {},
    fields: templateConfig?.fields || {},
  };
}

function isPageEnabled(pagesCfg, pageId) {
  return pagesCfg?.[pageId] !== false;
}

function resolveEventLocation(templateData) {
  const invitation = templateData?.static?.invitation || {};
  const event = templateData?.static?.event || {};
  return {
    locationName: event.location || invitation.hotelName || null,
    locationAddress:
      event.locationAddress || invitation.hotelAddress || null,
    googleMapsLink:
      event.googleMapsLink || invitation.googleMapsLink || null,
  };
}

function resolveEventMeta(templateData) {
  const invitation = templateData?.static?.invitation || {};
  const event = templateData?.static?.event || {};
  const wedding = templateData?.static?.wedding || {};
  const location = resolveEventLocation(templateData);
  return {
    eventName:
      event.name ||
      wedding.coupleNames ||
      invitation.eventName ||
      templateData?.static?.eventName ||
      null,
    eventDate:
      event.eventDate || wedding.weddingDate || wedding.formattedDate || null,
    eventTime: invitation.poruwaTime || invitation.eventTime || null,
    eventVenue: location.locationName,
    backgroundUrl: templateData?.static?.background?.url || null,
    videoUrl:
      templateData?.static?.video?.hasVideo && templateData?.static?.video?.url
        ? templateData.static.video.url
        : null,
    musicUrl:
      templateData?.static?.music?.hasMusic && templateData?.static?.music?.url
        ? templateData.static.music.url
        : null,
  };
}

function guestAlreadyRsvped(templateData) {
  const guest = templateData?.guest || templateData?.static?.guest || null;
  if (!guest) return false;
  const status = String(guest.rsvpStatus || guest.rsvp_status || "").toUpperCase();
  return Boolean(status && status !== "PENDING" && status !== "NONE");
}

/** Single party page for admin Template modal (grows with list content). */
export function PartyPagePreview({
  pageId,
  templateData = null,
  templateConfig = null,
  interactive = false,
  onRsvpSuccess = null,
  previewBypassValidation = false,
}) {
  const { fields } = resolveFields(templateData, templateConfig);
  const location = resolveEventLocation(templateData);
  const meta = resolveEventMeta(templateData);
  const GROWING_PAGES = new Set([
    "schedule",
    "details",
    "about",
    "rsvp",
    "saveTheDate",
  ]);
  const pageHeight = computePartyPageHeight(pageId, fields);
  const Page = PARTY_PAGE_COMPONENTS[pageId];
  const isGrowing = GROWING_PAGES.has(pageId);

  if (!Page) {
    return (
      <div
        className="partyInviteRoot flex items-center justify-center bg-[#0a1a3a] text-sm text-white/70"
        style={{ width: PARTY_PAGE_WIDTH, height: PARTY_PAGE_HEIGHT }}
      >
        Unknown page: {pageId}
      </div>
    );
  }

  const frameProps = {
    className: "partyInviteRoot",
    style: {
      width: PARTY_PAGE_WIDTH,
      // Fixed abspos pages need an explicit height; growing pages expand with content.
      height: isGrowing ? "auto" : PARTY_PAGE_HEIGHT,
      minHeight: isGrowing ? pageHeight : PARTY_PAGE_HEIGHT,
      // Never clip bottom décor — let PreviewPane scroll instead.
      overflow: "visible",
      backgroundColor: pageId === "landing" ? "#060e1d" : undefined,
    },
  };

  if (pageId === "landing") {
    return (
      <div {...frameProps}>
        <Page
          fields={fields}
          onScrollNext={() => {}}
          contentScale={1}
          eventDate={meta.eventDate}
          eventTime={meta.eventTime}
          eventVenue={meta.eventVenue}
          backgroundUrl={meta.backgroundUrl}
        />
      </div>
    );
  }

  if (pageId === "rsvp") {
    return (
      <div {...frameProps}>
        <Page
          fields={fields}
          contentScale={1}
          previewBypassValidation={previewBypassValidation}
          guestToken={null}
          maxGuests={1}
          guest={null}
          onRsvpSuccess={
            interactive && typeof onRsvpSuccess === "function"
              ? onRsvpSuccess
              : () => {}
          }
        />
      </div>
    );
  }

  if (pageId === "location") {
    return (
      <div {...frameProps}>
        <Page
          fields={fields}
          contentScale={1}
          locationName={location.locationName}
          locationAddress={location.locationAddress}
          googleMapsLink={location.googleMapsLink}
        />
      </div>
    );
  }

  if (pageId === "saveTheDate") {
    return (
      <div {...frameProps}>
        <Page
          fields={fields}
          contentScale={1}
          eventDate={meta.eventDate}
          eventName={meta.eventName}
          eventVenue={meta.eventVenue}
          eventAddress={location.locationAddress}
        />
      </div>
    );
  }

  return (
    <div {...frameProps}>
      <Page fields={fields} contentScale={1} />
    </div>
  );
}

function PartyInvitationFull({
  templateData = null,
  templateConfig: templateConfigProp = null,
  embedded = false,
  interactive = true,
  guestToken = null,
  onRsvpSuccess: onRsvpSuccessProp = null,
  previewBypassValidation = false,
}) {
  const embeddedContainerRef = useRef(null);
  const [showRsvpConfirmation, setShowRsvpConfirmation] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [isInvitationRoute, setIsInvitationRoute] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/invitation")
    ) {
      setIsInvitationRoute(true);
    }
  }, []);

  const guest = templateData?.guest || templateData?.static?.guest || null;
  const initialRsvp = guest?.rsvp || null;
  const isInitiallyRsvped =
    guestAlreadyRsvped(templateData) || Boolean(initialRsvp?.hasSubmitted);

  const [hasSubmittedRsvp, setHasSubmittedRsvp] = useState(isInitiallyRsvped);
  const [rsvpData, setRsvpData] = useState(() => {
    if (!initialRsvp && !isInitiallyRsvped) return null;
    const isAttending =
      initialRsvp?.attendingStatus === "attending" ||
      String(guest?.rsvpStatus || guest?.rsvp_status || "").toUpperCase() === "CONFIRMED";
    return {
      attendance: isAttending ? "yes" : "no",
      attendingStatus: isAttending ? "confirmed" : "declined",
      attendingCount: initialRsvp?.attendingCount ?? (isAttending ? 1 : 0),
      guestCount: initialRsvp?.attendingCount ?? (isAttending ? 1 : 0),
      guests: initialRsvp?.attendingCount ?? (isAttending ? 1 : 0),
      wishes: initialRsvp?.wishes || "",
    };
  });
  const maxGuests = Number(guest?.maxGuests || guest?.invitedCount) || 1;
  const [isDownloadingSchedule, setIsDownloadingSchedule] = useState(false);

  const { pagesCfg, fields } = resolveFields(templateData, templateConfigProp);
  const location = resolveEventLocation(templateData);
  const meta = resolveEventMeta(templateData);
  const hasVideo = Boolean(meta.videoUrl);

  const [showIntroVideo, setShowIntroVideo] = useState(hasVideo);
  const [musicActive, setMusicActive] = useState(!hasVideo);

  useEffect(() => {
    setShowIntroVideo(hasVideo);
    setMusicActive(!hasVideo);
  }, [hasVideo, meta.videoUrl]);

  const visiblePages = PARTY_PAGE_ORDER.filter((id) =>
    isPageEnabled(pagesCfg, id)
  );

  const scrollToPage = (pageId) => {
    const el = document.querySelector(`[data-invite-page="${pageId}"]`);
    if (el) {
      if (embedded && embeddedContainerRef.current) {
        embeddedContainerRef.current.scrollTo({
          top: el.offsetTop,
          behavior: "smooth",
        });
      } else {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const scrollToFirst = () => {
    if (embedded && embeddedContainerRef.current) {
      embeddedContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRsvpSuccess = (data) => {
    setRsvpData(data || null);
    setHasSubmittedRsvp(true);
    if (typeof onRsvpSuccessProp === "function") {
      onRsvpSuccessProp(data);
      return;
    }
    if (!interactive) return;
    setShowRsvpConfirmation(true);
  };

  const handleDownloadSchedule = async () => {
    setIsDownloadingSchedule(true);
    try {
      if (guestToken) {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(
          `${apiUrl}/api/public/invite/${encodeURIComponent(guestToken)}/schedule/download`
        );
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "party-schedule.pdf";
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to download party schedule:", err);
    } finally {
      setIsDownloadingSchedule(false);
    }
  };

  const renderPage = (pageId) => {
    if (pageId === "rsvp" && hasSubmittedRsvp) {
      return (
        <RsvpChangeRequestPage
          key="rsvp-change"
          rsvpData={rsvpData}
          guestToken={guestToken || ""}
          contentScale={1}
        />
      );
    }

    const Page = PARTY_PAGE_COMPONENTS[pageId];
    if (!Page) return null;

    if (pageId === "landing") {
      return (
        <Page
          key={pageId}
          fields={fields}
          contentScale={1}
          eventDate={meta.eventDate}
          eventTime={meta.eventTime}
          eventVenue={meta.eventVenue}
          backgroundUrl={meta.backgroundUrl}
          onScrollNext={() => {
            const landingIdx = visiblePages.indexOf("landing");
            const next = landingIdx >= 0 && landingIdx < visiblePages.length - 1
              ? visiblePages[landingIdx + 1]
              : null;
            if (next) scrollToPage(next);
          }}
        />
      );
    }
    if (pageId === "rsvp") {
      return (
        <Page
          key={pageId}
          fields={fields}
          guest={guest}
          guestToken={guestToken}
          maxGuests={maxGuests}
          contentScale={1}
          previewBypassValidation={previewBypassValidation || !guestToken}
          onRsvpSuccess={interactive ? handleRsvpSuccess : () => {}}
          onScrollNext={() => {
            const rsvpIdx = visiblePages.indexOf("rsvp");
            const next =
              rsvpIdx >= 0 && rsvpIdx < visiblePages.length - 1
                ? visiblePages[rsvpIdx + 1]
                : null;
            if (next) scrollToPage(next);
          }}
        />
      );
    }
    if (pageId === "schedule") {
      return (
        <Page
          key={pageId}
          fields={fields}
          contentScale={1}
          guestToken={guestToken}
          onSaveSchedule={handleDownloadSchedule}
          isDownloadingPdf={isDownloadingSchedule}
        />
      );
    }
    if (pageId === "location") {
      return (
        <Page
          key={pageId}
          fields={fields}
          contentScale={1}
          locationName={location.locationName}
          locationAddress={location.locationAddress}
          googleMapsLink={location.googleMapsLink}
        />
      );
    }
    if (pageId === "saveTheDate") {
      return (
        <Page
          key={pageId}
          fields={fields}
          contentScale={1}
          eventDate={meta.eventDate}
          eventName={meta.eventName}
          eventVenue={meta.eventVenue}
          eventAddress={location.locationAddress}
        />
      );
    }
    return (
      <Page key={pageId} fields={fields} contentScale={1} />
    );
  };

  if (embedded) {
    return (
      <div
        ref={embeddedContainerRef}
        className="relative overflow-y-auto partyInviteRoot scrollbar-none"
        style={{
          width: 390,
          height: 844,
          borderRadius: 26,
          backgroundColor: "#060e1d",
          ...partyThemeVars(fields),
        }}
        aria-label="Party invitation"
      >
        {meta.musicUrl ? (
          <InvitationBackgroundMusic
            musicUrl={meta.musicUrl}
            active={musicActive && !showIntroVideo}
            showMuteButton
            usePortal={false}
          />
        ) : null}
        {showIntroVideo && meta.videoUrl ? (
          <InvitationVideoIntro
            key={meta.videoUrl}
            videoUrl={meta.videoUrl}
            autoPlay
            showSkipButton
            onFadeStart={() => {}}
            onComplete={() => {
              setShowIntroVideo(false);
              setMusicActive(true);
            }}
            onSkip={() => {
              setShowIntroVideo(false);
              setMusicActive(true);
            }}
          />
        ) : showPaymentSuccess ? (
          <PaymentSuccessPage
            contentScale={1}
            onAddToCalendar={() => {
              setShowPaymentSuccess(false);
              setShowRsvpConfirmation(false);
              setTimeout(() => scrollToPage("saveTheDate"), 120);
            }}
            onBackToInvite={() => {
              setShowPaymentSuccess(false);
              setShowRsvpConfirmation(false);
              scrollToFirst();
            }}
          />
        ) : showRsvpConfirmation ? (
          <RsvpConfirmationPage
            contentScale={1}
            canAttend={
              rsvpData?.attendance !== "no" &&
              rsvpData?.attendingStatus !== "declined"
            }
            rsvpData={rsvpData}
            onBackToInvite={() => setShowRsvpConfirmation(false)}
            onProceedToPayment={() => {
              if (
                rsvpData?.attendance === "no" ||
                rsvpData?.attendingStatus === "declined"
              )
                return;
              setShowPaymentSuccess(true);
            }}
            onSaveSchedule={handleDownloadSchedule}
            isDownloadingPdf={isDownloadingSchedule}
          />
        ) : (
          <div className="relative w-[390px] flex flex-col">
            {visiblePages.map((pageId) => renderPage(pageId))}
          </div>
        )}
      </div>
    );
  }

  const isVideoActive = showIntroVideo && Boolean(meta.videoUrl);

  return (
    <div
      className="relative w-full flex flex-col items-center justify-center mx-auto partyInviteRoot"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        margin: "0 auto",
      }}
    >
      {!guestToken && !embedded ? (
        <InvitationPreviewBackButton href="/invite" label="Back to invite" guestToken={guestToken} />
      ) : null}

      <InvitationBackgroundMusic
        musicUrl={meta.musicUrl || "/assets/couple_music/dinelkadishmi/dinelkadishmi_music.mp3"}
        active={musicActive && !isVideoActive}
        showMuteButton
        usePortal
      />

      <InviteMobileScaler
        mode={isVideoActive ? "cover" : "width"}
        fixedHeight={isVideoActive ? INVITE_FRAME_H : undefined}
        className="w-full flex justify-center items-center mx-auto"
      >
        <main
          className={`relative mx-auto overflow-hidden border-0 outline-none isolate ${
            isVideoActive ? "" : "card-shadow md:rounded-2xl"
          }`}
          style={{
            width: INVITE_FRAME_W,
            maxWidth: INVITE_FRAME_W,
            height: isVideoActive ? INVITE_FRAME_H : undefined,
            backgroundColor: "#060e1d",
            margin: "0 auto",
            display: "block",
          }}
          aria-label="Party invitation"
        >
          {isVideoActive ? (
            <div className="absolute inset-0 w-[390px] h-[844px] overflow-hidden mx-auto">
              <InvitationVideoIntro
                key={meta.videoUrl}
                videoUrl={meta.videoUrl}
                autoPlay
                showSkipButton
                onFadeStart={() => {}}
                onComplete={() => {
                  setShowIntroVideo(false);
                  setMusicActive(true);
                }}
                onSkip={() => {
                  setShowIntroVideo(false);
                  setMusicActive(true);
                }}
              />
            </div>
          ) : showPaymentSuccess ? (
            <div className="relative w-[390px] min-h-[844px] mx-auto" style={{ margin: "0 auto" }}>
              <PaymentSuccessPage
                contentScale={1}
                onAddToCalendar={() => {
                  setShowPaymentSuccess(false);
                  setShowRsvpConfirmation(false);
                  setTimeout(() => scrollToPage("saveTheDate"), 120);
                }}
                onBackToInvite={() => {
                  setShowPaymentSuccess(false);
                  setShowRsvpConfirmation(false);
                  scrollToFirst();
                }}
              />
            </div>
          ) : showRsvpConfirmation ? (
            <div className="relative w-[390px] min-h-[844px] mx-auto" style={{ margin: "0 auto" }}>
              <RsvpConfirmationPage
                contentScale={1}
                canAttend={
                  rsvpData?.attendance !== "no" &&
                  rsvpData?.attendingStatus !== "declined"
                }
                rsvpData={rsvpData}
                onBackToInvite={() => setShowRsvpConfirmation(false)}
                onProceedToPayment={() => {
                  if (
                    rsvpData?.attendance === "no" ||
                    rsvpData?.attendingStatus === "declined"
                  )
                    return;
                  setShowPaymentSuccess(true);
                }}
                onSaveSchedule={handleDownloadSchedule}
                isDownloadingPdf={isDownloadingSchedule}
              />
            </div>
          ) : (
            <div
              className="relative w-[390px] flex flex-col mx-auto"
              style={{ ...partyThemeVars(fields), margin: "0 auto" }}
            >
              {visiblePages.map((pageId) => renderPage(pageId))}
            </div>
          )}
        </main>
      </InviteMobileScaler>
    </div>
  );
}

export default function PartyInvitationExperience({
  templateData = null,
  templateConfig = null,
  embedded = false,
  interactive = true,
  previewPageId = null,
  guestToken = null,
  onRsvpSuccess = null,
  previewBypassValidation = false,
}) {
  if (previewPageId) {
    return (
      <PartyPagePreview
        pageId={previewPageId}
        templateData={templateData}
        templateConfig={templateConfig}
        interactive={interactive}
        onRsvpSuccess={onRsvpSuccess}
        previewBypassValidation={previewBypassValidation}
      />
    );
  }

  return (
    <PartyInvitationFull
      templateData={templateData}
      templateConfig={templateConfig}
      embedded={embedded}
      interactive={interactive}
      guestToken={guestToken}
      onRsvpSuccess={onRsvpSuccess}
      previewBypassValidation={previewBypassValidation}
    />
  );
}

export const InvitationWrapper = PartyInvitationExperience;
