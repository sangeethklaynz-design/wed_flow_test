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
import InvitationVideoIntro from '@/components/invite/InvitationVideoIntro';
import InvitationBackgroundMusic from '@/components/invite/InvitationBackgroundMusic';
import { RsvpConfirmationOverlay } from './overlays/RsvpConfirmationOverlay';
import { PaymentSuccessOverlay } from './overlays/PaymentSuccessOverlay';
import { TicketQrOverlay } from './overlays/TicketQrOverlay';
import { RsvpChangeRequestPage } from './pages/RsvpChangeRequestPage';

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
  return {
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
    return (
      <div {...frameProps}>
        <Page
          fields={fields}
          previewBypassValidation={previewBypassValidation}
          onRsvpSuccess={
            interactive && typeof onRsvpSuccess === 'function'
              ? onRsvpSuccess
              : () => {}
          }
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
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [hasSubmittedRsvp, setHasSubmittedRsvp] = useState(() =>
    guestAlreadyRsvped(templateData)
  );
  const [rsvpData, setRsvpData] = useState(null);

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
    if (!interactive) return undefined;

    const handleHashChange = () => {
      if (window.location.hash === '#ticket' || window.location.hash === '#ticket-qr') {
        setIsConfirmationOpen(false);
        setIsPaymentSuccessOpen(false);
        setIsTicketOpen(true);
      } else if (window.location.hash === '#payment-success') {
        setIsConfirmationOpen(false);
        setIsPaymentSuccessOpen(true);
        setIsTicketOpen(false);
      } else if (window.location.hash === '#rsvp-confirmation') {
        setIsConfirmationOpen(true);
        setIsPaymentSuccessOpen(false);
        setIsTicketOpen(false);
      } else if (window.location.hash === '#page-1') {
        setIsConfirmationOpen(false);
        setIsPaymentSuccessOpen(false);
        setIsTicketOpen(false);
        const page1 = document.getElementById('page-1');
        if (page1) page1.scrollIntoView({ behavior: 'smooth' });
      } else if (
        window.location.hash === '#page-7' ||
        window.location.hash === '#add-to-calendar'
      ) {
        setIsConfirmationOpen(false);
        setIsPaymentSuccessOpen(false);
        setIsTicketOpen(false);
        setTimeout(() => {
          const page7 = document.getElementById('page-7');
          if (page7 && containerRef.current) {
            containerRef.current.scrollTo({
              top: page7.offsetTop,
              behavior: 'smooth',
            });
          }
        }, 50);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [interactive]);

  const handleExploreClick = () => {
    const page2 = document.getElementById('page-2');
    if (page2 && containerRef.current) {
      containerRef.current.scrollTo({
        top: page2.offsetTop,
        behavior: 'smooth',
      });
    }
  };

  const handleScrollToPage1 = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleProceedToPayment = () => {
    setIsConfirmationOpen(false);
    setIsPaymentSuccessOpen(true);
    setHash('#payment-success');
  };

  const handleBackToRsvp = () => {
    setIsPaymentSuccessOpen(false);
    setIsConfirmationOpen(true);
    setHash('#rsvp-confirmation');
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
      const page7 = document.getElementById('page-7');
      if (page7 && containerRef.current) {
        containerRef.current.scrollTo({
          top: page7.offsetTop,
          behavior: 'smooth',
        });
      }
    }, 50);
  };

  const handleOpenTicket = () => {
    setIsPaymentSuccessOpen(false);
    setIsTicketOpen(true);
    setHash('#ticket');
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
    if (pageId === 'rsvp' && hasSubmittedRsvp) {
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
      return (
        <Page
          key={pageId}
          fields={fields}
          previewBypassValidation={previewBypassValidation || !guestToken}
          onRsvpSuccess={interactive ? handleRsvpSuccess : () => {}}
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
    return <Page key={pageId} fields={fields} />;
  };

  const shellClass = embedded
    ? 'relative flex items-center justify-center w-[390px]'
    : 'w-screen h-screen flex items-center justify-center relative overflow-hidden bg-[#E5F3FD]';

  const Tag = embedded ? 'div' : 'main';

  return (
    <Tag className={shellClass}>
      {media.musicUrl ? (
        <InvitationBackgroundMusic
          musicUrl={media.musicUrl}
          active={musicActive && !showIntroVideo}
          showMuteButton
          usePortal={!embedded}
        />
      ) : null}
      <div
        id="invitation-wrapper"
        ref={wrapperRef}
        style={{
          transform:
            !embedded && typeof window !== 'undefined' && window.innerWidth > 480
              ? `scale(${scale})`
              : undefined,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease-out',
        }}
        className={
          embedded
            ? 'relative flex items-center justify-center'
            : 'relative flex items-center justify-center max-sm:w-full max-sm:h-full'
        }
      >
        <div
          id="invitation-container"
          ref={containerRef}
          style={corporateThemeVars(fields)}
          className={
            embedded
              ? 'w-[390px] h-[844px] relative rounded-[26px] overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth shadow-card bg-[#02122B] no-scrollbar'
              : 'w-[390px] h-[844px] relative rounded-[26px] overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth shadow-card bg-[#02122B] no-scrollbar max-sm:w-full max-sm:max-w-[430px] max-sm:h-[100dvh] max-sm:rounded-none max-sm:shadow-none'
          }
        >
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
            visiblePages.map((pageId) => renderPage(pageId))
          )}
        </div>

        <RsvpConfirmationOverlay
          isOpen={isConfirmationOpen}
          onClose={handleCloseConfirmation}
          onProceedToPayment={handleProceedToPayment}
        />
        <PaymentSuccessOverlay
          isOpen={isPaymentSuccessOpen}
          onClose={handleClosePaymentSuccess}
          onBackToRsvp={handleBackToRsvp}
          onAddToCalendar={handleNavigateToCalendar}
          onViewTicket={handleOpenTicket}
        />
        <TicketQrOverlay
          isOpen={isTicketOpen}
          onClose={handleCloseTicket}
          onBackToPayment={handleBackToPayment}
          onAddToCalendar={handleNavigateToCalendar}
        />
      </div>
    </Tag>
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
