'use client';

/**
 * Corporate template-1 invitation experience.
 *
 * Guest mode: 7 strict 390×844 snap pages (+ mocked payment/ticket overlays).
 * Admin preview: pass `previewPageId` to render exactly one page.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  CORPORATE_PAGE_COMPONENTS,
  CORPORATE_PAGE_ORDER,
  CORPORATE_PAGE_HEIGHT,
  CORPORATE_PAGE_WIDTH,
} from './pages';
import { computeCorporatePageHeight } from '@/lib/corporateLayoutMetrics';
import { corporateThemeVars } from '@/lib/corporatePageStyles';
import InvitationVideoIntro, {
  INVITE_FRAME_H,
  INVITE_FRAME_W,
} from '@/components/invite/InvitationVideoIntro';
import InvitationBackgroundMusic from '@/components/invite/InvitationBackgroundMusic';
import InviteMobileScaler from '@/components/invite/InviteMobileScaler';
import InvitationPreviewBackButton from '@/components/invite/InvitationPreviewBackButton';
import { RsvpConfirmationOverlay } from './overlays/RsvpConfirmationOverlay';
import { PaymentSuccessOverlay } from './overlays/PaymentSuccessOverlay';
import { TicketQrOverlay } from './overlays/TicketQrOverlay';
import { RsvpChangeRequestPage } from './pages/RsvpChangeRequestPage';
import { TicketingSelectionPage } from '@/components/invite/common/TicketingSelectionPage';
import { TicketingPaymentOverlay } from '@/components/invite/common/TicketingPaymentOverlay';
import { TicketSelectionView } from '@/components/invite/common/TicketSelectionView';

function guestAlreadyRsvped(templateData) {
  const guest = templateData?.guest || templateData?.static?.guest || null;
  if (!guest) return false;
  const status = String(guest.rsvpStatus || guest.rsvp_status || '').toUpperCase();
  return Boolean(status && status !== 'PENDING' && status !== 'NONE');
}

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
    locationName:
      event.location ||
      invitation.hotelName ||
      null,
    locationAddress:
      event.locationAddress ||
      invitation.hotelAddress ||
      null,
    googleMapsLink:
      event.googleMapsLink ||
      invitation.googleMapsLink ||
      null,
  };
}

function resolveEventMedia(templateData) {
  const musicUrl =
    templateData?.static?.music?.url ||
    templateData?.music?.url ||
    templateData?.musicUrl ||
    null;
  const hasMusic =
    templateData?.static?.music?.hasMusic !== undefined
      ? Boolean(templateData?.static?.music?.hasMusic && musicUrl)
      : Boolean(musicUrl);

  const videoUrl =
    templateData?.static?.video?.url ||
    templateData?.video?.url ||
    templateData?.videoUrl ||
    null;
  const hasVideo =
    templateData?.static?.video?.hasVideo !== undefined
      ? Boolean(templateData?.static?.video?.hasVideo && videoUrl)
      : Boolean(videoUrl);

  return {
    backgroundUrl:
      templateData?.static?.background?.url ||
      templateData?.background?.url ||
      templateData?.backgroundUrl ||
      null,
    videoUrl: hasVideo ? videoUrl : null,
    musicUrl: hasMusic ? musicUrl : null,
  };
}

/** Single corporate page for admin Template modal (grows with content). */
export function CorporatePagePreview({
  pageId,
  templateData = null,
  templateConfig = null,
  interactive = false,
  onRsvpSuccess = null,
  previewBypassValidation = false,
  documentFiles = null,
}) {
  const { pagesCfg, fields } = resolveFields(templateData, templateConfig);
  const location = resolveEventLocation(templateData);
  const media = resolveEventMedia(templateData);
  const pageHeight = computeCorporatePageHeight(pageId, fields);
  const docs =
    documentFiles ||
    templateData?.static?.documents ||
    [];

  const Page = CORPORATE_PAGE_COMPONENTS[pageId];
  if (!Page) {
    return (
      <div
        className="flex items-center justify-center bg-[#E5F3FD] text-sm text-[#64748b]"
        style={{ width: CORPORATE_PAGE_WIDTH, height: CORPORATE_PAGE_HEIGHT }}
      >
        Unknown page: {pageId}
      </div>
    );
  }

  const frameProps = {
    className: 'overflow-hidden bg-[#02122B]',
    style: { width: CORPORATE_PAGE_WIDTH, height: pageHeight },
  };

  if (pageId === 'landing') {
    return (
      <div {...frameProps}>
        <Page
          fields={fields}
          backgroundUrl={media.backgroundUrl}
          onExploreClick={() => {}}
        />
      </div>
    );
  }

  if (pageId === 'rsvp') {
    return (
      <div {...frameProps}>
        <Page
          fields={fields}
          guestToken={null}
          maxGuests={1}
          previewBypassValidation={previewBypassValidation}
          onRsvpSuccess={
            interactive && typeof onRsvpSuccess === 'function'
              ? onRsvpSuccess
              : () => {}
          }
          onScrollNext={() => {}}
        />
      </div>
    );
  }

  if (pageId === 'ticketing') {
    return (
      <div {...frameProps} style={{ ...frameProps.style, backgroundColor: '#020A24', height: 'auto', minHeight: 844 }}>
        <TicketQrOverlay
          isOpen={true}
          embedded={true}
          theme="corporate"
          fields={fields}
          eventName={fields?.ticketEventTitle || templateData?.event?.name || 'Auto Test Event 06'}
          eventDescription={fields?.ticketSubtitle || templateData?.event?.subtitle || 'AN EVENING CELEBRATION, NETWORKING, & ENTERTAINMENT.'}
          eventDate={fields?.ticketDateLabel || templateData?.event?.eventDate || '12 November 2026'}
          eventTime={fields?.ticketTimeLabel || '6:00 PM Onwards'}
          eventVenue={fields?.ticketVenueName ? `${fields.ticketVenueName}, ${fields.ticketVenueCity || 'Colombo'}` : (templateData?.event?.location || 'Colombo Grand Ballroom, Colombo')}
          attendeeName="Kavindu Perera"
          ticketId="LN2026-0001-1"
          paymentReference="LN2026-0001"
          bookingDateTime="21 Oct 2026, 03:14 PM"
          paymentMethod="Google Pay"
          tickets={[
            {
              id: 'LN2026-0001-1',
              typeName: fields?.ticketCategory || 'VIP',
              name: fields?.ticketCategory || 'VIP',
              price: fields?.ticketPrice ? Number(String(fields.ticketPrice).replace(/[^0-9.]/g, '')) : 2000,
              quantity: 1,
              seatNo: fields?.ticketSeatLabel || 'GENERAL ADMISSION',
              attendeeName: 'Kavindu Perera',
            },
          ]}
        />
      </div>
    );
  }

  if (pageId === 'location') {
    return (
      <div {...frameProps}>
        <Page
          fields={fields}
          locationName={location.locationName}
          locationAddress={location.locationAddress}
          googleMapsLink={location.googleMapsLink}
        />
      </div>
    );
  }

  if (pageId === 'agenda') {
    return (
      <div {...frameProps}>
        <Page fields={fields} isRsvpConfirmed={true} guestToken={null} />
      </div>
    );
  }

  if (pageId === 'resources') {
    return (
      <div {...frameProps}>
        <Page fields={fields} documentFiles={docs} />
      </div>
    );
  }

  if (pageId === 'addToCalendar') {
    return (
      <div {...frameProps}>
        <Page fields={fields} onCloseClick={() => {}} />
      </div>
    );
  }

  return (
    <div {...frameProps}>
      <Page fields={fields} />
    </div>
  );
}

function CorporateInvitationFull({
  templateData = null,
  templateConfig: templateConfigProp = null,
  embedded = false,
  interactive = true,
  guestToken = null,
  publicEventToken = null,
  onRsvpSuccess: onRsvpSuccessProp = null,
  previewBypassValidation = false,
}) {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isTicketingOpen, setIsTicketingOpen] = useState(false);
  const [isTicketingPaymentOpen, setIsTicketingPaymentOpen] = useState(false);
  const [ticketingBookingData, setTicketingBookingData] = useState(null);

  useEffect(() => {
    try {
      const isRsvped = guestAlreadyRsvped(templateData);
      if (!isRsvped) {
        localStorage.removeItem('wedflow_purchased_tickets');
        sessionStorage.removeItem('wedflow_purchased_tickets');
        setTicketingBookingData(null);
        return;
      }
      const saved =
        localStorage.getItem('wedflow_purchased_tickets') ||
        sessionStorage.getItem('wedflow_purchased_tickets');
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
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isInvitationRoute, setIsInvitationRoute] = useState(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/invitation')
    ) {
      setIsInvitationRoute(true);
    }
  }, []);

  const guest = templateData?.guest || templateData?.static?.guest || null;
  const maxGuests = Number(guest?.maxGuests || guest?.invitedCount) || 1;

  const [hasSubmittedRsvp, setHasSubmittedRsvp] = useState(() =>
    guestAlreadyRsvped(templateData)
  );
  const [isEditingAttendee, setIsEditingAttendee] = useState(false);
  const [rsvpData, setRsvpData] = useState(() => {
    const guestRsvp = guest?.rsvp;
    if (guestRsvp && (guestRsvp.hasSubmitted || guestAlreadyRsvped(templateData))) {
      const isAttending =
        String(guestRsvp.attendingStatus || guest?.rsvpStatus).toLowerCase() === 'confirmed' ||
        String(guestRsvp.attendingStatus).toLowerCase() === 'attending';
      return {
        attendance: isAttending ? 'yes' : 'no',
        attendingStatus: isAttending ? 'confirmed' : 'declined',
        attendingCount: Number(guestRsvp.attendingCount) || 1,
        guests: Number(guestRsvp.attendingCount) || 1,
        wishes: guestRsvp.wishes || '',
        specialRequirements: guestRsvp.wishes || '',
      };
    }
    return null;
  });

  useEffect(() => {
    const isRsvped = guestAlreadyRsvped(templateData);
    setHasSubmittedRsvp(isRsvped);
    if (!isRsvped) {
      setRsvpData(null);
      setTicketingBookingData(null);
      setIsConfirmationOpen(false);
      setIsTicketingOpen(false);
      setIsTicketingPaymentOpen(false);
      setIsPaymentSuccessOpen(false);
      setIsTicketOpen(false);
      try {
        localStorage.removeItem('wedflow_purchased_tickets');
        sessionStorage.removeItem('wedflow_purchased_tickets');
      } catch (e) {}
      if (typeof window !== 'undefined') {
        const h = window.location.hash;
        if (h && (h === '#ticketing' || h === '#ticketing-payment' || h === '#payment-success' || h === '#ticket' || h === '#rsvp-confirmation')) {
          try {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          } catch (e) {}
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, [templateData]);

  const { pagesCfg, fields } = resolveFields(templateData, templateConfigProp);
  const location = resolveEventLocation(templateData);
  const media = resolveEventMedia(templateData);
  const documentFiles = templateData?.static?.documents || [];
  const hasVideo = Boolean(media.videoUrl);

  const [showIntroVideo, setShowIntroVideo] = useState(hasVideo);
  const [musicActive, setMusicActive] = useState(!hasVideo);

  useEffect(() => {
    setShowIntroVideo(hasVideo);
    setMusicActive(!hasVideo);
  }, [hasVideo, media.videoUrl]);

  const visiblePages = CORPORATE_PAGE_ORDER.filter((id) =>
    isPageEnabled(pagesCfg, id)
  );

  useEffect(() => {
    if (embedded) {
      setScale(1);
      return undefined;
    }

    const updateViewportScale = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width <= 480) {
        setScale(1);
        return;
      }

      const verticalPadding = 40;
      const availableHeight = height - verticalPadding;
      const calculatedScale = Math.min(1, Math.max(0.65, availableHeight / 844));
      setScale(calculatedScale);
    };

    updateViewportScale();
    window.addEventListener('resize', updateViewportScale, { passive: true });
    return () => window.removeEventListener('resize', updateViewportScale);
  }, [embedded]);

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
    if (typeof window !== 'undefined') {
      const h = window.location.hash;
      if (h === '#ticketing' && isTicketing && hasSubmittedRsvp) {
        setIsConfirmationOpen(false);
        setIsPaymentSuccessOpen(false);
        setIsTicketOpen(false);
        setIsTicketingPaymentOpen(false);
        setIsTicketingOpen(true);
      } else if (
        h === '#rsvp-confirmation' ||
        h === '#payment-success' ||
        h === '#ticketing-payment' ||
        (!hasSubmittedRsvp && h === '#ticketing')
      ) {
        if (!hasSubmittedRsvp) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
  }, [isTicketing, hasSubmittedRsvp]);

  useEffect(() => {
    if (!interactive) return undefined;

    const handleHashChange = () => {
      const h = window.location.hash;
      if (h === '#ticketing') {
        if (isTicketing && hasSubmittedRsvp) {
          setIsConfirmationOpen(false);
          setIsPaymentSuccessOpen(false);
          setIsTicketOpen(false);
          setIsTicketingPaymentOpen(false);
          setIsTicketingOpen(true);
        } else if (!hasSubmittedRsvp) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          handleScrollToPage1();
        }
      } else if (h === '#ticketing-payment') {
        if (ticketingBookingData && hasSubmittedRsvp) {
          setIsConfirmationOpen(false);
          setIsPaymentSuccessOpen(false);
          setIsTicketOpen(false);
          setIsTicketingOpen(false);
          setIsTicketingPaymentOpen(true);
        }
      } else if (h === '#ticket' || h === '#tickets' || h === '#ticket-qr') {
        if (hasSubmittedRsvp) {
          setIsConfirmationOpen(false);
          setIsPaymentSuccessOpen(false);
          setIsTicketingPaymentOpen(false);
          setIsTicketingOpen(false);
          setIsTicketOpen(true);
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'instant' });
          }
          if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
          }
        }
      } else if (h === '#payment-success') {
        if (ticketingBookingData && hasSubmittedRsvp) {
          setIsConfirmationOpen(false);
          setIsTicketingPaymentOpen(false);
          setIsTicketingOpen(false);
          setIsPaymentSuccessOpen(true);
          setIsTicketOpen(false);
        } else if (rsvpData && hasSubmittedRsvp) {
          setIsConfirmationOpen(false);
          setIsTicketingPaymentOpen(false);
          setIsTicketingOpen(false);
          setIsPaymentSuccessOpen(true);
          setIsTicketOpen(false);
        }
      } else if (h === '#rsvp-confirmation') {
        if (rsvpData && hasSubmittedRsvp) {
          setIsConfirmationOpen(true);
          setIsTicketingPaymentOpen(false);
          setIsTicketingOpen(false);
          setIsPaymentSuccessOpen(false);
          setIsTicketOpen(false);
        }
      } else if (h === '#rsvp' || h === '#page-6' || h === '#page-3') {
        setIsConfirmationOpen(false);
        setIsTicketingPaymentOpen(false);
        setIsTicketingOpen(false);
        setIsPaymentSuccessOpen(false);
        setIsTicketOpen(false);
        setTimeout(() => {
          const rsvpTarget =
            document.querySelector('[data-invite-page="rsvp"]') ||
            document.getElementById('page-6') ||
            document.getElementById('page-3');
          if (rsvpTarget) {
            if (embedded && containerRef.current) {
              containerRef.current.scrollTo({
                top: rsvpTarget.offsetTop,
                behavior: 'smooth',
              });
            } else if (typeof window !== 'undefined') {
              rsvpTarget.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }, 50);
      } else if (h === '#page-1' || !h) {
        setIsConfirmationOpen(false);
        setIsTicketingPaymentOpen(false);
        setIsTicketingOpen(false);
        setIsPaymentSuccessOpen(false);
        setIsTicketOpen(false);
        handleScrollToPage1();
      } else if (
        h === '#page-7' ||
        h === '#add-to-calendar'
      ) {
        setIsConfirmationOpen(false);
        setIsTicketingPaymentOpen(false);
        setIsTicketingOpen(false);
        setIsPaymentSuccessOpen(false);
        setIsTicketOpen(false);
        setTimeout(() => {
          const page7 = document.getElementById('page-7') || document.querySelector('[data-invite-page="addToCalendar"]');
          if (page7 && containerRef.current) {
            containerRef.current.scrollTo({
              top: page7.offsetTop,
              behavior: 'smooth',
            });
          }
        }, 50);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [interactive, ticketingBookingData, rsvpData, isTicketing]);

  const handleExploreClick = () => {
    const target =
      document.querySelector('[data-invite-page="landing"]') ||
      document.getElementById('page-1');
    if (target) {
      if (embedded && containerRef.current) {
        containerRef.current.scrollTo({
          top: target.offsetTop,
          behavior: 'smooth',
        });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleScrollToPage1 = () => {
    if (embedded && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const setHash = (hash) => {
    if (typeof window === 'undefined') return;
    if (window.history.pushState) {
      window.history.pushState(null, '', hash);
    } else {
      window.location.hash = hash;
    }
  };

  const handleRsvpSuccess = (answers) => {
    setRsvpData(answers || null);
    setTicketingBookingData(null);
    setHasSubmittedRsvp(true);
    setIsEditingAttendee(false);
    if (!interactive) return;
    if (typeof onRsvpSuccessProp === 'function') {
      onRsvpSuccessProp(answers);
      return;
    }

    if (isTicketing) {
      setIsConfirmationOpen(false);
      setIsPaymentSuccessOpen(false);
      setIsTicketOpen(false);
      setIsTicketingPaymentOpen(false);
      setIsTicketingOpen(true);
      setHash('#ticketing');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
    } else {
      setIsPaymentSuccessOpen(false);
      setIsConfirmationOpen(true);
      setHash('#rsvp-confirmation');
    }
  };

  const handleCloseConfirmation = () => {
    setIsConfirmationOpen(false);
    handleScrollToPage1();
    setHash('#page-1');
  };

  const handleCloseTicketingSelection = () => {
    setIsTicketingOpen(false);
    handleScrollToPage1();
    setHash('#page-1');
  };

  const handleBackFromTicketingSelection = () => {
    setIsTicketingOpen(false);
    setHash('#rsvp');
    setTimeout(() => {
      const rsvpTarget =
        document.querySelector('[data-invite-page="rsvp"]') ||
        document.getElementById('page-6') ||
        document.getElementById('page-3');
      if (rsvpTarget) {
        if (embedded && containerRef.current) {
          containerRef.current.scrollTo({
            top: rsvpTarget.offsetTop,
            behavior: 'smooth',
          });
        } else if (typeof window !== 'undefined') {
          rsvpTarget.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 50);
  };

  const handleEditAttendeeFromPayment = () => {
    setIsTicketingPaymentOpen(false);
    setIsTicketingOpen(false);
    setIsPaymentSuccessOpen(false);
    setIsTicketOpen(false);
    setIsEditingAttendee(true);
    setHash('#rsvp');
    setTimeout(() => {
      const rsvpTarget =
        document.querySelector('[data-invite-page="rsvp"]') ||
        document.getElementById('page-6') ||
        document.getElementById('page-3');
      if (rsvpTarget) {
        if (embedded && containerRef.current) {
          containerRef.current.scrollTo({
            top: rsvpTarget.offsetTop,
            behavior: 'smooth',
          });
        } else if (typeof window !== 'undefined') {
          rsvpTarget.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 60);
  };

  const handleOpenTicketingSelection = () => {
    setIsConfirmationOpen(false);
    setIsPaymentSuccessOpen(false);
    setIsTicketOpen(false);
    setIsTicketingPaymentOpen(false);
    setIsTicketingOpen(true);
    setHash('#ticketing');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleProceedToTicketingPayment = (data) => {
    const bookingRef = 'LN2026-0001';
    let ticketCounter = 1;
    const individualTickets = (data.selectedTickets || []).flatMap((t) =>
      Array.from({ length: Number(t.quantity) || 1 }, () => ({
        id: `${bookingRef}-${ticketCounter++}`,
        name: t.name,
        typeName: `${t.name} Ticket`,
        price: t.price,
      }))
    );
    const booking = {
      ...data,
      firstName: data?.firstName || rsvpData?.firstName || (rsvpData?.fullName ? rsvpData.fullName.split(' ')[0] : 'Kavindu'),
      lastName: data?.lastName || rsvpData?.lastName || (rsvpData?.fullName && rsvpData.fullName.split(' ').length > 1 ? rsvpData.fullName.split(' ').slice(1).join(' ') : 'Perera'),
      fullName: data?.fullName || rsvpData?.fullName || `${data?.firstName || 'Kavindu'} ${data?.lastName || 'Perera'}`,
      email: data?.email || rsvpData?.email || rsvpData?.emailAddress || guest?.email || 'kavindu@gmail.com',
      mobileNumber: data?.mobileNumber || rsvpData?.mobileNumber || rsvpData?.phone || guest?.mobileNumber || '+94 77 123 4567',
      nic: data?.nic || rsvpData?.nic || '199012345678',
      bookingRef,
      ticketsSummary: (data.selectedTickets || [])
        .map((t) => `${t.quantity} x ${t.name} (LKR ${Number(t.price).toLocaleString('en-US')})`)
        .join(', '),
      individualTickets,
    };
    setTicketingBookingData(booking);
    setIsTicketingOpen(false);
    setIsConfirmationOpen(false);
    setIsPaymentSuccessOpen(false);
    setIsTicketOpen(false);
    setIsTicketingPaymentOpen(true);
    setHash('#ticketing-payment');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleUpdateTicketingBookingData = (updatedData) => {
    if (!updatedData) return;
    setTicketingBookingData((prev) => {
      const merged = { ...(prev || {}), ...updatedData };
      const attendeeName =
        merged.fullName ||
        `${merged.firstName || ''}`.trim() + (merged.lastName ? ` ${merged.lastName}` : '') ||
        'Kavindu Perera';
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

  const handleTicketingPaymentSuccess = (updatedData) => {
    setIsTicketingPaymentOpen(false);
    setIsPaymentSuccessOpen(true);
    setHash('#payment-success');
    let finalBooking = ticketingBookingData;
    if (updatedData) {
      finalBooking = { ...(ticketingBookingData || {}), ...updatedData };
      const attendeeName =
        finalBooking.fullName ||
        `${finalBooking.firstName || ''}`.trim() + (finalBooking.lastName ? ` ${finalBooking.lastName}` : '') ||
        'Kavindu Perera';
      if (Array.isArray(finalBooking.individualTickets)) {
        finalBooking.individualTickets = finalBooking.individualTickets.map((t) => ({
          ...t,
          attendeeName,
          firstName: finalBooking.firstName,
          lastName: finalBooking.lastName,
          email: finalBooking.email || finalBooking.emailAddress,
          mobileNumber: finalBooking.mobileNumber || finalBooking.phone,
          nic: finalBooking.nic || finalBooking.nicNumber,
        }));
      }
      setTicketingBookingData(finalBooking);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (finalBooking) {
        try {
          localStorage.setItem('wedflow_purchased_tickets', JSON.stringify(finalBooking));
          sessionStorage.setItem('wedflow_purchased_tickets', JSON.stringify(finalBooking));
        } catch (e) {
          console.warn('Could not store tickets', e);
        }
      }
    }
  };

  const handleCloseTicketingPayment = () => {
    setIsTicketingPaymentOpen(false);
    setIsPaymentSuccessOpen(false);
    setIsTicketOpen(false);
    setIsTicketingOpen(true);
    setHash('#ticketing');
  };

  const handleBackFromTicketingPaymentSuccess = () => {
    setIsPaymentSuccessOpen(false);
    setIsTicketingPaymentOpen(true);
    setIsTicketOpen(false);
    setHash('#ticketing-payment');
  };

  const handleProceedToPayment = () => {
    setTicketingBookingData(null);
    const paymentLink = String(
      templateData?.static?.event?.paymentLink ||
        templateData?.event?.paymentLink ||
        ""
    ).trim();
    if (paymentLink) {
      if (typeof window !== "undefined") {
        window.open(paymentLink, "_blank", "noopener,noreferrer");
      }
      return;
    }
    setIsConfirmationOpen(false);
    setIsPaymentSuccessOpen(true);
    setHash('#payment-success');
  };

  const handleBackToRsvp = () => {
    setIsPaymentSuccessOpen(false);
    setIsConfirmationOpen(true);
    setHash('#rsvp-confirmation');
  };

  const handleBackFromTicketing = () => {
    handleBackFromTicketingPaymentSuccess();
  };

  const handleClosePaymentSuccess = () => {
    setIsPaymentSuccessOpen(false);
    handleScrollToPage1();
    setHash('#page-1');
  };

  const handleNavigateToCalendar = () => {
    setIsPaymentSuccessOpen(false);
    setIsConfirmationOpen(false);
    setIsTicketOpen(false);
    setHash('#page-7');
    setTimeout(() => {
      const page7 = document.getElementById('page-7') || document.querySelector('[data-invite-page="addToCalendar"]');
      if (page7) {
        if (embedded && containerRef.current) {
          containerRef.current.scrollTo({
            top: page7.offsetTop,
            behavior: 'smooth',
          });
        } else {
          page7.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 50);
  };

  const handleOpenTicket = () => {
    if (!ticketingBookingData) {
      const bookingRef = 'LN2026-0001';
      const attendee =
        rsvpData?.fullName ||
        guest?.full_name ||
        guest?.fullName ||
        guest?.name ||
        fields.guestName ||
        'Kavindu Perera';
      const email =
        rsvpData?.email ||
        rsvpData?.emailAddress ||
        guest?.email ||
        fields.guestEmail ||
        'kavindu@gmail.com';
      setTicketingBookingData({
        bookingRef,
        fullName: attendee,
        email,
        individualTickets: [
          {
            id: `${bookingRef}-1`,
            name: 'Standard',
            typeName: 'STANDARD',
            price: 1000,
            quantity: 1,
            seatNo: 'GENERAL ADMISSION',
            attendeeName: attendee,
          },
        ],
      });
    }
    setIsConfirmationOpen(false);
    setIsPaymentSuccessOpen(false);
    setIsTicketingOpen(false);
    setIsTicketingPaymentOpen(false);
    setIsTicketOpen(true);
    setHash('#ticket');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleBackToPayment = () => {
    setIsTicketOpen(false);
    setIsPaymentSuccessOpen(true);
    setHash('#payment-success');
  };

  const handleCloseTicket = () => {
    setIsTicketOpen(false);
    handleScrollToPage1();
    setHash('#page-1');
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

    if (pageId === 'rsvp' && hasSubmittedRsvp && !isEditingAttendee) {
      return (
        <RsvpChangeRequestPage
          key="rsvp-change"
          rsvpData={rsvpData || {}}
          guestToken={guestToken || ''}
          isTicketing={isTicketing}
          hasPurchasedTickets={Boolean(ticketingBookingData?.individualTickets?.length || ticketingBookingData?.totalAmount)}
          purchasedBookingData={ticketingBookingData}
          onViewPurchasedTickets={handleOpenTicket}
          onPurchaseMoreTickets={handleOpenTicketingSelection}
        />
      );
    }

    const Page = CORPORATE_PAGE_COMPONENTS[pageId];
    if (!Page) return null;

    if (pageId === 'landing') {
      return (
        <Page
          key={pageId}
          fields={fields}
          backgroundUrl={media.backgroundUrl}
          onExploreClick={handleExploreClick}
        />
      );
    }
    if (pageId === 'rsvp') {
      const isPublicReg = Boolean(publicEventToken);
      return (
        <Page
          key={pageId}
          fields={fields}
          guest={guest}
          rsvpData={rsvpData}
          initialValues={rsvpData}
          guestToken={guestToken}
          publicEventToken={publicEventToken}
          maxGuests={isPublicReg ? Math.max(maxGuests, 10) : maxGuests}
          previewBypassValidation={
            previewBypassValidation || (!guestToken && !isPublicReg)
          }
          onRsvpSuccess={interactive ? handleRsvpSuccess : () => {}}
          onScrollNext={handleExploreClick}
        />
      );
    }
    if (pageId === 'agenda') {
      const isConfirmed =
        (rsvpData &&
          (rsvpData.attendance === 'yes' ||
            String(rsvpData.attendingStatus).toLowerCase() === 'confirmed' ||
            String(rsvpData.attendingStatus).toLowerCase() === 'attending')) ||
        (!rsvpData &&
          guest?.rsvp &&
          (String(guest.rsvp.attendingStatus || guest?.rsvpStatus).toLowerCase() === 'confirmed' ||
            String(guest.rsvp.attendingStatus).toLowerCase() === 'attending'));

      return (
        <Page
          key={pageId}
          fields={fields}
          isRsvpConfirmed={Boolean(isConfirmed)}
          guestToken={guestToken}
        />
      );
    }
    if (pageId === 'location') {
      return (
        <Page
          key={pageId}
          fields={fields}
          locationName={location.locationName}
          locationAddress={location.locationAddress}
          googleMapsLink={location.googleMapsLink}
        />
      );
    }
    if (pageId === 'resources') {
      return (
        <Page
          key={pageId}
          fields={fields}
          documentFiles={documentFiles}
        />
      );
    }
    if (pageId === 'addToCalendar') {
      return (
        <Page key={pageId} fields={fields} onCloseClick={handleScrollToPage1} />
      );
    }
    if (pageId === 'ticketing') {
      const tickets = templateData?.event?.tickets || templateData?.static?.event?.tickets || [];
      return (
        <Page
          key={pageId}
          fields={fields}
          ticketTypes={tickets}
          defaultName={guest?.name || fields.guestName || "Kavindu Perera"}
          defaultEmail={guest?.email || fields.guestEmail || "kavindu@gmail.com"}
          onProceedToPayment={handleProceedToTicketingPayment}
          onScrollNext={handleExploreClick}
        />
      );
    }
    return <Page key={pageId} fields={fields} />;
  };

  if (embedded) {
    return (
      <div
        ref={containerRef}
        style={{
          width: 390,
          height: 844,
          borderRadius: 26,
          backgroundColor: '#02122B',
          overflow: (isTicketOpen || isPaymentSuccessOpen || isTicketingPaymentOpen || isConfirmationOpen) ? 'hidden' : 'auto',
          ...corporateThemeVars(fields),
        }}
        className={`relative ${(isTicketOpen || isPaymentSuccessOpen || isTicketingPaymentOpen || isConfirmationOpen) ? 'overflow-hidden' : 'overflow-y-auto'} scrollbar-none`}
        aria-label="Corporate invitation"
      >
        {media.musicUrl ? (
          <InvitationBackgroundMusic
            musicUrl={media.musicUrl}
            active={musicActive && !showIntroVideo}
            showMuteButton
            usePortal={false}
          />
        ) : null}
        {showIntroVideo && media.videoUrl ? (
          <InvitationVideoIntro
            key={media.videoUrl}
            videoUrl={media.videoUrl}
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
                templateData?.ticketTypes ||
                templateData?.static?.ticketTypes ||
                templateData?.event?.tickets ||
                templateData?.static?.event?.tickets ||
                []
              }
              theme="corporate"
              defaultName={rsvpData?.fullName || guest?.name || fields.guestName || 'Kavindu Perera'}
              defaultEmail={rsvpData?.email || rsvpData?.emailAddress || guest?.email || fields.guestEmail || 'kavindu@gmail.com'}
              onProceedToPayment={handleProceedToTicketingPayment}
              onScrollNext={handleCloseTicketingSelection}
              onBack={handleBackFromTicketingSelection}
              purchasedBookingData={ticketingBookingData}
              onViewPurchasedTickets={handleOpenTicket}
              hasPurchasedTickets={Boolean(ticketingBookingData?.individualTickets?.length || ticketingBookingData?.totalAmount)}
            />
          </div>
        ) : null}

        <RsvpConfirmationOverlay
          isOpen={isConfirmationOpen}
          canAttend={
            rsvpData
              ? (rsvpData.attendance || 'yes').toLowerCase() !== 'no' &&
                (rsvpData.attendingStatus || '').toLowerCase() !== 'declined'
              : true
          }
          onClose={handleCloseConfirmation}
          onProceedToPayment={handleProceedToPayment}
        />
        <TicketingPaymentOverlay
          isOpen={isTicketingPaymentOpen}
          onClose={handleCloseTicketingPayment}
          onBack={handleCloseTicketingPayment}
          onEditAttendee={handleEditAttendeeFromPayment}
          onPaySuccess={handleTicketingPaymentSuccess}
          onUpdateBookingData={handleUpdateTicketingBookingData}
          bookingData={ticketingBookingData || {}}
          theme="corporate"
          eventMeta={{
            eventName: fields.eventName || templateData?.static?.event?.name || 'Annual Business Summit 2026',
            eventDateTime: `${fields.eventDate || 'Thu, 12 Nov 2026'} | ${fields.eventTime || '6:00 PM'}`,
            eventVenue: location.locationName || 'Cinnamon Lakeside Colombo',
          }}
        />
        <PaymentSuccessOverlay
          isOpen={isPaymentSuccessOpen}
          onClose={ticketingBookingData ? handleBackFromTicketingPaymentSuccess : handleClosePaymentSuccess}
          onBackToRsvp={ticketingBookingData ? handleBackFromTicketingPaymentSuccess : handleBackToRsvp}
          onAddToCalendar={handleNavigateToCalendar}
          onViewTicket={handleOpenTicket}
          bookingData={ticketingBookingData}
          theme="corporate"
          eventMeta={{
            eventName: fields.ticketEventTitle || fields.eventName || templateData?.static?.event?.name || "Auto Test Event 06",
            eventSubtitle: fields.ticketSubtitle || fields.eventDescription || templateData?.static?.event?.description,
            eventDate: fields.ticketDateLabel || fields.eventDate || "12 November 2026",
            eventTime: fields.ticketTimeLabel || fields.eventTime || "6:00 PM Onwards",
            venueName: fields.ticketVenueName || location.locationName || "Colombo Grand Ballroom",
            venueCity: fields.ticketVenueCity || "Colombo",
          }}
        />
        <TicketQrOverlay
          isOpen={isTicketOpen}
          onClose={handleBackToPayment}
          onBackToPayment={handleBackToPayment}
          onAddToCalendar={handleNavigateToCalendar}
          onScrollNext={() => {
            setIsTicketOpen(false);
            setTimeout(() => {
              const el =
                document.querySelector('[data-invite-page="landing"]') ||
                document.querySelector('[data-invite-page="eventDetails"]') ||
                document.querySelector('[data-invite-page="agenda"]');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 60);
          }}
          attendeeName={ticketingBookingData?.fullName || guest?.name || 'Kavindu Perera'}
          ticketId={ticketingBookingData?.bookingRef || 'LN2026-0001'}
          tickets={ticketingBookingData?.individualTickets || []}
          eventName={fields.eventName || templateData?.static?.event?.name || 'Annual Business Summit – 2026'}
          eventDescription={fields.eventDescription || templateData?.static?.event?.description || 'An evening celebration, networking, & entertainment.'}
          eventDate={fields.eventDate || 'Thursday, 12 November 2026'}
          eventTime={fields.eventTime || '6:00 PM Onwards'}
          eventVenue={location.locationName || 'Cinnamon Lakeside Colombo'}
          bookingData={ticketingBookingData}
          theme="corporate"
        />
      </div>
    );
  }

  const isVideoActive = showIntroVideo && Boolean(media.videoUrl);

  return (
    <div
      className="relative w-full flex flex-col items-center justify-center mx-auto"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        margin: '0 auto',
      }}
    >
      {!guestToken && !embedded ? (
        <InvitationPreviewBackButton href="/invite" label="Back to invite" guestToken={guestToken} />
      ) : null}

      <InvitationBackgroundMusic
        musicUrl={media.musicUrl || "/assets/couple_music/dinelkadishmi/dinelkadishmi_music.mp3"}
        active={musicActive && !isVideoActive}
        showMuteButton
        usePortal
      />

      <InviteMobileScaler
        mode={(isVideoActive || isTicketOpen || isPaymentSuccessOpen || isTicketingPaymentOpen || isConfirmationOpen || isTicketingOpen) ? 'cover' : 'width'}
        fixedHeight={(isVideoActive || isTicketOpen || isPaymentSuccessOpen || isTicketingPaymentOpen || isConfirmationOpen || isTicketingOpen) ? INVITE_FRAME_H : undefined}
        className="w-full flex justify-center items-center mx-auto"
      >
        <main
          className={`relative mx-auto overflow-hidden border-0 outline-none isolate ${
            isVideoActive ? '' : 'card-shadow md:rounded-2xl'
          }`}
          style={{
            width: INVITE_FRAME_W,
            maxWidth: INVITE_FRAME_W,
            height: (isVideoActive || isTicketOpen || isPaymentSuccessOpen || isTicketingPaymentOpen || isConfirmationOpen || isTicketingOpen) ? INVITE_FRAME_H : undefined,
            maxHeight: (isTicketOpen || isPaymentSuccessOpen || isTicketingPaymentOpen || isConfirmationOpen || isTicketingOpen) ? INVITE_FRAME_H : undefined,
            overflow: (isTicketOpen || isPaymentSuccessOpen || isTicketingPaymentOpen || isConfirmationOpen || isTicketingOpen) ? 'hidden' : undefined,
            backgroundColor: '#02122B',
            margin: '0 auto',
            display: 'block',
            ...corporateThemeVars(fields),
          }}
          aria-label="Corporate invitation"
        >
          {isVideoActive ? (
            <div className="absolute inset-0 w-[390px] h-[844px] overflow-hidden mx-auto">
              <InvitationVideoIntro
                key={media.videoUrl}
                videoUrl={media.videoUrl}
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
          ) : (
            <div
              className="relative w-[390px] flex flex-col mx-auto"
              style={{ ...corporateThemeVars(fields), margin: '0 auto' }}
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
                  templateData?.ticketTypes ||
                  templateData?.static?.ticketTypes ||
                  templateData?.event?.tickets ||
                  templateData?.static?.event?.tickets ||
                  []
                }
                theme="corporate"
                defaultName={rsvpData?.fullName || guest?.name || fields.guestName || 'Kavindu Perera'}
                defaultEmail={rsvpData?.email || rsvpData?.emailAddress || guest?.email || fields.guestEmail || 'kavindu@gmail.com'}
                onProceedToPayment={handleProceedToTicketingPayment}
                onScrollNext={handleCloseTicketingSelection}
                onBack={handleBackFromTicketingSelection}
                purchasedBookingData={ticketingBookingData}
                onViewPurchasedTickets={handleOpenTicket}
                hasPurchasedTickets={Boolean(ticketingBookingData?.individualTickets?.length || ticketingBookingData?.totalAmount)}
              />
            </div>
          ) : null}

          <RsvpConfirmationOverlay
            isOpen={isConfirmationOpen}
            canAttend={
              rsvpData
                ? (rsvpData.attendance || 'yes').toLowerCase() !== 'no' &&
                  (rsvpData.attendingStatus || '').toLowerCase() !== 'declined'
                : true
            }
            onClose={handleCloseConfirmation}
            onProceedToPayment={handleProceedToPayment}
          />
          <TicketingPaymentOverlay
            isOpen={isTicketingPaymentOpen}
            onClose={handleCloseTicketingPayment}
            onBack={handleCloseTicketingPayment}
            onEditAttendee={handleEditAttendeeFromPayment}
            onPaySuccess={handleTicketingPaymentSuccess}
            onUpdateBookingData={handleUpdateTicketingBookingData}
            bookingData={ticketingBookingData || {}}
            theme="corporate"
            eventMeta={{
              eventName: fields.eventName || templateData?.static?.event?.name || 'Annual Business Summit 2026',
              eventDateTime: `${fields.eventDate || 'Thu, 12 Nov 2026'} | ${fields.eventTime || '6:00 PM'}`,
              eventVenue: location.locationName || 'Cinnamon Lakeside Colombo',
            }}
          />
          <PaymentSuccessOverlay
            isOpen={isPaymentSuccessOpen}
            onClose={ticketingBookingData ? handleBackFromTicketingPaymentSuccess : handleClosePaymentSuccess}
            onBackToRsvp={ticketingBookingData ? handleBackFromTicketingPaymentSuccess : handleBackToRsvp}
            onAddToCalendar={handleNavigateToCalendar}
            onViewTicket={handleOpenTicket}
            bookingData={ticketingBookingData}
            theme="corporate"
            eventMeta={{
              eventName: fields.ticketEventTitle || fields.eventName || templateData?.static?.event?.name || "Auto Test Event 06",
              eventSubtitle: fields.ticketSubtitle || fields.eventDescription || templateData?.static?.event?.description,
              eventDate: fields.ticketDateLabel || fields.eventDate || "12 November 2026",
              eventTime: fields.ticketTimeLabel || fields.eventTime || "6:00 PM Onwards",
              venueName: fields.ticketVenueName || location.locationName || "Colombo Grand Ballroom",
              venueCity: fields.ticketVenueCity || "Colombo",
            }}
          />
          <TicketQrOverlay
            isOpen={isTicketOpen}
            onClose={handleBackToPayment}
            onBackToPayment={handleBackToPayment}
            onAddToCalendar={handleNavigateToCalendar}
            onScrollNext={() => {
              setIsTicketOpen(false);
              setTimeout(() => {
                const el =
                  document.querySelector('[data-invite-page="landing"]') ||
                  document.querySelector('[data-invite-page="eventDetails"]') ||
                  document.querySelector('[data-invite-page="agenda"]');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 60);
            }}
            attendeeName={ticketingBookingData?.fullName || guest?.name || 'Kavindu Perera'}
            ticketId={ticketingBookingData?.bookingRef || 'LN2026-0001'}
            tickets={ticketingBookingData?.individualTickets || []}
            eventName={fields.eventName || templateData?.static?.event?.name || 'Annual Business Summit – 2026'}
            eventDescription={fields.eventDescription || templateData?.static?.event?.description || 'An evening celebration, networking, & entertainment.'}
            eventDate={fields.eventDate || 'Thursday, 12 November 2026'}
            eventTime={fields.eventTime || '6:00 PM Onwards'}
            eventVenue={location.locationName || 'Cinnamon Lakeside Colombo'}
            bookingData={ticketingBookingData}
            theme="corporate"
          />
        </main>
      </InviteMobileScaler>
    </div>
  );
}

export default function CorporateInvitationExperience({
  templateData = null,
  templateConfig = null,
  embedded = false,
  interactive = true,
  previewPageId = null,
  onRsvpSuccess = null,
  guestToken = null,
  publicEventToken = null,
  previewBypassValidation = false,
}) {
  if (previewPageId) {
    return (
      <CorporatePagePreview
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
    <CorporateInvitationFull
      templateData={templateData}
      templateConfig={templateConfig}
      embedded={embedded}
      interactive={interactive}
      onRsvpSuccess={onRsvpSuccess}
      guestToken={guestToken}
      publicEventToken={publicEventToken}
      previewBypassValidation={previewBypassValidation}
    />
  );
}

/** Alias for older imports */
export const InvitationWrapper = CorporateInvitationExperience;
