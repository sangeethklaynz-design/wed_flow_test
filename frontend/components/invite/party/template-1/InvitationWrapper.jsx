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
import {
  mapIssuedTicketsToUi,
  reserveTicketOrder,
} from "@/lib/ticketCheckout";
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
  const { pagesCfg, fields } = resolveFields(templateData, templateConfig);
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

  if (pageId === "ticketing") {
    return (
      <div {...frameProps} style={{ ...frameProps.style, backgroundColor: "#020A24", height: "auto", minHeight: 844 }}>
        <TicketQrOverlay
          isOpen={true}
          embedded={true}
          theme="party"
          fields={fields}
          eventName={fields?.ticketEventTitle || templateData?.event?.name || "Annual Gala Night 2026"}
          eventDescription={fields?.ticketSubtitle || templateData?.event?.subtitle || "CELEBRATION. ELEGANCE. MEMORIES"}
          eventDate={fields?.ticketDateLabel || templateData?.event?.eventDate || "12 November 2026"}
          eventTime={fields?.ticketTimeLabel || "6:00 PM Onwards"}
          eventVenue={fields?.ticketVenueName ? `${fields.ticketVenueName}, ${fields.ticketVenueCity || 'Colombo'}` : (templateData?.event?.location || "Colombo Grand Ballroom, Colombo")}
          attendeeName="Kavindu Perera"
          ticketId="LN2026-0001-1"
          paymentReference="LN2026-0001"
          bookingDateTime="21 Oct 2026, 03:14 PM"
          paymentMethod="Google Pay"
          tickets={[
            {
              id: "LN2026-0001-1",
              typeName: fields?.ticketCategory || "VIP",
              name: fields?.ticketCategory || "VIP",
              price: fields?.ticketPrice ? Number(String(fields.ticketPrice).replace(/[^0-9.]/g, "")) : 2000,
              quantity: 1,
              seatNo: fields?.ticketSeatLabel || "GENERAL ADMISSION",
              attendeeName: "Kavindu Perera",
            },
          ]}
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
  publicEventToken = null,
  onRsvpSuccess: onRsvpSuccessProp = null,
  previewBypassValidation = false,
}) {
  const embeddedContainerRef = useRef(null);
  const [showRsvpConfirmation, setShowRsvpConfirmation] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [isTicketingPaymentOpen, setIsTicketingPaymentOpen] = useState(false);
  const [isTicketingOpen, setIsTicketingOpen] = useState(false);
  const [ticketingBookingData, setTicketingBookingData] = useState(null);
  const [activeGuestToken, setActiveGuestToken] = useState(guestToken || null);

  useEffect(() => {
    setActiveGuestToken(guestToken || null);
  }, [guestToken]);

  useEffect(() => {
    try {
      const isRsvped = guestAlreadyRsvped(templateData) || Boolean(templateData?.guest?.rsvp?.hasSubmitted);
      if (!isRsvped) {
        localStorage.removeItem("wedflow_purchased_tickets");
        sessionStorage.removeItem("wedflow_purchased_tickets");
        setTicketingBookingData(null);
        return;
      }
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
  }, [templateData]);
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
  const [isEditingAttendee, setIsEditingAttendee] = useState(false);
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

  useEffect(() => {
    const isRsvped = guestAlreadyRsvped(templateData) || Boolean(templateData?.guest?.rsvp?.hasSubmitted);
    setHasSubmittedRsvp(isRsvped);
    if (!isRsvped) {
      setRsvpData(null);
      setTicketingBookingData(null);
      setShowRsvpConfirmation(false);
      setIsTicketingOpen(false);
      setIsTicketingPaymentOpen(false);
      setShowPaymentSuccess(false);
      setIsTicketOpen(false);
      try {
        localStorage.removeItem("wedflow_purchased_tickets");
        sessionStorage.removeItem("wedflow_purchased_tickets");
      } catch (e) {}
      if (typeof window !== "undefined") {
        const h = window.location.hash;
        if (h && (h === "#ticketing" || h === "#ticketing-payment" || h === "#payment-success" || h === "#ticket" || h === "#rsvp-confirmation")) {
          try {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          } catch (e) {}
        }
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }
  }, [templateData]);

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

  useEffect(() => {
    const handleHash = () => {
      if (typeof window === "undefined") return;
      const h = window.location.hash;
      if (h === "#ticketing") {
        if (isTicketing && hasSubmittedRsvp) {
          setShowPaymentSuccess(false);
          setIsTicketingPaymentOpen(false);
          setIsTicketOpen(false);
          setShowRsvpConfirmation(false);
          setIsTicketingOpen(true);
          window.scrollTo({ top: 0, behavior: "instant" });
        } else if (!hasSubmittedRsvp) {
          try {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          } catch (e) {}
          scrollToFirst();
        }
      } else if (h === "#ticketing-payment") {
        if (ticketingBookingData && hasSubmittedRsvp) {
          setShowPaymentSuccess(false);
          setIsTicketingOpen(false);
          setIsTicketOpen(false);
          setShowRsvpConfirmation(false);
          setIsTicketingPaymentOpen(true);
        } else if (!hasSubmittedRsvp) {
          try {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          } catch (e) {}
          scrollToFirst();
        }
      } else if (h === "#payment-success") {
        if (hasSubmittedRsvp) {
          setIsTicketingPaymentOpen(false);
          setIsTicketingOpen(false);
          setIsTicketOpen(false);
          setShowRsvpConfirmation(false);
          setShowPaymentSuccess(true);
          window.scrollTo({ top: 0, behavior: "instant" });
          if (embeddedContainerRef.current) {
            embeddedContainerRef.current.scrollTo({ top: 0, behavior: "instant" });
          }
        } else {
          try {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          } catch (e) {}
          scrollToFirst();
        }
      } else if (h === "#ticket" || h === "#tickets" || h === "#ticket-qr") {
        if (hasSubmittedRsvp) {
          setShowPaymentSuccess(false);
          setIsTicketingPaymentOpen(false);
          setIsTicketingOpen(false);
          setShowRsvpConfirmation(false);
          setIsTicketOpen(true);
          window.scrollTo({ top: 0, behavior: "instant" });
          if (embeddedContainerRef.current) {
            embeddedContainerRef.current.scrollTo({ top: 0, behavior: "instant" });
          }
        } else {
          try {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          } catch (e) {}
          scrollToFirst();
        }
      } else if (h === "#rsvp-confirmation" && hasSubmittedRsvp) {
        setShowPaymentSuccess(false);
        setIsTicketingPaymentOpen(false);
        setIsTicketingOpen(false);
        setIsTicketOpen(false);
        setShowRsvpConfirmation(true);
      } else if (h === "#rsvp" || h === "#page-3") {
        setShowPaymentSuccess(false);
        setIsTicketingPaymentOpen(false);
        setIsTicketingOpen(false);
        setShowRsvpConfirmation(false);
        setIsTicketOpen(false);
        scrollToPage("rsvp");
      } else if (h === "#page-1" || !h) {
        setShowPaymentSuccess(false);
        setIsTicketingPaymentOpen(false);
        setIsTicketingOpen(false);
        setShowRsvpConfirmation(false);
        setIsTicketOpen(false);
        scrollToFirst();
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [isTicketing, ticketingBookingData, hasSubmittedRsvp]);

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

  const handleProceedToTicketingPayment = async (data) => {
    const token =
      activeGuestToken ||
      guestToken ||
      templateData?.guestToken ||
      ticketingBookingData?.guestToken ||
      "";
    const fullName =
      data?.fullName ||
      rsvpData?.fullName ||
      guest?.name ||
      `${data?.firstName || ""} ${data?.lastName || ""}`.trim() ||
      "Guest";
    const bookingBase = {
      ...data,
      guestToken: token,
      firstName:
        data?.firstName ||
        rsvpData?.firstName ||
        (fullName ? fullName.split(" ")[0] : "Guest"),
      lastName:
        data?.lastName ||
        rsvpData?.lastName ||
        (fullName && fullName.split(" ").length > 1
          ? fullName.split(" ").slice(1).join(" ")
          : ""),
      fullName,
      email:
        data?.email ||
        rsvpData?.email ||
        rsvpData?.emailAddress ||
        guest?.email ||
        "",
      mobileNumber:
        data?.mobileNumber ||
        rsvpData?.mobileNumber ||
        rsvpData?.phone ||
        guest?.mobileNumber ||
        guest?.phone ||
        "",
      nic: data?.nic || rsvpData?.nic || "",
      ticketsSummary: (data.selectedTickets || [])
        .map(
          (t) =>
            `${t.quantity} x ${t.name} (LKR ${Number(t.price).toLocaleString("en-US")})`
        )
        .join(", "),
      individualTickets: [],
    };

    try {
      const reserved = await reserveTicketOrder({
        guestToken: token,
        selectedTickets: data.selectedTickets || [],
        buyerName: fullName,
        buyerContact: bookingBase.mobileNumber,
      });
      const booking = {
        ...bookingBase,
        orderId: reserved.orderId,
        expiresAt: reserved.expiresAt,
        totalAmount: reserved.amountTotal ?? data.totalAmount,
        bookingRef: reserved.orderId,
      };
      setTicketingBookingData(booking);
      setIsTicketingOpen(false);
      setShowRsvpConfirmation(false);
      setShowPaymentSuccess(false);
      setIsTicketOpen(false);
      setIsTicketingPaymentOpen(true);
      if (typeof window !== "undefined") {
        try {
          window.history.pushState(null, "", "#ticketing-payment");
          window.scrollTo({ top: 0, behavior: "instant" });
        } catch (e) {}
      }
    } catch (err) {
      console.error("Ticket reservation failed:", err);
      if (typeof window !== "undefined") {
        window.alert(err?.message || "Could not reserve tickets. Please try again.");
      }
    }
  };

  const handleUpdateTicketingBookingData = (updatedData) => {
    if (!updatedData) return;
    setTicketingBookingData((prev) => {
      const merged = { ...(prev || {}), ...updatedData };
      const attendeeName =
        merged.fullName ||
        `${merged.firstName || ""}`.trim() + (merged.lastName ? ` ${merged.lastName}` : "") ||
        "Kavindu Perera";
      if (Array.isArray(merged.individualTickets)) {
        merged.individualTickets = merged.individualTickets.map((t) => ({
          ...t,
          attendeeName,
          firstName: merged.firstName,
          lastName: merged.lastName,
          email: merged.email || merged.emailAddress,
          mobileNumber: merged.mobileNumber || merged.phone,
          nic: merged.nic || merged.nicNumber,
        }));
      }
      return merged;
    });
  };

  const handleTicketingPaymentSuccess = (payResult = {}) => {
    const guestName =
      payResult.guestName ||
      payResult.fullName ||
      ticketingBookingData?.fullName ||
      "Guest";
    const individualTickets = mapIssuedTicketsToUi(
      payResult.tickets || [],
      guestName
    );
    const nextBooking = {
      ...(ticketingBookingData || {}),
      ...payResult,
      fullName: guestName,
      guestName,
      orderId: payResult.orderId || ticketingBookingData?.orderId,
      bookingRef: payResult.orderId || ticketingBookingData?.bookingRef,
      individualTickets: individualTickets.length
        ? individualTickets
        : (ticketingBookingData?.individualTickets || []).map((t) => ({
            ...t,
            attendeeName: guestName,
            firstName: payResult.firstName || ticketingBookingData?.firstName,
            lastName: payResult.lastName || ticketingBookingData?.lastName,
            email: payResult.email || ticketingBookingData?.email,
            mobileNumber: payResult.mobileNumber || ticketingBookingData?.mobileNumber,
            nic: payResult.nic || ticketingBookingData?.nic,
          })),
      selectedTickets:
        payResult.selectedTickets || ticketingBookingData?.selectedTickets,
      totalAmount:
        payResult.order?.amountTotal ??
        payResult.amountTotal ??
        ticketingBookingData?.totalAmount,
    };
    setTicketingBookingData(nextBooking);
    setIsTicketingPaymentOpen(false);
    setShowPaymentSuccess(true);
    if (typeof window !== "undefined") {
      try {
        window.history.pushState(null, "", "#payment-success");
      } catch (e) {}
      window.scrollTo({ top: 0, behavior: "instant" });
      if (embeddedContainerRef.current) {
        embeddedContainerRef.current.scrollTo({ top: 0, behavior: "instant" });
      }
      try {
        localStorage.setItem(
          "wedflow_purchased_tickets",
          JSON.stringify(nextBooking)
        );
        sessionStorage.setItem(
          "wedflow_purchased_tickets",
          JSON.stringify(nextBooking)
        );
      } catch (e) {
        console.warn("Could not store tickets", e);
      }
    }
  };

  const handleCloseTicketingPayment = () => {
    setIsTicketingPaymentOpen(false);
    setShowPaymentSuccess(false);
    setIsTicketOpen(false);
    setIsTicketingOpen(true);
    if (typeof window !== "undefined") {
      try {
        window.history.pushState(null, "", "#ticketing");
      } catch (e) {}
    }
  };

  const handleCloseTicketingSelection = () => {
    setIsTicketingOpen(false);
    scrollToFirst();
  };

  const handleBackFromTicketingSelection = () => {
    setIsTicketingOpen(false);
    if (typeof window !== "undefined") {
      try {
        window.history.pushState(null, "", "#rsvp");
      } catch (e) {}
    }
    setTimeout(() => {
      scrollToPage("rsvp");
    }, 50);
  };

  const handleEditAttendeeFromPayment = () => {
    setIsTicketingPaymentOpen(false);
    setIsTicketingOpen(false);
    setShowPaymentSuccess(false);
    setIsTicketOpen(false);
    setIsEditingAttendee(true);
    if (typeof window !== "undefined") {
      try {
        window.history.pushState(null, "", "#rsvp");
      } catch (e) {}
    }
    setTimeout(() => {
      scrollToPage("rsvp");
    }, 60);
  };

  const handleOpenTicketingSelection = () => {
    setShowPaymentSuccess(false);
    setShowRsvpConfirmation(false);
    setIsTicketOpen(false);
    setIsTicketingPaymentOpen(false);
    setIsTicketingOpen(true);
    if (typeof window !== "undefined") {
      try {
        window.history.pushState(null, "", "#ticketing");
        window.scrollTo({ top: 0, behavior: "instant" });
      } catch (e) {}
    }
    if (embeddedContainerRef.current) {
      embeddedContainerRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const handleOpenTicket = () => {
    const tickets = ticketingBookingData?.individualTickets || [];
    if (!tickets.length) return;
    setShowPaymentSuccess(false);
    setIsTicketingOpen(false);
    setIsTicketingPaymentOpen(false);
    setShowRsvpConfirmation(false);
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
    const issuedToken =
      data?.guestToken ||
      data?.uniqueToken ||
      data?.guest?.uniqueToken ||
      null;
    if (issuedToken) {
      setActiveGuestToken(issuedToken);
    }
    setIsEditingAttendee(false);
    if (typeof onRsvpSuccessProp === "function") {
      onRsvpSuccessProp(data);
    }
    if (!interactive) return;

    const attending =
      String(data?.attendingStatus || data?.status || "").toLowerCase() ===
        "attending" ||
      String(data?.attendingStatus || "").toLowerCase() === "confirmed" ||
      data?.attending === true ||
      (data?.attendance || "yes").toLowerCase() !== "no";
    const declined =
      String(data?.attendingStatus || data?.status || "").toLowerCase() ===
        "declined" ||
      data?.attending === false ||
      (data?.attendance || "").toLowerCase() === "no";

    if (isTicketing && attending && !declined) {
      setShowPaymentSuccess(false);
      setShowRsvpConfirmation(false);
      setIsTicketOpen(false);
      setIsTicketingPaymentOpen(false);
      setIsTicketingOpen(true);
      if (typeof window !== "undefined") {
        try {
          window.history.pushState(null, "", "#ticketing");
          window.scrollTo({ top: 0, behavior: "instant" });
        } catch (e) {}
      }
      if (embeddedContainerRef.current) {
        embeddedContainerRef.current.scrollTo({ top: 0, behavior: "instant" });
      }
    } else {
      setShowPaymentSuccess(false);
      setShowRsvpConfirmation(true);
    }
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
    if (typeof window !== "undefined") {
      try {
        window.history.pushState(null, "", "#ticketing-payment");
      } catch (e) {}
    }
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

    if (pageId === "rsvp" && hasSubmittedRsvp && !isEditingAttendee) {
      return (
        <RsvpChangeRequestPage
          key="rsvp-change"
          rsvpData={rsvpData}
          guestToken={guestToken || ""}
          contentScale={1}
          isTicketing={isTicketing}
          hasPurchasedTickets={Boolean(ticketingBookingData?.individualTickets?.length || ticketingBookingData?.totalAmount)}
          purchasedBookingData={ticketingBookingData}
          onViewPurchasedTickets={handleOpenTicket}
          onPurchaseMoreTickets={handleOpenTicketingSelection}
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
          rsvpData={rsvpData}
          initialValues={rsvpData}
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

        {isTicketingOpen ? (
          <div
            id="ticketing-selection-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Ticketing Selection"
            className="absolute top-0 left-0 w-[390px] h-[844px] overflow-y-auto z-[99] bg-white select-none animate-in fade-in duration-200"
            style={{
              width: 390,
              height: 844,
              maxHeight: 844,
            }}
          >
            <TicketingSelectionPage
              fields={fields}
              ticketTypes={
                fields?.ticketTypes ||
                meta.tickets ||
                templateData?.ticketTypes ||
                templateData?.static?.ticketTypes ||
                templateData?.event?.tickets ||
                templateData?.static?.event?.tickets ||
                []
              }
              theme="party"
              defaultName={rsvpData?.fullName || guest?.name || fields.guestName || "Kavindu Perera"}
              defaultEmail={rsvpData?.email || rsvpData?.emailAddress || guest?.email || fields.guestEmail || "kavindu@gmail.com"}
              onProceedToPayment={handleProceedToTicketingPayment}
              onScrollNext={handleCloseTicketingSelection}
              onBack={handleBackFromTicketingSelection}
              purchasedBookingData={ticketingBookingData}
              onViewPurchasedTickets={handleOpenTicket}
              hasPurchasedTickets={Boolean(ticketingBookingData?.individualTickets?.length || ticketingBookingData?.totalAmount)}
            />
          </div>
        ) : null}

        <TicketingPaymentOverlay
          isOpen={isTicketingPaymentOpen}
          onClose={handleCloseTicketingPayment}
          onBack={handleCloseTicketingPayment}
          onEditAttendee={handleEditAttendeeFromPayment}
          onPaySuccess={handleTicketingPaymentSuccess}
          onUpdateBookingData={handleUpdateTicketingBookingData}
          bookingData={ticketingBookingData || {}}
          guestToken={
            activeGuestToken ||
            guestToken ||
            ticketingBookingData?.guestToken ||
            ""
          }
          orderId={ticketingBookingData?.orderId || ""}
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
              eventMeta={{
                eventName: meta.eventName || fields.ticketEventTitle || "Auto Test Event 10",
                eventSubtitle: fields.ticketSubtitle || fields.eventDescription || meta.eventDescription,
                eventDate: fields.ticketDateLabel || meta.eventDate,
                eventTime: fields.ticketTimeLabel || meta.eventTime,
                venueName: fields.ticketVenueName || location.locationName || meta.eventVenue,
                venueCity: fields.ticketVenueCity || "Colombo",
              }}
            />
            <TicketQrOverlay
              isOpen={isTicketOpen}
              onClose={() => {
                setIsTicketOpen(false);
                setShowPaymentSuccess(true);
                if (typeof window !== "undefined") {
                  try {
                    window.history.pushState(null, "", "#payment-success");
                  } catch (e) {}
                }
              }}
              onBackToPayment={() => {
                setIsTicketOpen(false);
                setShowPaymentSuccess(true);
                if (typeof window !== "undefined") {
                  try {
                    window.history.pushState(null, "", "#payment-success");
                  } catch (e) {}
                }
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
              ticketId={
                ticketingBookingData?.individualTickets?.[0]?.ticketCode ||
                ticketingBookingData?.orderId ||
                ticketingBookingData?.bookingRef ||
                ""
              }
              tickets={ticketingBookingData?.individualTickets || []}
              eventName={meta.eventName || "Annual Gala Night 2026"}
              eventDescription={fields.eventDescription || "An evening celebration, networking, & entertainment."}
              eventDate={meta.eventDate || "Thursday, 12 November 2026"}
              eventTime={meta.eventTime || "6.00 PM Onwards"}
              eventVenue={meta.eventVenue || "Cinnamon Lakeside Colombo"}
              bookingData={ticketingBookingData}
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
        mode={(isVideoActive || isTicketOpen || showPaymentSuccess || isTicketingPaymentOpen || showRsvpConfirmation || isTicketingOpen) ? "cover" : "width"}
        fixedHeight={(isVideoActive || isTicketOpen || showPaymentSuccess || isTicketingPaymentOpen || showRsvpConfirmation || isTicketingOpen) ? INVITE_FRAME_H : undefined}
        className="w-full flex justify-center items-center mx-auto"
      >
        <main
          className={`relative mx-auto overflow-hidden border-0 outline-none isolate ${
            isVideoActive ? "" : "card-shadow md:rounded-2xl"
          }`}
          style={{
            width: INVITE_FRAME_W,
            maxWidth: INVITE_FRAME_W,
            height: (isVideoActive || isTicketOpen || showPaymentSuccess || isTicketingPaymentOpen || showRsvpConfirmation || isTicketingOpen) ? INVITE_FRAME_H : undefined,
            maxHeight: (isTicketOpen || showPaymentSuccess || isTicketingPaymentOpen || showRsvpConfirmation || isTicketingOpen) ? INVITE_FRAME_H : undefined,
            overflow: (isTicketOpen || showPaymentSuccess || isTicketingPaymentOpen || showRsvpConfirmation || isTicketingOpen) ? "hidden" : undefined,
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

          {isTicketingOpen ? (
            <div
              id="ticketing-selection-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="Ticketing Selection"
              className="absolute top-0 left-0 w-[390px] h-[844px] overflow-y-auto z-[99] bg-white select-none animate-in fade-in duration-200"
              style={{
                width: 390,
                height: 844,
                maxHeight: 844,
              }}
            >
              <TicketingSelectionPage
                fields={fields}
                ticketTypes={
                  fields?.ticketTypes ||
                  meta.tickets ||
                  templateData?.ticketTypes ||
                  templateData?.static?.ticketTypes ||
                  templateData?.event?.tickets ||
                  templateData?.static?.event?.tickets ||
                  []
                }
                theme="party"
                defaultName={rsvpData?.fullName || guest?.name || fields.guestName || "Kavindu Perera"}
                defaultEmail={rsvpData?.email || rsvpData?.emailAddress || guest?.email || fields.guestEmail || "kavindu@gmail.com"}
                onProceedToPayment={handleProceedToTicketingPayment}
                onScrollNext={handleCloseTicketingSelection}
                onBack={handleBackFromTicketingSelection}
                purchasedBookingData={ticketingBookingData}
                onViewPurchasedTickets={handleOpenTicket}
                hasPurchasedTickets={Boolean(ticketingBookingData?.individualTickets?.length || ticketingBookingData?.totalAmount)}
              />
            </div>
          ) : null}

          <TicketingPaymentOverlay
            isOpen={isTicketingPaymentOpen}
            onClose={handleCloseTicketingPayment}
            onBack={handleCloseTicketingPayment}
            onEditAttendee={handleEditAttendeeFromPayment}
            onPaySuccess={handleTicketingPaymentSuccess}
            onUpdateBookingData={handleUpdateTicketingBookingData}
            bookingData={ticketingBookingData || {}}
            guestToken={
            activeGuestToken ||
            guestToken ||
            ticketingBookingData?.guestToken ||
            ""
          }
            orderId={ticketingBookingData?.orderId || ""}
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
                eventMeta={{
                  eventName: meta.eventName || fields.ticketEventTitle || "Auto Test Event 10",
                  eventSubtitle: fields.ticketSubtitle || fields.eventDescription || meta.eventDescription,
                  eventDate: fields.ticketDateLabel || meta.eventDate,
                  eventTime: fields.ticketTimeLabel || meta.eventTime,
                  venueName: fields.ticketVenueName || location.locationName || meta.eventVenue,
                  venueCity: fields.ticketVenueCity || "Colombo",
                }}
              />
              <TicketQrOverlay
                isOpen={isTicketOpen}
                onClose={() => {
                  setIsTicketOpen(false);
                  setShowPaymentSuccess(true);
                  if (typeof window !== "undefined") {
                    try {
                      window.history.pushState(null, "", "#payment-success");
                    } catch (e) {}
                  }
                }}
                onBackToPayment={() => {
                  setIsTicketOpen(false);
                  setShowPaymentSuccess(true);
                  if (typeof window !== "undefined") {
                    try {
                      window.history.pushState(null, "", "#payment-success");
                    } catch (e) {}
                  }
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
                ticketId={
                  ticketingBookingData?.individualTickets?.[0]?.ticketCode ||
                  ticketingBookingData?.orderId ||
                  ticketingBookingData?.bookingRef ||
                  ""
                }
                tickets={ticketingBookingData?.individualTickets || []}
                eventName={meta.eventName || "Annual Gala Night 2026"}
                eventDescription={fields.eventDescription || "An evening celebration, networking, & entertainment."}
                eventDate={meta.eventDate || "Thursday, 12 November 2026"}
                eventTime={meta.eventTime || "6.00 PM Onwards"}
                eventVenue={meta.eventVenue || "Cinnamon Lakeside Colombo"}
                bookingData={ticketingBookingData}
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
