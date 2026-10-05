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
import InvitationVideoIntro from "@/components/invite/InvitationVideoIntro";
import InvitationBackgroundMusic from "@/components/invite/InvitationBackgroundMusic";
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
  const scrollViewportRef = useRef(null);
  const [showRsvpConfirmation, setShowRsvpConfirmation] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [hasSubmittedRsvp, setHasSubmittedRsvp] = useState(() =>
    guestAlreadyRsvped(templateData)
  );
  const [rsvpData, setRsvpData] = useState(null);
  const [dims, setDims] = useState({
    isMobile: false,
    cardWidth: 390,
    cardHeight: 844,
    contentScale: 1,
    borderRadius: 28,
    mounted: false,
  });

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

  useEffect(() => {
    if (embedded) {
      setDims({
        isMobile: false,
        cardWidth: 390,
        cardHeight: 844,
        contentScale: 1,
        borderRadius: 26,
        mounted: true,
      });
      return undefined;
    }

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = w <= 640;

      if (isMobile) {
        const contentScale = Math.min(w / 390, h / 844);
        setDims({
          isMobile: true,
          cardWidth: w,
          cardHeight: h,
          contentScale,
          borderRadius: 0,
          mounted: true,
        });
      } else {
        const scale = Math.min(1, (h - 44) / 844, (w - 44) / 390);
        setDims({
          isMobile: false,
          cardWidth: Math.round(390 * scale),
          cardHeight: Math.round(844 * scale),
          contentScale: scale,
          borderRadius: Math.round(28 * scale),
          mounted: true,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [embedded]);

  const scrollToPage = (pageId) => {
    const el = document.querySelector(`[data-invite-page="${pageId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToFirst = () => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({ top: 0, behavior: "smooth" });
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

  const renderPage = (pageId) => {
    if (pageId === "rsvp" && hasSubmittedRsvp) {
      return (
        <RsvpChangeRequestPage
          key="rsvp-change"
          rsvpData={rsvpData}
          guestToken={guestToken || ""}
          contentScale={dims.contentScale}
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
          contentScale={dims.contentScale}
          eventDate={meta.eventDate}
          eventTime={meta.eventTime}
          eventVenue={meta.eventVenue}
          backgroundUrl={meta.backgroundUrl}
          onScrollNext={() => {
            const next = visiblePages.find((id) => id !== "landing");
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
          contentScale={dims.contentScale}
          previewBypassValidation={previewBypassValidation || !guestToken}
          onRsvpSuccess={interactive ? handleRsvpSuccess : () => {}}
        />
      );
    }
    if (pageId === "location") {
      return (
        <Page
          key={pageId}
          fields={fields}
          contentScale={dims.contentScale}
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
          contentScale={dims.contentScale}
          eventDate={meta.eventDate}
          eventName={meta.eventName}
          eventVenue={meta.eventVenue}
          eventAddress={location.locationAddress}
        />
      );
    }
    return (
      <Page key={pageId} fields={fields} contentScale={dims.contentScale} />
    );
  };

  if (!dims.mounted && !embedded) {
    return (
      <div
        className={styles.desktopShell}
        style={{ minHeight: "100dvh", background: "#0a1628" }}
      />
    );
  }

  const shellClass = embedded
    ? "relative flex items-center justify-center"
    : dims.isMobile
      ? styles.mobileShell
      : styles.desktopShell;

  const frameClass = embedded
    ? undefined
    : dims.isMobile
      ? styles.mobileFrame
      : styles.deviceFrame;

  return (
    <div className={`${shellClass} partyInviteRoot`}>
      {meta.musicUrl ? (
        <InvitationBackgroundMusic
          musicUrl={meta.musicUrl}
          active={musicActive && !showIntroVideo}
          showMuteButton
          usePortal={!embedded}
        />
      ) : null}
      <main
        className={frameClass}
        style={
          !embedded && !dims.isMobile
            ? {
                width: `${dims.cardWidth}px`,
                height: `${dims.cardHeight}px`,
                borderRadius: `${dims.borderRadius}px`,
              }
            : embedded
              ? {
                  width: 390,
                  height: 844,
                  borderRadius: 26,
                  overflow: "hidden",
                  position: "relative",
                }
              : undefined
        }
        aria-label="Party invitation"
      >
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
            contentScale={dims.contentScale}
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
            contentScale={dims.contentScale}
            canAttend={rsvpData?.attendance !== "no"}
            rsvpData={rsvpData}
            onBackToInvite={() => setShowRsvpConfirmation(false)}
            onProceedToPayment={() => {
              if (rsvpData?.attendance === "no") return;
              setShowPaymentSuccess(true);
            }}
            onSaveSchedule={() => {}}
          />
        ) : (
          <div
            ref={scrollViewportRef}
            className={`${styles.scrollViewport} invitation-scroll-container`}
            id="invitation-scroll-viewport"
            style={{
              ...partyThemeVars(fields),
              ...(embedded
                ? { width: 390, height: 844, overflowY: "auto" }
                : {}),
            }}
          >
            {visiblePages.map((pageId) => renderPage(pageId))}
          </div>
        )}
      </main>
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
