'use client';

import React, { useState, useRef } from 'react';
import TicketQrImage from '@/components/invite/common/TicketQrImage';
import { downloadVectorTicketPdf } from '@/lib/ticketPdfGenerator';

export const TicketQrOverlay = ({
  isOpen,
  onClose,
  onBackToPayment,
  onAddToCalendar,
  onScrollNext,
  showScrollExplore = false,
  attendeeName = 'Kavindu Perera',
  ticketId = 'LN2026-0001-1',
  tickets = [],
  eventName: eventNameProp,
  eventDescription: eventDescriptionProp,
  eventDate: eventDateProp,
  eventTime: eventTimeProp,
  eventVenue: eventVenueProp,
  theme = 'corporate',
  bookingData = null,
  paymentReference: paymentRefProp,
  bookingDateTime: bookingDateProp,
  paymentMethod: paymentMethodProp,
  fields = {},
  embedded = false,
}) => {
  const isParty = theme === 'party';

  const eventName =
    fields?.ticketEventTitle ||
    eventNameProp ||
    (isParty ? 'Annual Gala Night 2026' : 'Auto Test Event 06');

  const eventSubtitle =
    fields?.ticketSubtitle ||
    eventDescriptionProp ||
    (isParty
      ? 'CELEBRATION. ELEGANCE. MEMORIES'
      : 'AN EVENING CELEBRATION, NETWORKING, & ENTERTAINMENT.');

  const orgName =
    fields?.ticketOrgName ||
    (isParty ? 'GALA' : 'NEXORA');

  const qrLabel =
    fields?.ticketQrLabel ||
    'Scan at Check-In';

  const bannerNotice =
    fields?.ticketBannerNotice ||
    'THIS IS AN E-TICKET – Present this ticket at event check-in.';

  const downloadBtnText =
    fields?.ticketDownloadButtonText ||
    'Download Ticket';

  const termsTitle =
    fields?.ticketTermsTitle ||
    'EVENT TERMS & CONDITIONS';

  const termsPoints = React.useMemo(() => {
    if (fields?.ticketTermsText && typeof fields.ticketTermsText === 'string') {
      const lines = fields.ticketTermsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length > 0) return lines;
    }
    return [
      `This ticket is valid only for the ${eventName}.`,
      'Please present this e-ticket (digital or printed) at the event check-in counter.',
      'Each ticket admits one person as per the quantity purchased.',
      'Tickets are non-transferable and non-refundable, except in case of event cancellation.',
      'The organizer reserves the right to refuse entry for invalid or duplicated tickets.',
      'Please follow the event guidelines and instructions from the event staff.',
    ];
  }, [fields?.ticketTermsText, eventName]);

  // Format date to match screenshot 2: e.g. "12 November 2026"
  const formattedDate = React.useMemo(() => {
    let dateStr = fields?.ticketDateLabel || eventDateProp || '12 November 2026';
    dateStr = dateStr.replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*/i, '');
    return dateStr;
  }, [fields?.ticketDateLabel, eventDateProp]);

  const formattedTime = fields?.ticketTimeLabel || eventTimeProp || '6:00 PM Onwards';

  // Venue & City
  const { venueName, venueCity } = React.useMemo(() => {
    if (fields?.ticketVenueName) {
      return {
        venueName: fields.ticketVenueName,
        venueCity: fields.ticketVenueCity || 'Colombo',
      };
    }
    const raw = eventVenueProp || 'Colombo Grand Ballroom, Colombo';
    if (raw.toLowerCase().includes('cinnamon lakeside')) {
      return {
        venueName: 'Cinnamon Lakeside',
        venueCity: 'Colombo',
      };
    }
    const parts = raw.split(',');
    if (parts.length > 1) {
      return {
        venueName: parts[0].trim(),
        venueCity: parts.slice(1).join(', ').trim(),
      };
    }
    return {
      venueName: raw,
      venueCity: 'Colombo',
    };
  }, [fields?.ticketVenueName, fields?.ticketVenueCity, eventVenueProp]);

  // Payment details
  const paymentReference =
    paymentRefProp ||
    bookingData?.paymentRef ||
    bookingData?.paymentReference ||
    bookingData?.bookingRef ||
    'LN2026-0001';

  const bookingDateTime =
    bookingDateProp ||
    bookingData?.bookingDate ||
    bookingData?.createdAt ||
    '21 Oct 2026, 03:14 PM';

  const paymentMethod =
    paymentMethodProp ||
    bookingData?.paymentMethod ||
    'Google Pay';

  const [toastMessage, setToastMessage] = useState(null);
  const [downloadingTicketId, setDownloadingTicketId] = useState(null);
  const scrollContainerRef = useRef(null);
  const ticketRefs = useRef({});

  // Build the list of tickets to display when scrolling down
  const ticketsList = React.useMemo(() => {
    if (Array.isArray(tickets) && tickets.length > 0) {
      return tickets.map((t, idx) => {
        const id = t.id || `${ticketId}-${idx + 1}`;
        const rawName = fields?.ticketCategory || t.typeName || t.name || 'VIP';
        const cleanCategory = rawName.toUpperCase().replace(/\s*TICKET\s*/i, '').trim();
        return {
          id,
          name: t.name || cleanCategory,
          typeName: cleanCategory,
          price: fields?.ticketPrice
            ? Number(String(fields.ticketPrice).replace(/[^0-9.]/g, ''))
            : (t.price || 2000),
          quantity: t.quantity || 1,
          seatNo: fields?.ticketSeatLabel || t.seatNo || 'GENERAL ADMISSION',
          attendeeName: t.attendeeName || bookingData?.fullName || attendeeName,
        };
      });
    }

    if (bookingData?.individualTickets && bookingData.individualTickets.length > 0) {
      return bookingData.individualTickets.map((t, idx) => {
        const id = t.id || `${ticketId}-${idx + 1}`;
        const rawName = fields?.ticketCategory || t.typeName || t.name || 'VIP';
        const cleanCategory = rawName.toUpperCase().replace(/\s*TICKET\s*/i, '').trim();
        return {
          id,
          name: t.name || cleanCategory,
          typeName: cleanCategory,
          price: fields?.ticketPrice
            ? Number(String(fields.ticketPrice).replace(/[^0-9.]/g, ''))
            : (t.price || 2000),
          quantity: 1,
          seatNo: fields?.ticketSeatLabel || t.seatNo || 'GENERAL ADMISSION',
          attendeeName: t.attendeeName || bookingData?.fullName || attendeeName,
        };
      });
    }

    // Default to the 1 ticket shown in Screenshot 2
    return [
      {
        id: ticketId || 'LN2026-0001-1',
        typeName: (fields?.ticketCategory || 'VIP').toUpperCase(),
        name: fields?.ticketCategory || 'VIP',
        price: fields?.ticketPrice
          ? Number(String(fields.ticketPrice).replace(/[^0-9.]/g, ''))
          : 2000,
        quantity: 1,
        seatNo: fields?.ticketSeatLabel || 'GENERAL ADMISSION',
        attendeeName: attendeeName || 'Kavindu Perera',
      },
    ];
  }, [
    tickets,
    ticketId,
    bookingData,
    fields?.ticketCategory,
    fields?.ticketPrice,
    fields?.ticketSeatLabel,
    attendeeName,
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Download crisp PDF replica for an individual ticket (captures the full page as in Screenshot 2)
  const handleDownloadTicket = async (t) => {
    if (downloadingTicketId) return;
    setDownloadingTicketId(t.id);
    showToast(`Generating PDF for Ticket ${t.id}...`);

    try {
      const ticketEl = ticketRefs.current[t.id];
      if (!ticketEl) {
        throw new Error('Ticket element not found');
      }

      // Temporarily hide download button so it does not appear inside the downloaded PDF
      const btnEl = ticketEl.querySelector('[data-pdf-ignore="true"]');
      const originalDisplay = btnEl ? btnEl.style.display : null;
      if (btnEl) btnEl.style.display = 'none';

      let imgData;
      let elementHeight = 844;
      try {
        const htmlToImage = await import('html-to-image');
        elementHeight = ticketEl.offsetHeight || 844;
        imgData = await htmlToImage.toPng(ticketEl, {
          pixelRatio: 2,
          backgroundColor: '#020A24',
          cacheBust: true,
          filter: (node) => {
            if (node && node.nodeType === 1) {
              if (node.getAttribute('data-pdf-ignore') === 'true') {
                return false;
              }
            }
            return true;
          },
        });
      } finally {
        if (btnEl) btnEl.style.display = originalDisplay;
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [390, elementHeight],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 390, elementHeight, undefined, 'FAST');
      pdf.save(`Ticket-${t.id.replace(/\s+/g, '_')}.pdf`);
      showToast(`Downloaded Ticket-${t.id}.pdf`);
    } catch (err) {
      console.warn('html-to-image capture issue, using vector PDF fallback:', err);
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [105, 148],
        });
        doc.setFillColor(3, 18, 53);
        doc.rect(0, 0, 105, 24, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(isParty ? 'GALA NIGHT 2026' : 'ANNUAL BUSINESS SUMMIT 2026', 52.5, 11, { align: 'center' });
        doc.setFontSize(7.5);
        doc.text(eventSubtitle, 52.5, 17, { align: 'center' });

        doc.setTextColor(8, 4, 128);
        doc.setFontSize(11);
        doc.text(`TICKET ID: ${t.id}`, 52.5, 34, { align: 'center' });
        doc.setFontSize(8.5);
        doc.text(`ATTENDEE: ${t.attendeeName || attendeeName}`, 52.5, 39, { align: 'center' });
        doc.setFontSize(8);
        doc.text(`${formattedDate} • ${formattedTime}`, 52.5, 45, { align: 'center' });
        doc.text(`${venueName}, ${venueCity}`, 52.5, 50, { align: 'center' });
        doc.text(`CATEGORY: ${t.typeName}  |  QTY: ${t.quantity}`, 52.5, 56, { align: 'center' });
        doc.text(`PRICE: LKR ${Number(t.price).toLocaleString('en-US')}`, 52.5, 62, { align: 'center' });
        doc.text(`SEAT: ${t.seatNo}`, 52.5, 68, { align: 'center' });

        doc.setDrawColor(168, 199, 235);
        doc.roundedRect(12, 75, 81, 26, 3, 3, 'S');
        doc.setFontSize(7.5);
        doc.setTextColor(8, 4, 128);
        doc.text('Payment Reference:', 16, 82);
        doc.text('Booking Date:', 16, 88);
        doc.text('Payment Method:', 16, 94);
        doc.setTextColor(90, 105, 130);
        doc.text(paymentReference, 89, 82, { align: 'right' });
        doc.text(bookingDateTime, 89, 88, { align: 'right' });
        doc.text(paymentMethod, 89, 94, { align: 'right' });

        doc.setFillColor(153, 27, 27);
        doc.rect(0, 106, 105, 9, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.text('THIS IS AN E-TICKET – Present this ticket at event check-in.', 52.5, 112, { align: 'center' });

        doc.save(`Ticket-${t.id.replace(/\s+/g, '_')}.pdf`);
        showToast(`Downloaded Ticket-${t.id}.pdf`);
      } catch (fallbackErr) {
        showToast(`Download failed: ${fallbackErr.message}`);
      }
    } finally {
      setDownloadingTicketId(null);
    }
  };

  // Download all tickets sequentially
  const handleDownloadAllTickets = async () => {
    for (const t of ticketsList) {
      await handleDownloadTicket(t);
    }
  };

  // Back navigation to Payment Success page
  const handleBackToPaymentSuccess = () => {
    if (typeof onBackToPayment === 'function') {
      onBackToPayment();
      return;
    }
    if (typeof onClose === 'function') {
      onClose();
      return;
    }
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState(null, '', '#payment-success');
        window.dispatchEvent(new PopStateEvent('popstate'));
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } catch (e) {
        window.location.hash = '#payment-success';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="ticket-qr-view"
      role="dialog"
      aria-modal="true"
      aria-label="Event Ticket and QR Code"
      className={
        embedded
          ? "relative w-[390px] min-h-[844px] overflow-hidden select-none"
          : "absolute top-0 left-0 w-[390px] h-[844px] rounded-[26px] overflow-hidden z-[120] shadow-card select-none animate-in fade-in zoom-in-95 duration-300"
      }
      style={{
        background: '#021235',
      }}
    >
      {/* Top-Left Floating Back Button to Payment Success Page */}
      {!embedded && (
        <button
          type="button"
          id="ticket-back-btn"
          data-pdf-ignore="true"
          onClick={handleBackToPaymentSuccess}
          aria-label="Back to payment success"
          className="absolute top-[14px] left-[12px] w-[34px] h-[34px] flex items-center justify-center rounded-full bg-white/25 hover:bg-white/40 active:scale-90 text-white transition-all cursor-pointer z-[150] p-0 shadow-lg backdrop-blur-md border border-white/25"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
      )}

      {/* Scrollable Container for ALL tickets when scrolling down */}
      <div
        ref={scrollContainerRef}
        className={
          embedded
            ? "w-[390px] overflow-visible relative"
            : "w-[390px] h-[844px] overflow-y-auto overflow-x-hidden relative"
        }
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#3B82F6 #021235',
        }}
      >

        {/* =========================================================================
            EACH TICKET IN ITS COMPLETE FORM (ONE AFTER ONE TO SCROLL DOWN)
            ========================================================================= */}
        <div className="w-[390px] flex flex-col items-center">
          {ticketsList.map((ticket, index) => {
            const ticketKey = ticket.id;

            return (
              <article
                key={ticketKey}
                ref={(el) => {
                  ticketRefs.current[ticketKey] = el;
                }}
                data-ticket-id={ticket.id}
                className="w-[390px] min-h-[844px] flex flex-col justify-between relative overflow-hidden bg-[#020A24] mb-3 shadow-2xl"
                style={{
                  background:
                    'linear-gradient(180deg, #021235 0%, #03215C 16%, #D4E8FC 26%, #EEF6FD 45%, #F6FAFE 60%, #E1EDF9 74%, #020A24 82%, #020A24 100%)',
                }}
              >
                {/* 1. HEADER SECTION (Wave + Logo + Title + Subtitle) */}
                <header className="relative w-[390px] pt-4 pb-6 px-4 overflow-hidden text-center shrink-0">
                  {/* Deep Blue Header Wave & Glow Background */}
                  <div
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{
                      background:
                        'linear-gradient(180deg, #021235 0%, #03215C 40%, #08378A 70%, #1A5BBF 88%, #D4E8FC 100%)',
                    }}
                    aria-hidden="true"
                  />

                  {/* Top Decorative Blue Wave swooshes */}
                  <img
                    src={
                      isParty
                        ? '/assets/events/parties/templates/template-1/chrome/ticket-page/upper background.webp'
                        : '/assets/events/corporate-events/templates/template-1/chrome/ticket-page/upper background.webp'
                    }
                    alt=""
                    className="absolute top-0 left-0 w-[390px] h-[140px] object-cover pointer-events-none opacity-70 z-[1]"
                    width={390}
                    height={140}
                    aria-hidden="true"
                  />

                  {/* Wed Flow Logo at Top Left */}
                  <div className={`relative z-10 flex items-center gap-2 ${embedded ? 'pl-4' : 'pl-[46px]'} pt-0.5 mb-2.5 text-left`}>
                    <div className="w-[22px] h-[22px] relative shrink-0 flex items-center justify-center">
                      <img
                        src="/wedflow-logo.png"
                        alt="Wed Flow"
                        className="w-full h-full object-contain block drop-shadow-sm"
                        width={22}
                        height={22}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-serif font-bold text-[14px] leading-none text-white tracking-wide">
                        Wed Flow
                      </span>
                      <span className="font-sans text-[7.5px] leading-tight text-white/80 mt-0.5 tracking-normal">
                        Events. People. Possibilities
                      </span>
                    </div>
                  </div>

                  {/* Event Title (Auto Test Event 06 / Annual Business Summit 2026) */}
                  <div className="relative z-10 mt-1">
                    <h1
                      className="font-serif font-bold text-[20px] leading-[25px] text-white tracking-wide m-0"
                      style={{
                        fontFamily: "'Playfair Display', 'Petrona', 'Georgia', serif",
                        textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                      }}
                    >
                      {eventName}
                    </h1>
                  </div>

                  {/* Subtitle with Left and Right Lines (AN EVENING CELEBRATION, NETWORKING, & ENTERTAINMENT.) */}
                  <div className="relative z-10 flex items-center justify-center gap-2.5 mt-2 px-6">
                    <div className="h-[1px] flex-1 bg-white/40" />
                    <span className="text-white text-[9px] font-semibold tracking-[0.16em] uppercase whitespace-nowrap">
                      {eventSubtitle}
                    </span>
                    <div className="h-[1px] flex-1 bg-white/40" />
                  </div>
                </header>

                {/* 2. BODY CONTENT (Hero + Info Badges + Table + Payment Details + Download Ticket button) */}
                <div className="w-[390px] flex flex-col items-center px-5 pt-1 pb-3 shrink-0">
                  {/* Hero Section: Left Building Photo + Right QR Code Card */}
                  <div className="w-[342px] flex items-center justify-between gap-3 mt-1">
                    {/* Left: Building Card with glowing blue border & NEXORA logo */}
                    <div
                      className="relative w-[164px] h-[164px] rounded-[18px] overflow-hidden border-2 border-[#1E60D4] shadow-[0_4px_16px_rgba(2,18,43,0.18)] shrink-0 bg-slate-900"
                      style={{
                        backgroundImage: fields?.ticketHeroImage
                          ? `url('${fields.ticketHeroImage.startsWith('http') || fields.ticketHeroImage.startsWith('/') ? fields.ticketHeroImage : `/api/resources/images/${encodeURIComponent(fields.ticketHeroImage)}`}')`
                          : (isParty
                              ? "url('/assets/events/parties/templates/template-1/chrome/landing-page/background.webp')"
                              : "url('/assets/events/corporate-events/templates/template-1/chrome/landing/landing page background.webp')"),
                        backgroundPosition: 'center 86%',
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      {/* Dark gradient overlay for contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />

                      {/* NEXORA / Org Logo Overlaid (Upper Center) */}
                      <div className="absolute top-4 left-0 w-full flex flex-col items-center justify-center text-center select-none z-10 pointer-events-none">
                        <img
                          src={
                            isParty
                              ? '/assets/events/parties/templates/template-1/chrome/ticket-page/organization logo.webp'
                              : '/assets/events/corporate-events/templates/template-1/chrome/landing/ChatGPT Image Sep 17, 2026, 12_07_42 AM.webp'
                          }
                          alt="Org Icon"
                          className="w-[32px] h-[32px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                          width={32}
                          height={32}
                        />
                        <span className="font-sans font-semibold text-[11px] leading-tight text-white tracking-[0.25em] uppercase mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                          {orgName}
                        </span>
                      </div>
                    </div>

                    {/* Right: Clean White Card with QR Code and "Scan at Check-In" */}
                    <div className="w-[164px] h-[164px] rounded-[18px] bg-white border border-[#CBD5E1]/60 shadow-[0_4px_16px_rgba(2,18,43,0.08)] flex flex-col items-center justify-center p-2 shrink-0">
                      <div className="w-[114px] h-[114px] flex items-center justify-center bg-white p-1">
                        <TicketQrImage
                          guestName={
                            ticket.guestName ||
                            ticket.attendeeName ||
                            bookingData?.fullName ||
                            attendeeName
                          }
                          tierName={ticket.typeName || ticket.name}
                          ticketCode={ticket.ticketCode || ticket.id}
                          qrText={ticket.qrText}
                          alt={`QR Code for ${ticket.ticketCode || ticket.id}`}
                          className="w-full h-full object-contain block"
                          size={110}
                        />
                      </div>
                      <span className="text-[#64748B] font-sans font-medium text-[11px] leading-tight mt-1 text-center">
                        {qrLabel}
                      </span>
                    </div>
                  </div>

                  {/* Three Columns Info Badges (Date | Venue | Ticket ID) */}
                  <div className="w-[342px] grid grid-cols-3 items-start divide-x divide-[#CBD5E1] mt-5 py-1">
                    {/* Column 1: Date */}
                    <div className="flex flex-col items-center text-center px-1">
                      <div className="w-[38px] h-[38px] rounded-full bg-[#DCEBFC] flex items-center justify-center mb-1.5 text-[#080480] shadow-sm shrink-0">
                        <svg
                          className="w-[18px] h-[18px] text-[#080480]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <span className="font-sans font-bold text-[11px] leading-tight text-[#080480]">
                        {formattedDate}
                      </span>
                      <span className="font-sans text-[10px] leading-tight text-[#080480] mt-0.5 whitespace-nowrap">
                        {formattedTime}
                      </span>
                    </div>

                    {/* Column 2: Venue */}
                    <div className="flex flex-col items-center text-center px-1">
                      <div className="w-[38px] h-[38px] rounded-full bg-[#DCEBFC] flex items-center justify-center mb-1.5 text-[#080480] shadow-sm shrink-0">
                        <svg
                          className="w-[18px] h-[18px] text-[#080480]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <span className="font-sans font-bold text-[9.5px] leading-[13px] text-[#080480] break-words max-w-[105px] text-center">
                        {venueName}
                      </span>
                      {venueCity && (
                        <span className="font-sans text-[9px] leading-tight text-[#080480] mt-0.5 max-w-[105px] break-words text-center">
                          {venueCity}
                        </span>
                      )}
                    </div>

                    {/* Column 3: Ticket ID */}
                    <div className="flex flex-col items-center text-center px-1">
                      <div className="w-[38px] h-[38px] rounded-full bg-[#DCEBFC] flex items-center justify-center mb-1.5 text-[#080480] shadow-sm shrink-0">
                        <svg
                          className="w-[18px] h-[18px] text-[#080480]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
                          <line x1="9" y1="12" x2="15" y2="12" />
                        </svg>
                      </div>
                      <span className="font-sans font-bold text-[11px] leading-tight text-[#080480]">
                        Ticket ID
                      </span>
                      <span
                        className="font-sans font-medium text-[9.5px] leading-snug text-[#080480] mt-0.5 tracking-tight w-full break-all"
                        title={String(ticket.ticketCode || ticket.id || "")}
                      >
                        {ticket.ticketCode || ticket.id}
                      </span>
                    </div>
                  </div>

                  {/* Ticket Table / Summary Box: QTY | CATEGORY | PRICE | SEAT NO(S) */}
                  <div className="w-[342px] rounded-[10px] overflow-hidden border border-[#BED5EE] bg-[#E1EDF9] shadow-sm mt-4">
                    {/* Table Header Row */}
                    <div className="grid grid-cols-4 bg-[#D4E4F6] text-[#556987] font-sans font-bold text-[10px] py-2 text-center divide-x divide-[#BED5EE]">
                      <div>QTY</div>
                      <div>CATEGORY</div>
                      <div>PRICE</div>
                      <div>SEAT NO(S)</div>
                    </div>

                    {/* Table Data Row */}
                    <div className="grid grid-cols-4 bg-[#E1EDF9] py-2.5 text-center items-center divide-x divide-[#CFE1F5]">
                      <div className="font-sans font-bold text-[12px] text-[#080480]">
                        {ticket.quantity || 1}
                      </div>
                      <div className="font-sans font-bold text-[11px] text-[#080480] uppercase">
                        {ticket.typeName}
                      </div>
                      <div className="font-sans font-bold text-[11px] text-[#080480]">
                        LKR {Number(ticket.price).toLocaleString('en-US')}
                      </div>
                      <div className="font-sans font-semibold text-[9.5px] leading-tight text-[#334668] uppercase px-1">
                        {ticket.seatNo}
                      </div>
                    </div>
                  </div>

                  {/* Payment Details Card (Under table for each ticket) */}
                  <div className="w-[342px] rounded-[16px] border border-[#A8C7EC] bg-white/75 backdrop-blur-sm p-4 space-y-2 mt-4 shadow-sm">
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="font-sans font-bold text-[#080480]">Attendee</span>
                      <span className="font-sans font-semibold text-[#080480]">
                        {ticket.attendeeName || attendeeName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="font-sans font-bold text-[#080480]">Payment Reference</span>
                      <span className="font-sans font-normal text-[#556987] tracking-wide">
                        {paymentReference}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="font-sans font-bold text-[#080480]">Booking Date &amp; Time</span>
                      <span className="font-sans font-normal text-[#556987]">
                        {bookingDateTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="font-sans font-bold text-[#080480]">Payment Method</span>
                      <span className="font-sans font-normal text-[#556987]">
                        {paymentMethod}
                      </span>
                    </div>
                  </div>

                  {/* Download Ticket Button (Excluded from exported PDF) */}
                  <button
                    type="button"
                    id={`ticket-download-btn-${ticket.id}`}
                    data-pdf-ignore="true"
                    onClick={() => handleDownloadTicket(ticket)}
                    disabled={Boolean(downloadingTicketId)}
                    className="w-[342px] h-[46px] bg-[#080480] hover:bg-[#060368] active:scale-[0.99] text-white rounded-[14px] flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(8,4,128,0.28)] transition-all cursor-pointer mt-4 disabled:opacity-50"
                    style={{ backgroundColor: '#080480', color: '#ffffff' }}
                  >
                    <svg
                      className="w-4 h-4 text-white shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span className="font-sans font-bold text-[14.5px] text-white tracking-wide">
                      {downloadingTicketId === ticket.id
                        ? 'Generating PDF...'
                        : downloadBtnText}
                    </span>
                  </button>
                </div>

                {/* 3. RED E-TICKET BANNER (Included in each ticket page) */}
                <div className="w-[390px] bg-[#991B1B] text-white py-2.5 px-4 flex items-center shadow-md shrink-0">
                  <div className="pr-3 border-r border-white/40 flex items-center justify-center shrink-0">
                    <svg
                      className="w-[18px] h-[18px] text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <circle cx="2" cy="12" r="2" fill="#991B1B" />
                      <circle cx="22" cy="12" r="2" fill="#991B1B" />
                      <line x1="9" y1="10" x2="15" y2="10" />
                      <line x1="9" y1="14" x2="15" y2="14" />
                    </svg>
                  </div>
                  <div className="font-sans font-bold text-[10.5px] leading-tight tracking-wide text-white pl-3">
                    {bannerNotice}
                  </div>
                </div>

                {/* 4. EVENT TERMS & CONDITIONS + FOOTER (Included in each ticket page) */}
                <footer className="w-[390px] bg-[#020A24] text-white px-5 pt-4 pb-6 shrink-0">
                  <div className="mb-3">
                    <h3 className="font-sans font-bold text-[11.5px] text-white tracking-[0.14em] uppercase m-0 p-0">
                      {termsTitle}
                    </h3>
                    <div className="w-[180px] h-[1px] bg-blue-400/60 mt-1" />
                  </div>

                  <ul className="space-y-1.5 list-none p-0 m-0 text-white/85 font-sans text-[9.5px] leading-[13.5px] text-left">
                    {termsPoints.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 mt-[4px]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Wed Flow Footer Bottom Line */}
                  <div className="border-t border-white/15 mt-4 pt-3 flex items-center justify-between text-[8px] text-white/70 font-sans">
                    <div className="flex items-center gap-1.5">
                      <img
                        src="/footer/wedflow-logo.png"
                        alt="Wed Flow"
                        className="w-3.5 h-3.5 object-contain brightness-200"
                      />
                      <div className="flex flex-col text-left">
                        <span className="font-serif font-bold text-[9.5px] text-white leading-none">
                          Wed Flow
                        </span>
                        <span className="text-[6.5px] text-white/60 leading-none mt-0.5">
                          Events. People. Possibilities
                        </span>
                      </div>
                    </div>

                    <span>Copyrights 2026 WedFlow</span>

                    <span className="cursor-pointer hover:underline">
                      Privacy Policy &nbsp;|&nbsp; Terms &amp; Conditions
                    </span>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>

        {/* Download All Tickets Button at bottom */}
        <div className="w-[342px] mx-auto my-4 flex flex-col items-center" data-pdf-ignore="true">
          <button
            type="button"
            id="ticket-download-all-btn"
            onClick={handleDownloadAllTickets}
            disabled={Boolean(downloadingTicketId)}
            className="w-full h-[46px] rounded-[12px] bg-white hover:bg-[#F8FAFC] active:scale-[0.99] border-2 border-[#080480] font-sans font-bold text-[14px] text-[#080480] flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#080480" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download All Tickets</span>
          </button>
        </div>

        {/* Global Explore Button if needed */}
        {showScrollExplore && (
          <div
            role="button"
            id="ticket-scroll-explore-btn"
            data-pdf-ignore="true"
            tabIndex={0}
            onClick={() => {
              if (typeof onScrollNext === 'function') onScrollNext();
              else if (typeof onClose === 'function') onClose();
            }}
            className="my-4 flex flex-col items-center justify-center cursor-pointer group select-none"
            aria-label="Explore invitation"
          >
            <div className="px-3.5 py-1.5 rounded-full bg-white/95 border border-[#BED5EE] shadow-sm flex items-center gap-1.5 transition-all group-hover:scale-105">
              <span className="font-sans font-bold text-[9px] text-[#080480] uppercase tracking-[0.2em]">
                Explore Invitation
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#080480" strokeWidth="2.5">
                <path d="M7 10l5 5 5-5" />
              </svg>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div
            data-pdf-ignore="true"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#080480] text-white text-xs font-semibold py-2 px-4 rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2"
          >
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketQrOverlay;
