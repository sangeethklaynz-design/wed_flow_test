'use client';

import React, { useState } from 'react';

export const PaymentSuccessOverlay = ({
  isOpen,
  onClose,
  onBackToRsvp,
  onAddToCalendar,
  onViewTicket,
}) => {
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleViewTicket = () => {
    if (onViewTicket) {
      onViewTicket();
    } else {
      showToast('Ticket LN2026-0001 ready. Email sent!');
    }
  };

  const handleAddToCalendar = () => {
    if (onAddToCalendar) {
      onAddToCalendar();
    } else {
      const page7 = document.getElementById('page-7');
      if (page7) {
        page7.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="payment-success-view"
      role="dialog"
      aria-modal="true"
      aria-label="Payment Successful"
      className="absolute top-0 left-0 w-[390px] h-[844px] rounded-[26px] overflow-hidden z-[110] shadow-card bg-confirm-grad select-none animate-in fade-in zoom-in-95 duration-300"
    >
      <div className="relative w-[390px] h-[844px] mx-auto select-none">
        {/* Top Left Corner Back Button to RSVP Confirmation */}
        <button
          type="button"
          id="back-to-rsvp-btn"
          onClick={onBackToRsvp}
          aria-label="Back to RSVP confirmation"
          className="absolute top-[18px] left-[18px] w-[36px] h-[36px] rounded-full bg-white/85 backdrop-blur-md border border-[#BED7F5] shadow-[0_2px_8px_rgba(0,30,80,0.12)] flex items-center justify-center text-[var(--corp-text-primary)] cursor-pointer z-[20] transition-all duration-150 hover:bg-white hover:scale-105 active:scale-95"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--corp-text-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Turn 1 - Screenshot 3: Top Background (W: 390, H: 130, X: 0, Y: 0) */}
        <img
          src="/assets/events/corporate-events/templates/template-1/chrome/payment-success/top background.webp"
          alt=""
          className="absolute top-0 left-0 w-[390px] h-[130px] object-cover pointer-events-none z-[1]"
          width={390}
          height={130}
          aria-hidden="true"
        />

        {/* Turn 1 - Screenshot 2: Top Success Mark (W: 294, H: 177, X: 46, Y: 65) */}
        <div className="absolute top-[65px] left-[46px] w-[294px] h-[177px] flex items-center justify-center z-[2] animate-tick-pop-in">
          <img
            src="/assets/events/corporate-events/templates/template-1/chrome/payment-success/top success mark.webp"
            alt="Payment Success Checkmark"
            className="w-full h-full object-contain block"
            width={294}
            height={177}
          />
        </div>

        {/* Turn 1 - Screenshot 4: Text 'Payment Successful!' and 'Your registration is confimed.' (W: 377, H: 77, X: 6, Y: 263, Spacing: 0) */}
        <div className="absolute top-[263px] left-[6px] w-[377px] h-[77px] flex flex-col items-center justify-start text-center z-[2]">
          <h1 className="m-0 font-jakarta font-bold text-[32px] leading-[40px] text-[#12A832] tracking-[-0.015em]">
            Payment Successful!
          </h1>
          <p className="m-0 font-inter font-normal text-[17px] leading-[24px] text-[#6B7280] mt-[3px]">
            Your registration is confimed.
          </p>
        </div>

        {/* Turn 2 - Screenshot 1: Square behind text 'Kavindu Perera' (W: 343, H: 82, X: 21, Y: 361, Corner radius: 15) */}
        <div className="absolute top-[361px] left-[21px] w-[343px] h-[82px] bg-[#E8EEF8] rounded-[15px] flex items-center justify-center z-[2]">
          {/* Turn 1 - Screenshot 5: Text group 'Kavindu Perera' and 'LN2026-0001' (W: 201, H: 53, X: 92, Y: 376, Spacing: 3) */}
          <div className="w-[201px] h-[53px] flex flex-col items-center justify-center text-center">
            <span className="font-jakarta font-bold text-[22px] leading-[28px] text-[var(--corp-text-primary)]">
              Kavindu Perera
            </span>
            <span className="font-jakarta font-medium text-[14px] leading-[18px] text-[#475467] mt-[3px]">
              LN2026-0001
            </span>
          </div>
        </div>

        {/* Turn 2 - Screenshot 2: Text 'You will receive a confirmation email shortly.' (W: 261, H: 34, X: 64, Y: 454, Fill: #080480) */}
        <div className="absolute top-[454px] left-[64px] w-[261px] h-[34px] flex items-center justify-center text-center z-[2]">
          <p className="font-inter font-medium text-[14px] leading-[17px] text-[var(--corp-text-primary)] m-0">
            You will receive a confirmation<br />email shortly.
          </p>
        </div>

        {/* Turn 2 - Screenshot 3 & 4: Button 'View My Ticket' (W: 280, H: 40, X: 53, Y: 536, Padding: 0 16) */}
        <button
          type="button"
          id="view-my-ticket-btn"
          onClick={handleViewTicket}
          className="absolute top-[536px] left-[53px] w-[280px] h-[40px] px-4 bg-[var(--corp-text-primary)] text-white rounded-lg flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(8,4,128,0.25)] z-[3] transition-all duration-150 hover:opacity-90 hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(8,4,128,0.32)] active:translate-y-[1px]"
        >
          {/* Turn 2 - Screenshot 4: Text 'View My Ticket' (W: 119, H: 19, X: 133, Y: 546, Inter Semi Bold 16px) */}
          <span className="font-inter font-semibold text-[16px] leading-[19px] text-white">
            View My Ticket
          </span>
        </button>

        {/* Turn 2 - Screenshot 5: Button 'Add to Calendar' (W: 280, H: 40, X: 53, Y: 599, Padding: 0 16) */}
        <button
          type="button"
          id="payment-add-calendar-btn"
          onClick={handleAddToCalendar}
          className="absolute top-[599px] left-[53px] w-[280px] h-[40px] px-4 bg-white text-[var(--corp-text-primary)] border-[1.5px] border-[var(--corp-text-primary)] rounded-lg flex items-center justify-center gap-[9px] cursor-pointer z-[3] transition-all duration-150 hover:bg-[#F1F6FE] hover:-translate-y-[1px] active:translate-y-[1px]"
        >
          {/* Turn 3 - Screenshot 1: Calendar icon inside Add to Calendar button (W: 25, H: 22, X: 113, Y: 608) */}
          <svg
            className="w-[25px] h-[22px] flex-shrink-0"
            width="25"
            height="22"
            viewBox="0 0 25 22"
            fill="none"
            stroke="#0174EF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="3.5" width="21" height="16.5" rx="3" />
            <line x1="18" y1="1.5" x2="18" y2="5.5" />
            <line x1="7" y1="1.5" x2="7" y2="5.5" />
            <line x1="2" y1="8.5" x2="23" y2="8.5" />
          </svg>

          {/* Turn 3 - Screenshot 2: Text 'Add to Calendar' inside button (W: 126, H: 19, X: 147, Y: 609, Fill: #080480) */}
          <span className="font-inter font-semibold text-[16px] leading-[19px] text-[var(--corp-text-primary)]">
            Add to Calendar
          </span>
        </button>

        {/* Turn 3 - Screenshot 3: Text 'We look forward to welcoming you!' (W: 235, H: 60, X: 75, Y: 658, Fill: #080480) */}
        <div className="absolute top-[658px] left-[75px] w-[235px] h-[60px] flex items-center justify-center text-center z-[3] pointer-events-none">
          <p className="font-petrona font-normal text-[19px] leading-[26px] text-[var(--corp-text-primary)] tracking-[0.04em] m-0">
            WE LOOK FORWARD TO<br />WELCOMING YOU!
          </p>
        </div>

        {/* Turn 3 - Screenshot 5: Bottom Background Image (W: 390, H: 162, X: 0, Y: 682) */}
        <img
          src="/assets/events/corporate-events/templates/template-1/chrome/payment-success/bottom background.webp"
          alt=""
          className="absolute top-[682px] left-0 w-[390px] h-[162px] object-cover pointer-events-none z-[1]"
          width={390}
          height={162}
          aria-hidden="true"
        />

        {/* Turn 3 - Screenshot 4: Bottom Leaves Image (W: 162, H: 221, X: 233, Y: 623) */}
        <img
          src="/assets/events/corporate-events/templates/template-1/chrome/payment-success/bottom-leaves.webp"
          alt=""
          className="absolute top-[623px] left-[233px] w-[162px] h-[221px] object-contain pointer-events-none z-[2]"
          width={162}
          height={221}
          aria-hidden="true"
        />

        {/* Toast Feedback */}
        {toastMessage && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[var(--corp-text-primary)] text-white font-instrument text-[12.5px] font-semibold py-[10px] px-5 rounded-[20px] shadow-[0_8px_24px_rgba(8,4,128,0.35)] pointer-events-none z-20 whitespace-nowrap transition-all duration-200"
            aria-live="polite"
          >
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessOverlay;
