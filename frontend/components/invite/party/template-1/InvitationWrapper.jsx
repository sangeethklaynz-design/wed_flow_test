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
import { generatePartySchedulePdf } from "./pages/SchedulePage";
import { TicketingSelectionPage } from "@/components/invite/common/TicketingSelectionPage";
import { TicketingPaymentOverlay } from "@/components/invite/common/TicketingPaymentOverlay";
import { PaymentSuccessOverlay } from "@/components/invite/corporate/template-1/overlays/PaymentSuccessOverlay";
import { TicketQrOverlay } from "@/components/invite/corporate/template-1/overlays/TicketQrOverlay";
import { TicketSelectionView } from "@/components/invite/common/TicketSelectionView";
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
    const isTicketing = Boolean(
      templateData?.isTicketingEnabled ||
      templateData?.static?.isTicketingEnabled ||
      templateData?.templateConfig?.isTicketingEnabled ||
      templateConfig?.isTicketingEnabled ||
      pagesCfg?.isTicketingEnabled ||
      templateData?.event?.enableTicketing ||
      templateData?.static?.event?.enableTicketing ||
      templateData?.event?.isTicketingEnabled ||
      templateData?.static?.event?.isTicketingEnabled
    );

    if (isTicketing) {
      const ticketTypes =
        templateData?.ticketTypes ||
        templateData?.static?.ticketTypes ||
        templateData?.event?.tickets ||
        templateData?.static?.event?.tickets ||
        [];
      return (
        <div {...frameProps} style={{ ...frameProps.style, backgroundColor: "#FFFFFF" }}>
          <TicketingSelectionPage
            ticketTypes={ticketTypes}
            theme="party"
            onProceedToPayment={() => {}}
            onScrollNext={() => {}}
          />
        </div>
      );
    }

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
  const [isTicketingPaymentOpen, setIsTicketingPaymentOpen] = useState(false);
  const [ticketingBookingData, setTicketingBookingData] = useState(null);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem("wedflow_purchased_tickets") ||
        sessionStorage.getItem("wedflow_purchased_tickets");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.selectedTickets || parsed.individualTickets)) {
          setTicketingBookingData(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
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
    const wishesStr = initialRsvp?.wishes || "";
    const mealMatch = wishesStr.match(/Meal[^:]*:\s*([^\n\r]+)/i);
    const reqMatch = wishesStr.match(/Special Requirement[^:]*:\s*([^\n\r]+)/i);
    return {
      attendance: isAttending ? "yes" : "no",
      attendingStatus: isAttending ? "confirmed" : "declined",
      attendingCount: initialRsvp?.attendingCount ?? (isAttending ? 1 : 0),
      guestCount: initialRsvp?.attendingCount ?? (isAttending ? 1 : 0),
      guests: initialRsvp?.attendingCount ?? (isAttending ? 1 : 0),
      mealPreference:
        initialRsvp?.mealPreference ||
        initialRsvp?.meal ||
        (mealMatch ? mealMatch[1].trim() : "") ||
        guest?.mealPreference ||
        "",
      specialRequirements:
        initialRsvp?.specialRequirements ||
        initialRsvp?.requirements ||
        (reqMatch ? reqMatch[1].trim() : "") ||
        guest?.specialRequirements ||
        "",
      wishes: wishesStr,
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

  useEffect(() => {
    const handleHash = () => {
      if (typeof window === "undefined") return;
      const h = window.location.hash;
      if (h === "#ticket" || h === "#tickets" || h === "#ticket-qr") {
        setShowPaymentSuccess(false);
        setIsTicketingPaymentOpen(false);
        setIsTicketOpen(true);
        window.scrollTo({ top: 0, behavior: "instant" });
        if (embeddedContainerRef.current) {
          embeddedContainerRef.current.scrollTo({ top: 0, behavior: "instant" });
        }
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const visiblePages = PARTY_PAGE_ORDER.filter((id) =>
    isPageEnabled(pagesCfg, id)
  );

  const scrollToPage = (pageId) => {
    const el =
      document.querySelector(`[data-invite-page="${pageId}"]`) ||
      (pageId === "rsvp" ? document.getElementById("page-3") : null);
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

  const paymentLink = String(
    templateData?.static?.event?.paymentLink ||
      templateData?.event?.paymentLink ||
      ""
  ).trim();

  const handleProceedToTicketingPayment = (data) => {
    const bookingRef = "LN2026-0001";
    const booking = {
      ...data,
      bookingRef,
      ticketsSummary: data.selectedTickets
        .map((t) => `${t.quantity} x ${t.name} (LKR ${Number(t.price).toLocaleString("en-US")})`)
        .join(", "),
      individualTickets: data.selectedTickets.flatMap((t, tIdx) =>
        Array.from({ length: t.quantity }, (_, qIdx) => ({
          id: `${bookingRef}-${tIdx * 10 + qIdx + 1}`,
          typeName: `${t.name} Ticket`,
          price: t.price,
        }))
      ),
    };
    setTicketingBookingData(booking);
    setShowRsvpConfirmation(false);
    setShowPaymentSuccess(false);
    setIsTicketOpen(false);
    setIsTicketingPaymentOpen(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const handleTicketingPaymentSuccess = () => {
    setIsTicketingPaymentOpen(false);
    setShowPaymentSuccess(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
      if (ticketingBookingData) {
        try {
          localStorage.setItem("wedflow_purchased_tickets", JSON.stringify(ticketingBookingData));
          sessionStorage.setItem("wedflow_purchased_tickets", JSON.stringify(ticketingBookingData));
        } catch (e) {
          console.warn("Could not store tickets", e);
        }
      }
    }
  };

  const handleCloseTicketingPayment = () => {
    setIsTicketingPaymentOpen(false);
    setShowPaymentSuccess(false);
    setIsTicketOpen(false);
    setTimeout(() => {
      scrollToPage("ticketing");
    }, 60);
  };

  const handleOpenTicket = () => {
    setShowPaymentSuccess(false);
    setIsTicketOpen(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
      try {
        window.history.replaceState(null, "", "#ticket");
      } catch (e) {}
    }
    if (embeddedContainerRef.current) {
      embeddedContainerRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const handleProceedToPayment = () => {
    setTicketingBookingData(null);
    if (paymentLink && typeof window !== "undefined") {
      window.open(paymentLink, "_blank", "noopener,noreferrer");
    }
    setShowRsvpConfirmation(false);
    setShowPaymentSuccess(true);
  };

  const handleRsvpSuccess = (data) => {
    setRsvpData(data || null);
    setTicketingBookingData(null);
    setHasSubmittedRsvp(true);
    if (typeof onRsvpSuccessProp === "function") {
      onRsvpSuccessProp(data);
    }
    if (!interactive) return;
    setShowPaymentSuccess(false);
    setShowRsvpConfirmation(true);
  };

  const handleBackToInvite = () => {
    setShowPaymentSuccess(false);
    setShowRsvpConfirmation(false);
    setHasSubmittedRsvp(true);
    setTimeout(() => {
      scrollToPage("rsvp");
    }, 60);
  };

  const handleBackFromTicketing = () => {
    setShowPaymentSuccess(false);
    setIsTicketingPaymentOpen(true);
    setIsTicketOpen(false);
  };

  const handleDownloadSchedule = async () => {
    setIsDownloadingSchedule(true);
    try {
      let blob = null;
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      if (guestToken) {
        const res = await fetch(
          `${apiUrl}/api/public/invite/${encodeURIComponent(guestToken)}/schedule/download`
        );
        if (res.ok) {
          blob = await res.blob();
        }
      } else {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;
        if (token) {
          const res = await fetch(`${apiUrl}/api/couple/schedule/download`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            blob = await res.blob();
          }
        }
      }

      if (!blob) {
        blob = generatePartySchedulePdf(fields, fields.scheduleItems || []);
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "party-schedule.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
    } catch (err) {
      console.error("Failed to download party schedule:", err);
    } finally {
      setIsDownloadingSchedule(false);
    }
  };

  const renderPage = (pageId) => {
    const isTicketing = Boolean(
      templateData?.isTicketingEnabled ||
      templateData?.static?.isTicketingEnabled ||
      templateData?.templateConfig?.isTicketingEnabled ||
      templateConfigProp?.isTicketingEnabled ||
      pagesCfg?.isTicketingEnabled ||
      templateData?.event?.enableTicketing ||
      templateData?.static?.event?.enableTicketing ||
      templateData?.event?.isTicketingEnabled ||
      templateData?.static?.event?.isTicketingEnabled
    );

    if (pageId === "rsvp" && hasSubmittedRsvp && !isTicketing) {
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
      if (isTicketing) {
        const ticketTypes =
          templateData?.ticketTypes ||
          templateData?.static?.ticketTypes ||
          templateData?.event?.tickets ||
          templateData?.static?.event?.tickets ||
          [];
        const isModalOpen = Boolean(
          isTicketOpen || showPaymentSuccess || isTicketingPaymentOpen || showRsvpConfirmation
        );
        return (
          <div
            key="ticket-selection"
            id="page-3"
            data-invite-page="rsvp"
            className="w-[390px] min-h-[844px] flex items-center justify-center relative overflow-hidden bg-transparent"
            style={{
              display: isModalOpen ? "none" : "flex",
            }}
          >
            <TicketingSelectionPage
              ticketTypes={ticketTypes}
              theme="party"
              defaultName={guest?.name || fields.guestName || "Kavindu Perera"}
              defaultEmail={guest?.email || fields.guestEmail || "kavindu@gmail.com"}
              onProceedToPayment={handleProceedToTicketingPayment}
              purchasedBookingData={ticketingBookingData}
              onViewPurchasedTickets={handleOpenTicket}
              hasPurchasedTickets={Boolean(ticketingBookingData?.individualTickets?.length || ticketingBookingData?.totalAmount)}
              onScrollNext={() => {
                const rsvpIdx = visiblePages.indexOf("rsvp");
                const next =
                  rsvpIdx >= 0 && rsvpIdx < visiblePages.length - 1
                    ? visiblePages[rsvpIdx + 1]
                    : null;
                if (next) scrollToPage(next);
              }}
            />
          </div>
        );
      }

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
    if (pageId === "ticketing") {
      const tickets = meta.tickets || templateData?.event?.tickets || templateData?.static?.event?.tickets || [];
      return (
        <Page
          key={pageId}
          fields={fields}
          contentScale={1}
          ticketTypes={tickets}
          defaultName={guest?.name || "Kavindu Perera"}
          defaultEmail={guest?.email || "kavindu@gmail.com"}
          onProceedToPayment={handleOpenTicketingPayment}
          onScrollNext={handleExploreClick}
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
        className={`relative ${(isTicketOpen || showPaymentSuccess || isTicketingPaymentOpen || showRsvpConfirmation) ? "overflow-hidden" : "overflow-y-auto"} partyInviteRoot scrollbar-none`}
        style={{
          width: 390,
          height: 844,
          borderRadius: 26,
          backgroundColor: "#060e1d",
          overflow: (isTicketOpen || showPaymentSuccess || isTicketingPaymentOpen || showRsvpConfirmation) ? "hidden" : "auto",
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
        ) : showPaymentSuccess && !ticketingBookingData ? (
          <div className="relative w-[390px] h-[844px] min-h-[844px] mx-auto overflow-hidden">
            <PaymentSuccessPage
              contentScale={1}
              onAddToCalendar={() => {
                setShowPaymentSuccess(false);
                setShowRsvpConfirmation(false);
                setTimeout(() => scrollToPage("saveTheDate"), 120);
              }}
              onBackToInvite={handleBackToInvite}
            />
          </div>
        ) : showRsvpConfirmation ? (
          <div className="relative w-[390px] h-[844px] min-h-[844px] mx-auto overflow-hidden">
            <RsvpConfirmationPage
              contentScale={1}
              canAttend={
                rsvpData?.attendance !== "no" &&
                rsvpData?.attendingStatus !== "declined"
              }
              rsvpData={rsvpData}
              onBackToInvite={handleBackToInvite}
              onProceedToPayment={handleProceedToPayment}
            />
          </div>
        ) : (
          <div className="relative w-[390px] flex flex-col">
            {visiblePages.map((pageId) => renderPage(pageId))}
          </div>
        )}

        <TicketingPaymentOverlay
          isOpen={isTicketingPaymentOpen}
          onClose={handleCloseTicketingPayment}
          onBack={handleCloseTicketingPayment}
          onPaySuccess={handleTicketingPaymentSuccess}
          bookingData={ticketingBookingData || {}}
          theme="party"
          eventMeta={{
            eventName: meta.eventName || "Annual Gala Night 2026",
            eventDateTime: `${meta.eventDate || "Thu, 12 Nov 2026"} | ${meta.eventTime || "6:00 PM"}`,
            eventVenue: meta.eventVenue || "Cinnamon Lakeside Colombo",
          }}
        />

        {ticketingBookingData && (
          <>
            <PaymentSuccessOverlay
              isOpen={showPaymentSuccess}
              onClose={handleBackFromTicketing}
              onBackToRsvp={handleBackFromTicketing}
              onAddToCalendar={() => {
                setShowPaymentSuccess(false);
                setTimeout(() => scrollToPage("saveTheDate"), 120);
              }}
              onViewTicket={handleOpenTicket}
              bookingData={ticketingBookingData}
              theme="party"
            />
            <TicketQrOverlay
              isOpen={isTicketOpen}
              onClose={() => {
                setIsTicketOpen(false);
                setShowPaymentSuccess(true);
              }}
              onBackToPayment={() => {
                setIsTicketOpen(false);
                setShowPaymentSuccess(true);
              }}
              onAddToCalendar={() => {
                setIsTicketOpen(false);
                setTimeout(() => scrollToPage("saveTheDate"), 120);
              }}
              onScrollNext={() => {
                setIsTicketOpen(false);
                setTimeout(() => scrollToPage("landing"), 60);
              }}
              attendeeName={ticketingBookingData?.fullName || guest?.name || "Kavindu Perera"}
              ticketId={ticketingBookingData?.bookingRef || "LN2026-0001"}
              tickets={ticketingBookingData?.individualTickets || []}
              eventName={meta.eventName || "Annual Gala Night 2026"}
              eventDescription={fields.eventDescription || "An evening celebration, networking, & entertainment."}
              eventDate={meta.eventDate || "Thursday, 12 November 2026"}
              eventTime={meta.eventTime || "6.00 PM Onwards"}
              eventVenue={meta.eventVenue || "Cinnamon Lakeside Colombo"}
              theme="party"
            />
          </>
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
        mode={(isVideoActive || isTicketOpen || showPaymentSuccess || isTicketingPaymentOpen || showRsvpConfirmation) ? "cover" : "width"}
        fixedHeight={(isVideoActive || isTicketOpen || showPaymentSuccess || isTicketingPaymentOpen || showRsvpConfirmation) ? INVITE_FRAME_H : undefined}
        className="w-full flex justify-center items-center mx-auto"
      >
        <main
          className={`relative mx-auto overflow-hidden border-0 outline-none isolate ${
            isVideoActive ? "" : "card-shadow md:rounded-2xl"
          }`}
          style={{
            width: INVITE_FRAME_W,
            maxWidth: INVITE_FRAME_W,
            height: (isVideoActive || isTicketOpen || showPaymentSuccess || isTicketingPaymentOpen || showRsvpConfirmation) ? INVITE_FRAME_H : undefined,
            maxHeight: (isTicketOpen || showPaymentSuccess || isTicketingPaymentOpen || showRsvpConfirmation) ? INVITE_FRAME_H : undefined,
            overflow: (isTicketOpen || showPaymentSuccess || isTicketingPaymentOpen || showRsvpConfirmation) ? "hidden" : undefined,
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
          ) : showPaymentSuccess && !ticketingBookingData ? (
            <div className="relative w-[390px] h-[844px] min-h-[844px] mx-auto overflow-hidden" style={{ margin: "0 auto" }}>
              <PaymentSuccessPage
                contentScale={1}
                onAddToCalendar={() => {
                  setShowPaymentSuccess(false);
                  setShowRsvpConfirmation(false);
                  setTimeout(() => scrollToPage("saveTheDate"), 120);
                }}
                onBackToInvite={handleBackToInvite}
              />
            </div>
          ) : showRsvpConfirmation ? (
            <div className="relative w-[390px] h-[844px] min-h-[844px] mx-auto overflow-hidden" style={{ margin: "0 auto" }}>
              <RsvpConfirmationPage
                contentScale={1}
                canAttend={
                  rsvpData?.attendance !== "no" &&
                  rsvpData?.attendingStatus !== "declined"
                }
                rsvpData={rsvpData}
                onBackToInvite={handleBackToInvite}
                onProceedToPayment={handleProceedToPayment}
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

          <TicketingPaymentOverlay
            isOpen={isTicketingPaymentOpen}
            onClose={handleCloseTicketingPayment}
            onBack={handleCloseTicketingPayment}
            onPaySuccess={handleTicketingPaymentSuccess}
            bookingData={ticketingBookingData || {}}
            theme="party"
            eventMeta={{
              eventName: meta.eventName || "Annual Gala Night 2026",
              eventDateTime: `${meta.eventDate || "Thu, 12 Nov 2026"} | ${meta.eventTime || "6:00 PM"}`,
              eventVenue: meta.eventVenue || "Cinnamon Lakeside Colombo",
            }}
          />

          {ticketingBookingData && (
            <>
              <PaymentSuccessOverlay
                isOpen={showPaymentSuccess}
                onClose={handleBackFromTicketing}
                onBackToRsvp={handleBackFromTicketing}
                onAddToCalendar={() => {
                  setShowPaymentSuccess(false);
                  setTimeout(() => scrollToPage("saveTheDate"), 120);
                }}
                onViewTicket={handleOpenTicket}
                bookingData={ticketingBookingData}
                theme="party"
              />
              <TicketQrOverlay
                isOpen={isTicketOpen}
                onClose={() => {
                  setIsTicketOpen(false);
                  setShowPaymentSuccess(true);
                }}
                onBackToPayment={() => {
                  setIsTicketOpen(false);
                  setShowPaymentSuccess(true);
                }}
                onAddToCalendar={() => {
                  setIsTicketOpen(false);
                  setTimeout(() => scrollToPage("saveTheDate"), 120);
                }}
                onScrollNext={() => {
                  setIsTicketOpen(false);
                  setTimeout(() => scrollToPage("landing"), 60);
                }}
                attendeeName={ticketingBookingData?.fullName || guest?.name || "Kavindu Perera"}
                ticketId={ticketingBookingData?.bookingRef || "LN2026-0001"}
                tickets={ticketingBookingData?.individualTickets || []}
                eventName={meta.eventName || "Annual Gala Night 2026"}
                eventDescription={fields.eventDescription || "An evening celebration, networking, & entertainment."}
                eventDate={meta.eventDate || "Thursday, 12 November 2026"}
                eventTime={meta.eventTime || "6.00 PM Onwards"}
                eventVenue={meta.eventVenue || "Cinnamon Lakeside Colombo"}
                theme="party"
              />
            </>
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
