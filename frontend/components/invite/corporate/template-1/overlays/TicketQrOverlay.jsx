'use client';

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

export const TicketQrOverlay = ({
  isOpen,
  onClose,
  onBackToPayment,
  onAddToCalendar,
  onScrollNext,
  showScrollExplore = true,
  attendeeName = 'Kavindu Perera',
  ticketId = 'LN2026-0001',
  tickets = [],
  eventName: eventNameProp,
  eventDescription: eventDescriptionProp,
  eventDate: eventDateProp,
  eventTime: eventTimeProp,
  eventVenue: eventVenueProp,
  theme = 'corporate',
}) => {
  const isParty = theme === 'party';

  const eventName =
    eventNameProp ||
    (isParty ? 'Annual Gala Night 2026' : 'Annual Business Summit – 2026');

  const eventDescription =
    eventDescriptionProp || 'An evening celebration, networking, & entertainment.';

  const eventDate = isParty
    ? (eventDateProp && eventDateProp.includes('November') ? eventDateProp : 'Thursday, 12 November 2026')
    : (eventDateProp || 'Thursday, 12 November 2026');

  const eventTime = isParty
    ? (eventTimeProp && eventTimeProp.includes('Onwards') ? eventTimeProp : '6.00 PM Onwards')
    : (eventTimeProp || '6.00 PM Onwards');

  const eventVenue = eventVenueProp || 'Cinnamon Lakeside Colombo';

  const [toastMessage, setToastMessage] = useState(null);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = React.useRef(null);

  // Build the list of tickets to display one by one
  const ticketsList = React.useMemo(() => {
    if (Array.isArray(tickets) && tickets.length > 0) {
      return tickets;
    }
    // Default fallback to 3 individual tickets with unique sequential IDs
    return [
      { id: `${ticketId}-1`, typeName: 'Standard Ticket', price: 1000 },
      { id: `${ticketId}-2`, typeName: 'Standard Ticket', price: 1000 },
      { id: `${ticketId}-3`, typeName: 'Standard Ticket', price: 1000 },
    ];
  }, [tickets, ticketId]);

  const activeTicket = ticketsList[currentTicketIndex] || ticketsList[0] || {
    id: `${ticketId}-1`,
    typeName: 'Standard Ticket',
    price: 1000,
  };
  const activeTicketId = activeTicket.id || `${ticketId}-${currentTicketIndex + 1}`;
  const activeTicketType = activeTicket.typeName || activeTicket.name || 'Standard Ticket';
  const activeTicketPrice = activeTicket.price
    ? `LKR ${Number(activeTicket.price).toLocaleString('en-US')}`
    : 'LKR 1,000';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handlePrevTicket = () => {
    if (ticketsList.length > 1) {
      setCurrentTicketIndex((prev) => (prev - 1 + ticketsList.length) % ticketsList.length);
    }
  };

  const handleNextTicket = () => {
    if (ticketsList.length > 1) {
      setCurrentTicketIndex((prev) => (prev + 1) % ticketsList.length);
    }
  };

  const handleScrollExplore = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof onScrollNext === 'function') {
      onScrollNext();
    } else if (typeof onClose === 'function') {
      onClose();
    }
  };

  // Download exact visual replica of this ticket page as a crisp PDF
  const handleDownloadTicket = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    showToast(`Generating exact PDF for Ticket ${activeTicketId}...`);

    try {
      const ticketEl = ticketRef.current;
      if (!ticketEl) {
        throw new Error('Ticket container not found');
      }

      // Render ticket element directly to high-res PNG using html-to-image (full Tailwind v4 / oklab support)
      const htmlToImage = await import('html-to-image');
      const imgData = await htmlToImage.toPng(ticketEl, {
        pixelRatio: 2,
        backgroundColor: '#02122B',
        filter: (element) => {
          return element?.getAttribute ? element.getAttribute('data-pdf-ignore') !== 'true' : true;
        },
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [390, 844],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 390, 844, undefined, 'FAST');
      pdf.save(`Ticket-${activeTicketId}.pdf`);
      showToast(`Downloaded Ticket-${activeTicketId}.pdf`);
    } catch (err) {
      console.warn('html-to-image capture issue, using vector PDF fallback:', err);
      // Fallback vector generation if DOM capture encounters an unexpected browser error
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [105, 148],
        });
        doc.setFillColor(8, 4, 128);
        doc.rect(0, 0, 105, 24, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(isParty ? 'GALA NIGHT' : 'NEXORA', 52.5, 12, { align: 'center' });
        doc.setFontSize(8);
        doc.text('OFFICIAL EVENT TICKET', 52.5, 18, { align: 'center' });
        doc.setTextColor(8, 4, 128);
        doc.setFontSize(11);
        doc.text(eventName, 52.5, 32, { align: 'center' });
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(7.5);
        doc.text(eventDescription, 52.5, 37, { align: 'center' });
        doc.setTextColor(8, 4, 128);
        doc.setFontSize(12);
        doc.text(attendeeName, 52.5, 50, { align: 'center' });
        doc.setFontSize(9);
        doc.text(activeTicketId, 52.5, 56, { align: 'center' });
        doc.save(`Ticket-${activeTicketId}.pdf`);
        showToast(`Downloaded Ticket-${activeTicketId}.pdf`);
      } catch (fallbackErr) {
        showToast(`Download failed: ${fallbackErr.message}`);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={ticketRef}
      id="ticket-qr-view"
      role="dialog"
      aria-modal="true"
      aria-label="Event Ticket and QR Code"
      className="absolute top-0 left-0 w-[390px] h-[844px] rounded-[26px] overflow-hidden z-[120] shadow-card bg-ticket-grad select-none animate-in fade-in zoom-in-95 duration-300"
      style={{
        '--corp-text-primary': '#080480',
        '--corp-text-highlight': '#0084FF',
      }}
    >
      <div className="relative w-[390px] h-[844px] mx-auto select-none overflow-hidden">
        {/* Full backdrop gradient & sky glow */}
        {isParty ? (
          <div
            className="absolute inset-0 w-[390px] h-[844px] pointer-events-none z-0"
            style={{
              background:
                'linear-gradient(180deg, #02122B 0%, #062254 18%, #D4E8FC 30%, #F0F6FD 65%, #CEE4FB 100%)',
            }}
            aria-hidden="true"
          />
        ) : (
          <img
            src="/assets/events/corporate-events/templates/template-1/chrome/ticket-page/background full.webp"
            alt=""
            className="absolute inset-0 w-[390px] h-[844px] object-cover pointer-events-none z-0"
            width={390}
            height={844}
            aria-hidden="true"
          />
        )}

        {/* Bottom Background Art: Corporate Skyline or Party Foliage & Wave */}
        {isParty ? (
          <>
            {/* Party Bottom Wave Background */}
            <div
              className="absolute bottom-0 left-0 w-[390px] h-[155px] pointer-events-none z-[1] overflow-hidden"
              aria-hidden="true"
            >
              <img
                src="/assets/events/parties/templates/template-1/chrome/ticketing-page/bottom-background.webp"
                alt=""
                className="w-[390px] h-[155px] object-cover object-bottom block"
                width={390}
                height={155}
              />
            </div>

            {/* Party Bottom Foliage framing bottom-left and bottom-right corners */}
            <div
              className="absolute bottom-0 left-0 w-[390px] h-[175px] pointer-events-none z-[2] overflow-hidden"
              aria-hidden="true"
            >
              <img
                src="/assets/events/parties/templates/template-1/chrome/ticketing-page/bottom-bg.webp"
                alt=""
                className="w-[390px] h-[175px] object-cover object-top block"
                style={{ transform: 'rotate(180deg)' }}
                width={390}
                height={175}
              />
            </div>
          </>
        ) : (
          /* Bottom City Skyline Art (Corporate) */
          <img
            src="/assets/events/corporate-events/templates/template-1/chrome/ticket-page/bottom background.webp"
            alt=""
            className="absolute bottom-0 left-0 w-[390px] h-[156px] object-cover object-bottom pointer-events-none z-[1]"
            width={390}
            height={156}
            aria-hidden="true"
          />
        )}

        {/* Upper Wave Art */}
        <img
          src="/assets/events/corporate-events/templates/template-1/chrome/ticket-page/upper background.webp"
          alt=""
          className="absolute top-0 left-0 w-[390px] h-[161px] object-cover pointer-events-none z-[2]"
          width={390}
          height={161}
          aria-hidden="true"
        />

        {/* Back Button in Top-Left Corner */}
        <button
          type="button"
          id="ticket-back-btn"
          onClick={onBackToPayment || onClose}
          aria-label="Back"
          className="absolute top-[20px] left-[20px] w-9 h-9 flex items-center justify-center text-white hover:opacity-75 active:scale-95 transition-all cursor-pointer z-[25] p-0"
        >
          <svg
            width="24"
            height="24"
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

        {/* Top Header Event Title / Logo */}
        {isParty ? (
          <div className="absolute top-[24px] left-0 w-[390px] flex flex-col items-center justify-center text-center z-[10] select-none pointer-events-none">
            <span
              className="font-serif italic font-normal text-[34px] leading-[38px] text-[#F3C465] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] tracking-wide"
              style={{ fontFamily: "'Playfair Display', 'Petrona', 'Georgia', serif" }}
            >
              Annual
            </span>
            <span className="font-jakarta font-bold text-[19px] leading-[23px] text-white tracking-[0.24em] uppercase mt-[1px]">
              GALA NIGHT
            </span>
          </div>
        ) : (
          <>
            {/* Organization Logo */}
            <img
              src="/assets/events/corporate-events/templates/template-1/chrome/ticket-page/organization logo.webp"
              alt="Organization Logo"
              className="absolute top-[20px] left-[168px] w-[54px] h-[54px] object-contain pointer-events-none z-[10]"
              width={54}
              height={54}
            />

            {/* Text 'NEXORA' */}
            <div
              className="absolute top-[76px] left-[130px] w-[127.4px] h-[28px] flex items-center justify-center text-center font-petrona font-normal text-[22px] leading-[28px] text-white tracking-[0.28em] z-[10] select-none"
            >
              NEXORA
            </div>
          </>
        )}

        {/* White Rounded Ticket Card Container */}
        <div
          className="absolute top-[120px] left-[35px] w-[320px] h-[516px] bg-[#EEF4FB] rounded-[20px] shadow-[0_12px_36px_rgba(2,18,43,0.12)] border border-white/70 z-[3]"
          aria-hidden="true"
        />

        {/* Event Title and Small Event Description */}
        <div className="absolute top-[128px] left-[38px] w-[314px] flex flex-col items-center justify-center text-center z-[5] select-none px-2">
          {isParty ? (
            <h2 className="font-jakarta font-bold text-[18px] leading-[22px] text-[#080480] m-0">
              Annual Gala Night<br />2026
            </h2>
          ) : (
            <h2 className="font-jakarta font-bold text-[17px] leading-[21px] text-[#080480] m-0">
              {eventName}
            </h2>
          )}
          <p className="font-inter font-normal text-[10.5px] leading-[14px] text-[#475569] mt-[4px] m-0 max-w-[215px] text-center">
            {isParty ? (
              <>
                An evening celebration,<br />
                networking, &amp; entertainment.
              </>
            ) : (
              eventDescription
            )}
          </p>
        </div>

        {/* QR Code Image (Clean space below description) */}
        <div className="absolute top-[212px] left-[146px] w-[98px] h-[98px] z-[5] bg-white p-1 rounded-xl shadow-sm flex items-center justify-center">
          <img
            src="/assets/events/corporate-events/templates/template-1/chrome/ticket-page/QR.webp"
            alt="Event Ticket QR Code"
            className="w-full h-full object-contain block"
            width={90}
            height={90}
          />
        </div>

        {/* Attendee Name & Unique Ticket ID */}
        <div
          className="absolute top-[318px] left-[38px] w-[314px] z-[5] flex flex-col items-center justify-center text-center gap-[1px] select-none"
        >
          <span className="font-jakarta font-bold text-[17px] leading-[21px] text-[#080480]">
            {attendeeName}
          </span>
          <span className="font-inter font-semibold text-[13px] leading-[16px] text-[#475569] tracking-[0.02em]">
            {activeTicketId}
          </span>
        </div>

        {/* Event Details: Date */}
        <div className="absolute top-[360px] left-[54px] w-[282px] z-[5] flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-full bg-[#C4DEFD] flex items-center justify-center shrink-0">
            <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="#0174EF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-jakarta font-bold text-[10.5px] leading-none text-[#080480]">Date</span>
            <span className="font-inter font-normal text-[10.5px] leading-tight text-[#080480] mt-0.5">{eventDate}</span>
          </div>
        </div>

        {/* Event Details: Time */}
        <div className="absolute top-[398px] left-[54px] w-[282px] z-[5] flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-full bg-[#C4DEFD] flex items-center justify-center shrink-0">
            <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="#0174EF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-jakarta font-bold text-[10.5px] leading-none text-[#080480]">Time</span>
            <span className="font-inter font-normal text-[10.5px] leading-tight text-[#080480] mt-0.5">{eventTime}</span>
          </div>
        </div>

        {/* Event Details: Venue */}
        <div className="absolute top-[436px] left-[54px] w-[282px] z-[5] flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-full bg-[#C4DEFD] flex items-center justify-center shrink-0">
            <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="#0174EF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-jakarta font-bold text-[10.5px] leading-none text-[#080480]">Venue</span>
            <span className="font-inter font-normal text-[10.5px] leading-tight text-[#080480] mt-0.5 truncate max-w-[215px]">{eventVenue}</span>
          </div>
        </div>

        {/* Ticket Type & Price Badge Box */}
        <div className="absolute top-[476px] left-[52px] w-[286px] h-[38px] bg-[#D1E2F8] rounded-[10px] flex flex-col items-center justify-center text-center z-[5] border border-[#BFDBFE]/60">
          <span className="font-jakarta font-bold text-[12.5px] leading-tight text-[#080480]">
            {activeTicketType}
          </span>
          <span className="font-inter font-bold text-[12px] leading-tight text-[#080480]">
            {activeTicketPrice}
          </span>
        </div>

        {/* Download Ticket Button (Downloads real PDF) */}
        <button
          type="button"
          id="ticket-download-btn"
          onClick={handleDownloadTicket}
          className="absolute top-[522px] left-[52px] w-[286px] h-[38px] px-4 bg-[#080480] hover:bg-[#060368] text-white rounded-[10px] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(8,4,128,0.25)] hover:opacity-95 active:scale-[0.99] transition-all z-[6]"
          style={{ backgroundColor: '#080480', color: '#ffffff' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="font-jakarta font-bold text-[13px] text-white">
            Download Ticket
          </span>
        </button>

        {/* Navigation Buttons: Previous Ticket & Next Ticket on EVERY ticket page */}
        <div className="absolute top-[568px] left-[52px] w-[286px] flex items-center justify-between gap-2.5 z-[6]">
          <button
            type="button"
            id="prev-ticket-btn"
            onClick={handlePrevTicket}
            disabled={ticketsList.length <= 1}
            aria-label="Previous Ticket"
            className="flex-1 h-[38px] bg-white border-[1.5px] border-[#080480] text-[#080480] hover:bg-[#F1F6FE] rounded-[10px] flex items-center justify-center gap-1 font-jakarta font-bold text-[11.5px] shadow-sm transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="text-[13px] leading-none">&larr;</span>
            <span>Previous Ticket</span>
          </button>

          <button
            type="button"
            id="next-ticket-btn"
            onClick={handleNextTicket}
            disabled={ticketsList.length <= 1}
            aria-label="Next Ticket"
            className="flex-1 h-[38px] bg-white border-[1.5px] border-[#080480] text-[#080480] hover:bg-[#F1F6FE] rounded-[10px] flex items-center justify-center gap-1 font-jakarta font-bold text-[11.5px] shadow-sm transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Next Ticket</span>
            <span className="text-[13px] leading-none">&rarr;</span>
          </button>
        </div>

        {/* Ticket Counter Indicator */}
        <div className="absolute top-[612px] left-[52px] w-[286px] text-center font-inter font-semibold text-[10.5px] text-[#475569] z-[6] tracking-wide select-none">
          Ticket {currentTicketIndex + 1} of {ticketsList.length}
        </div>

        {/* Scroll to Explore / Explore Invitation Button (Clearly Visible & Prominently Styled) */}
        {showScrollExplore !== false && (
          <div
            role="button"
            id="ticket-scroll-explore-btn"
            data-pdf-ignore="true"
            tabIndex={0}
            onClick={handleScrollExplore}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleScrollExplore();
              }
            }}
            className="absolute bottom-[28px] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center cursor-pointer group z-[35] select-none"
            style={{ width: '160px' }}
            aria-label={isParty ? 'Scroll down to explore' : 'Explore invitation'}
          >
            <div
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:translate-y-[2px]"
              style={{
                border: '1.5px solid rgba(8, 4, 128, 0.45)',
                background: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#080480',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.2), 0 0 12px rgba(8, 4, 128, 0.14)',
                animation: 'floatBounce 2.4s ease-in-out infinite',
              }}
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#080480"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 10l5 5 5-5" />
              </svg>
            </div>
            <div className="mt-[6px] px-3.5 py-[3px] rounded-full bg-white/95 backdrop-blur-md border border-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.18)] flex items-center justify-center transition-all group-hover:bg-white group-hover:scale-105">
              <span className="font-instrument font-bold text-[9px] leading-none text-[#080480] uppercase tracking-[0.24em] whitespace-nowrap">
                {isParty ? 'SCROLL  TO  EXPLORE' : 'EXPLORE  INVITATION'}
              </span>
            </div>
          </div>
        )}

        {/* Toast Feedback (excluded from PDF snapshot) */}
        {toastMessage && (
          <div
            data-pdf-ignore="true"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#080480] text-white font-inter text-[12.5px] font-semibold py-[10px] px-5 rounded-[20px] shadow-[0_8px_24px_rgba(8,4,128,0.35)] pointer-events-none z-30 whitespace-nowrap transition-all duration-200"
            aria-live="polite"
          >
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketQrOverlay;
