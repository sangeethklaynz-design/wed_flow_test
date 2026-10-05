'use client';

import React, { useState } from 'react';

export const TicketQrOverlay = ({
  isOpen,
  onClose,
  onBackToPayment,
  onAddToCalendar,
  attendeeName = 'Kavindu Perera',
  ticketId = 'LN2026-0001',
}) => {
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleDownloadTicket = () => {
    showToast(`Downloading Ticket ${ticketId}...`);
    // Create simple printable text or trigger download
    const ticketData = `NEXORA ANNUAL BUSINESS SUMMIT 2026\nAttendee: ${attendeeName}\nTicket ID: ${ticketId}\nDate: Thursday, 12 November 2026\nTime: 9.00 AM Onwards\nVenue: Shangri-La Hotel, Colombo`;
    const blob = new Blob([ticketData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Nexora-Ticket-${ticketId}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      id="ticket-qr-view"
      role="dialog"
      aria-modal="true"
      aria-label="Event Ticket and QR Code"
      className="absolute top-0 left-0 w-[390px] h-[844px] rounded-[26px] overflow-hidden z-[120] shadow-card bg-ticket-grad select-none animate-in fade-in zoom-in-95 duration-300"
    >
      <div className="relative w-[390px] h-[844px] mx-auto select-none">
        {/* High-fidelity full backdrop (gradient and sky glow) */}
        <img
          src="/assets/events/corporate-events/templates/template-1/chrome/ticket-page/background full.webp"
          alt=""
          className="absolute inset-0 w-[390px] h-[844px] object-cover pointer-events-none z-0"
          width={390}
          height={844}
          aria-hidden="true"
        />

        {/* Screenshot 5 (Turn 4): Bottom Background Image (W: 390, H: 155.96, X: 0, Y: 688) */}
        <img
          src="/assets/events/corporate-events/templates/template-1/chrome/ticket-page/bottom background.webp"
          alt=""
          className="absolute top-[688px] left-0 w-[390px] h-[156px] object-cover pointer-events-none z-[1]"
          width={390}
          height={156}
          aria-hidden="true"
        />

        {/* Screenshot 4 (Turn 1): Upper Part Background Image (W: 390, H: 161, X: 0, Y: 0) */}
        <img
          src="/assets/events/corporate-events/templates/template-1/chrome/ticket-page/upper background.webp"
          alt=""
          className="absolute top-0 left-0 w-[390px] h-[161px] object-cover pointer-events-none z-[2]"
          width={390}
          height={161}
          aria-hidden="true"
        />

        {/* Top Navigation Back Button (Returns to Payment Success page) */}
        <button
          type="button"
          id="ticket-back-btn"
          onClick={onBackToPayment || onClose}
          aria-label="Back to payment confirmation"
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white cursor-pointer z-[20] transition-all duration-150 hover:bg-white/35 active:scale-95 shadow-sm"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        {/* Screenshot 2 (Turn 1): Organization Logo (W: 61.39, H: 60.97, X: 163.45, Y: 25) */}
        <img
          src="/assets/events/corporate-events/templates/template-1/chrome/ticket-page/organization logo.webp"
          alt="Organization Logo"
          className="absolute top-[25px] left-[163.5px] w-[61.4px] h-[61px] object-contain pointer-events-none z-[10]"
          width={61}
          height={61}
        />

        {/* Screenshot 3 (Turn 1): Text 'NEXORA' (W: 127.42, H: 31.35, X: 130, Y: 83, Font 25px Regular) */}
        <div
          className="absolute top-[83px] left-[130px] w-[127.4px] h-[31.4px] flex items-center justify-center text-center font-petrona font-normal text-[25px] leading-[31px] text-white tracking-[0.28em] z-[10] select-none"
        >
          NEXORA
        </div>

        {/* Screenshot 3 (Turn 4): Square / Rectangle behind details (W: 305, H: 565, X: 42, Y: 154, Corner radius: 15, Fill: #E1E6ED) */}
        <div
          className="absolute top-[154px] left-[42px] w-[305px] h-[565px] bg-[#E1E6ED] rounded-[15px] shadow-[0_10px_30px_rgba(2,18,43,0.08)] z-[3]"
          aria-hidden="true"
        />

        {/* Screenshot 5 (Turn 1): QR Code Image (W: 128, H: 128, X: 130, Y: 154) */}
        <img
          src="/assets/events/corporate-events/templates/template-1/chrome/ticket-page/QR.webp"
          alt="Event Ticket QR Code"
          className="absolute top-[154px] left-[130px] w-[128px] h-[128px] object-contain block z-[5]"
          width={128}
          height={128}
        />

        {/* Screenshot 1 (Turn 2): Group 'Kavindu Perera' & 'LN2026-0001' (W: 156, H: 45, X: 126, Y: 274, Spacing: 4) */}
        <div
          className="absolute top-[274px] left-[126px] w-[156px] h-[45px] z-[5] flex flex-col items-center justify-center text-center gap-[4px] select-none"
        >
          <span className="font-jakarta font-bold text-[18px] leading-[22px] text-[var(--corp-text-primary)]">
            {attendeeName}
          </span>
          <span className="font-inter font-normal text-[14px] leading-[17px] text-[#475569] tracking-[0.02em]">
            {ticketId}
          </span>
        </div>

        {/* Screenshot 2 (Turn 2): Text 'Annual Business Summit 2026' (W: 235, H: 56, X: 78, Y: 343, Plus Jakarta Sans Bold 22px) */}
        <div
          className="absolute top-[343px] left-[78px] w-[235px] h-[56px] z-[5] flex items-center justify-center text-center font-jakarta font-bold text-[22px] leading-[28px] text-[var(--corp-text-primary)] select-none"
        >
          Annual Business<br />Summit 2026
        </div>

        {/* Screenshot 3 (Turn 2): Calendar Icon (W: 40, H: 40, X: 66, Y: 415, Fill: #C4DEFD) */}
        <div
          className="absolute top-[415px] left-[66px] w-[40px] h-[40px] z-[5] rounded-full bg-[#C4DEFD] flex items-center justify-center flex-shrink-0 shadow-sm"
        >
          <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none" stroke="#0174EF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        {/* Screenshot 1 (Turn 3): Date Details (W: 211, H: 28, X: 118, Y: 419, Spacing: 6, Fill: #080480) */}
        <div className="absolute top-[419px] left-[118px] w-[211px] h-[28px] z-[5] flex flex-col justify-between text-left select-none">
          <span className="font-jakarta font-bold text-[12px] leading-none text-[var(--corp-text-primary)]">Date</span>
          <span className="font-inter font-normal text-[11.5px] leading-none text-[var(--corp-text-primary)]">Thursday, 12 November 2026</span>
        </div>

        {/* Screenshot 4 (Turn 2): Clock Icon (W: 40, H: 40, X: 66, Y: 463, Fill: #C4DEFD) */}
        <div
          className="absolute top-[463px] left-[66px] w-[40px] h-[40px] z-[5] rounded-full bg-[#C4DEFD] flex items-center justify-center flex-shrink-0 shadow-sm"
        >
          <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none" stroke="#0174EF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        {/* Screenshot 2 (Turn 3): Time Details (W: 211, H: 29, X: 118, Y: 465, Spacing: 7, Fill: #080480) */}
        <div className="absolute top-[465px] left-[118px] w-[211px] h-[29px] z-[5] flex flex-col justify-between text-left select-none">
          <span className="font-jakarta font-bold text-[12px] leading-none text-[var(--corp-text-primary)]">Time</span>
          <span className="font-inter font-normal text-[11.5px] leading-none text-[var(--corp-text-primary)]">9.00 AM Onwards</span>
        </div>

        {/* Screenshot 5 (Turn 2): Location Icon (W: 40, H: 40, X: 66, Y: 510, Fill: #C4DEFD) */}
        <div
          className="absolute top-[510px] left-[66px] w-[40px] h-[40px] z-[5] rounded-full bg-[#C4DEFD] flex items-center justify-center flex-shrink-0 shadow-sm"
        >
          <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none" stroke="#0174EF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        {/* Screenshot 3 (Turn 3): Venue Details (W: 211, H: 28, X: 118, Y: 513, Spacing: 6, Fill: #080480) */}
        <div className="absolute top-[513px] left-[118px] w-[211px] h-[28px] z-[5] flex flex-col justify-between text-left select-none">
          <span className="font-jakarta font-bold text-[12px] leading-none text-[var(--corp-text-primary)]">Venue</span>
          <span className="font-inter font-normal text-[11.5px] leading-none text-[var(--corp-text-primary)]">Shangri-La Hotel, Colombo</span>
        </div>

        {/* Screenshot 4 & 5 (Turn 3): Download Ticket Button (W: 284.98, H: 40, X: 54, Y: 578) with Content (W: 167.93, H: 25, X: 112.01, Y: 584, Spacing: 7) */}
        <button
          type="button"
          id="ticket-download-btn"
          onClick={handleDownloadTicket}
          className="absolute top-[578px] left-[54px] w-[285px] h-[40px] px-4 bg-[var(--corp-text-primary)] text-white rounded-lg flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(8,4,128,0.25)] hover:opacity-90 hover:-translate-y-[1px] active:translate-y-[1px] transition-all duration-150 z-[6]"
        >
          <div className="w-[168px] h-[25px] flex items-center justify-center gap-[7px]">
            <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="font-inter font-semibold text-[14px] leading-none whitespace-nowrap">
              Download Ticket
            </span>
          </div>
        </button>

        {/* Screenshot 1 & 2 (Turn 4): Add to Calendar Button (W: 284.98, H: 40, X: 54, Y: 637) with Content (W: 162.84, H: 22, X: 115.07, Y: 646, Spacing: 9) */}
        <button
          type="button"
          id="ticket-add-calendar-btn"
          onClick={onAddToCalendar}
          className="absolute top-[637px] left-[54px] w-[285px] h-[40px] px-4 bg-white text-[var(--corp-text-primary)] border-[1.5px] border-[var(--corp-text-primary)] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#F1F6FE] hover:-translate-y-[1px] active:translate-y-[1px] transition-all duration-150 z-[6]"
        >
          <div className="w-[163px] h-[22px] flex items-center justify-center gap-[9px]">
            <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 25 22" fill="none" stroke="#0174EF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="3.5" width="21" height="16.5" rx="3" />
              <line x1="18" y1="1.5" x2="18" y2="5.5" />
              <line x1="7" y1="1.5" x2="7" y2="5.5" />
              <line x1="2" y1="8.5" x2="23" y2="8.5" />
            </svg>
            <span className="font-inter font-semibold text-[14px] leading-none whitespace-nowrap">
              Add to Calendar
            </span>
          </div>
        </button>

        {/* Screenshot 4 (Turn 4): Bottom Slogan Text 'See you at the event!' (W: 235, H: 29, X: 76, Y: 728, Fill: #080480) */}
        <div
          className="absolute top-[728px] left-[76px] w-[235px] h-[29px] flex items-center justify-center text-center font-caveat font-semibold text-[24px] leading-tight text-[var(--corp-text-primary)] italic z-[10] pointer-events-none drop-shadow-sm select-none"
        >
          See you at the event!
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[var(--corp-text-primary)] text-white font-instrument text-[12.5px] font-semibold py-[10px] px-5 rounded-[20px] shadow-[0_8px_24px_rgba(8,4,128,0.35)] pointer-events-none z-30 whitespace-nowrap transition-all duration-200"
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
