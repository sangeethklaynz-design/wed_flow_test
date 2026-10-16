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
  const { fields } = resolveFields(templateData, templateConfig);
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
        <div {...frameProps} style={{ ...frameProps.style, backgroundColor: '#FFFFFF' }}>
          <TicketingSelectionPage
            ticketTypes={ticketTypes}
            theme="corporate"
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
  onRsvpSuccess: onRsvpSuccessProp = null,
  previewBypassValidation = false,
}) {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isTicketingPaymentOpen, setIsTicketingPaymentOpen] = useState(false);
  const [ticketingBookingData, setTicketingBookingData] = useState(null);

  useEffect(() => {
    try {
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
  }, []);
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash;
      if (
        h === '#rsvp-confirmation' ||
        h === '#payment-success' ||
        h === '#ticketing-payment'
      ) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, []);

  useEffect(() => {
    if (!interactive) return undefined;

    const handleHashChange = () => {
      const h = window.location.hash;
      if (h === '#ticketing-payment') {
        if (ticketingBookingData) {
          setIsConfirmationOpen(false);
          setIsPaymentSuccessOpen(false);
          setIsTicketOpen(false);
          setIsTicketingPaymentOpen(true);
        }
      } else if (h === '#ticket' || h === '#tickets' || h === '#ticket-qr') {
        setIsConfirmationOpen(false);
        setIsPaymentSuccessOpen(false);
        setIsTicketingPaymentOpen(false);
        setIsTicketOpen(true);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
      } else if (h === '#payment-success') {
        if (ticketingBookingData) {
          setIsConfirmationOpen(false);
          setIsTicketingPaymentOpen(false);
          setIsPaymentSuccessOpen(true);
          setIsTicketOpen(false);
        } else if (rsvpData) {
          setIsConfirmationOpen(false);
          setIsTicketingPaymentOpen(false);
          setIsPaymentSuccessOpen(true);
          setIsTicketOpen(false);
        }
      } else if (h === '#rsvp-confirmation') {
        if (rsvpData) {
          setIsConfirmationOpen(true);
          setIsTicketingPaymentOpen(false);
          setIsPaymentSuccessOpen(false);
          setIsTicketOpen(false);
        }
      } else if (h === '#page-1' || h === '#ticketing' || !h) {
        setIsConfirmationOpen(false);
        setIsTicketingPaymentOpen(false);
        setIsPaymentSuccessOpen(false);
        setIsTicketOpen(false);
        const page1 = document.getElementById('page-1');
        if (page1) page1.scrollIntoView({ behavior: 'smooth' });
      } else if (
        h === '#page-7' ||
        h === '#add-to-calendar'
      ) {
        setIsConfirmationOpen(false);
        setIsTicketingPaymentOpen(false);
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
  }, [interactive, ticketingBookingData, rsvpData]);

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
    if (!interactive) return;
    if (typeof onRsvpSuccessProp === 'function') {
      onRsvpSuccessProp(answers);
      return;
    }
    setIsPaymentSuccessOpen(false);
    setIsConfirmationOpen(true);
    setHash('#rsvp-confirmation');
  };

  const handleCloseConfirmation = () => {
    setIsConfirmationOpen(false);
    handleScrollToPage1();
    setHash('#page-1');
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
      bookingRef,
      ticketsSummary: (data.selectedTickets || [])
        .map((t) => `${t.quantity} x ${t.name} (LKR ${Number(t.price).toLocaleString('en-US')})`)
        .join(', '),
      individualTickets,
    };
    setTicketingBookingData(booking);
    setIsConfirmationOpen(false);
    setIsPaymentSuccessOpen(false);
    setIsTicketOpen(false);
    setIsTicketingPaymentOpen(true);
    setHash('#ticketing-payment');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleTicketingPaymentSuccess = () => {
    setIsTicketingPaymentOpen(false);
    setIsPaymentSuccessOpen(true);
    setHash('#payment-success');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (ticketingBookingData) {
        try {
          localStorage.setItem('wedflow_purchased_tickets', JSON.stringify(ticketingBookingData));
          sessionStorage.setItem('wedflow_purchased_tickets', JSON.stringify(ticketingBookingData));
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
    setHash('#page-1');
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
    setIsPaymentSuccessOpen(false);
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
    handleBackToPayment();
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

    if (pageId === 'rsvp' && hasSubmittedRsvp && !isTicketing) {
      return (
        <RsvpChangeRequestPage
          key="rsvp-change"
          rsvpData={rsvpData || {}}
          guestToken={guestToken || ''}
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
      if (isTicketing) {
        const ticketTypes =
          templateData?.ticketTypes ||
          templateData?.static?.ticketTypes ||
          templateData?.event?.tickets ||
          templateData?.static?.event?.tickets ||
          [];
        const isModalOpen = Boolean(
          isTicketOpen || isPaymentSuccessOpen || isTicketingPaymentOpen || isConfirmationOpen
        );
        return (
          <div
            key="ticket-selection"
            id="page-1"
            data-invite-page="rsvp"
            className="w-[390px] min-h-[844px] flex items-center justify-center relative overflow-hidden bg-transparent"
            style={{
              display: isModalOpen ? 'none' : 'flex',
            }}
          >
            <TicketingSelectionPage
              ticketTypes={ticketTypes}
              theme="corporate"
              defaultName={guest?.name || fields.guestName || 'Kavindu Perera'}
              defaultEmail={guest?.email || fields.guestEmail || 'kavindu@gmail.com'}
              onProceedToPayment={handleProceedToTicketingPayment}
              onScrollNext={handleExploreClick}
              onBack={handleExploreClick}
              purchasedBookingData={ticketingBookingData}
              onViewPurchasedTickets={handleOpenTicket}
              hasPurchasedTickets={Boolean(ticketingBookingData?.individualTickets?.length || ticketingBookingData?.totalAmount)}
            />
          </div>
        );
      }

      return (
        <Page
          key={pageId}
          fields={fields}
          guestToken={guestToken}
          maxGuests={maxGuests}
          previewBypassValidation={previewBypassValidation || !guestToken}
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
          onPaySuccess={handleTicketingPaymentSuccess}
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
        mode={(isVideoActive || isTicketOpen || isPaymentSuccessOpen || isTicketingPaymentOpen || isConfirmationOpen) ? 'cover' : 'width'}
        fixedHeight={(isVideoActive || isTicketOpen || isPaymentSuccessOpen || isTicketingPaymentOpen || isConfirmationOpen) ? INVITE_FRAME_H : undefined}
        className="w-full flex justify-center items-center mx-auto"
      >
        <main
          className={`relative mx-auto overflow-hidden border-0 outline-none isolate ${
            isVideoActive ? '' : 'card-shadow md:rounded-2xl'
          }`}
          style={{
            width: INVITE_FRAME_W,
            maxWidth: INVITE_FRAME_W,
            height: (isVideoActive || isTicketOpen || isPaymentSuccessOpen || isTicketingPaymentOpen || isConfirmationOpen) ? INVITE_FRAME_H : undefined,
            maxHeight: (isTicketOpen || isPaymentSuccessOpen || isTicketingPaymentOpen || isConfirmationOpen) ? INVITE_FRAME_H : undefined,
            overflow: (isTicketOpen || isPaymentSuccessOpen || isTicketingPaymentOpen || isConfirmationOpen) ? 'hidden' : undefined,
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
            onPaySuccess={handleTicketingPaymentSuccess}
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
      previewBypassValidation={previewBypassValidation}
    />
  );
}

/** Alias for older imports */
export const InvitationWrapper = CorporateInvitationExperience;
