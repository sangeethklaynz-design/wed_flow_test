'use client';

import React, { useState } from 'react';

export const PaymentSuccessOverlay = ({
  isOpen,
  onClose,
  onBackToRsvp,
  onAddToCalendar,
  onViewTicket,
  onDownloadAllTickets,
  bookingData = null,
  attendeeName: attendeeNameProp = 'Kavindu Perera',
  bookingRef: bookingRefProp = '',
  theme = 'corporate',
}) => {
  const [toastMessage, setToastMessage] = useState(null);

  const attendeeName = bookingData?.fullName || attendeeNameProp;
  const bookingRef =
    bookingData?.orderId ||
    bookingData?.bookingRef ||
    bookingData?.individualTickets?.[0]?.ticketCode ||
    bookingRefProp ||
    '';
  const isTicketing = Boolean(
    bookingData &&
      (bookingData.totalAmount !== undefined ||
        bookingData.isTicketingFlow ||
        (Array.isArray(bookingData.selectedTickets) && bookingData.selectedTickets.length > 0))
  );
  const totalAmount = bookingData?.totalAmount ?? 3000;
  const isParty = theme === 'party';

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
      showToast(`Ticket ${bookingRef} ready. Email sent!`);
    }
  };

  const handleDownloadAllTickets = () => {
    if (typeof onDownloadAllTickets === 'function') {
      onDownloadAllTickets();
      return;
    }
    showToast('Downloading all tickets...');
    setTimeout(() => {
      if (typeof onViewTicket === 'function') {
        onViewTicket();
      }
    }, 500);
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

  // TICKETING FLOW SUCCESS VIEW (Screenshots 1 & 2 - robust natural flow layout)
  if (isTicketing) {
    const ticketLines =
      Array.isArray(bookingData?.selectedTickets) && bookingData.selectedTickets.length > 0
        ? bookingData.selectedTickets
            .filter((t) => Number(t.quantity) > 0)
            .map(
              (t) =>
                `${t.quantity} x  ${t.name} (LKR ${Number(t.price).toLocaleString('en-US')})`
            )
        : [bookingData?.ticketsSummary || '3 x  Standard (LKR 1, 000)'];

    const formattedTotal = Number(totalAmount).toLocaleString('en-US');

    return (
      <div
        id="payment-success-view"
        role="dialog"
        aria-modal="true"
        aria-label="Payment Successful"
        className="absolute top-0 left-0 w-[390px] h-[844px] rounded-[26px] overflow-hidden z-[110] shadow-card select-none animate-in fade-in zoom-in-95 duration-200"
        style={{
          background:
            'linear-gradient(180deg, #F0F7FE 0%, #FFFFFF 30%, #FFFFFF 70%, #F0F7FE 100%)',
        }}
      >
        <div className="relative w-[390px] h-[844px] mx-auto select-none overflow-hidden">
          {/* Top Background Artwork */}
          {isParty ? (
            /* Party Top Foliage (Screenshot 2) */
            <div
              className="absolute top-0 left-0 w-[390px] h-[190px] pointer-events-none z-0 overflow-hidden"
              aria-hidden="true"
            >
              <img
                src="/assets/events/parties/templates/template-1/chrome/ticketing-page/top-bg.webp"
                alt=""
                className="w-[390px] h-[190px] object-cover object-top block"
                width={390}
                height={190}
              />
            </div>
          ) : (
            /* Corporate Top Wave (Screenshot 3) */
            <div
              className="absolute top-0 left-0 w-[390px] h-[162px] pointer-events-none z-0 overflow-hidden"
              aria-hidden="true"
            >
              <img
                src="/assets/events/corporate-events/templates/template-1/chrome/ticketing-page/top-background.webp"
                alt=""
                className="w-[390px] h-[162px] object-cover block"
                style={{ transform: "rotate(180deg)" }}
                width={390}
                height={162}
              />
            </div>
          )}

          {/* Corporate Back Arrow Button (Screenshot 1: top left dark navy arrow) */}
          {!isParty && (
            <button
              type="button"
              id="back-to-ticketing-btn"
              onClick={onBackToRsvp || onClose}
              aria-label="Back"
              className="absolute top-[20px] left-[20px] w-9 h-9 flex items-center justify-center text-[#0A2569] hover:opacity-75 active:scale-95 transition-all cursor-pointer z-20 p-0"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0A2569"
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

          {/* Bottom Background Artwork */}
          {isParty ? (
            /* Party Bottom Foliage (Screenshot 2: navy & gold leaves upside down) */
            <div
              className="absolute bottom-0 left-0 w-[390px] h-[185px] pointer-events-none z-0 overflow-hidden"
              aria-hidden="true"
            >
              <img
                src="/assets/events/parties/templates/template-1/chrome/ticketing-page/bottom-bg.webp"
                alt=""
                className="w-[390px] h-[185px] object-cover block"
                style={{ transform: 'rotate(180deg)' }}
                width={390}
                height={185}
              />
            </div>
          ) : (
            /* Corporate Bottom Wave & Green Leaves (Screenshot 1) */
            <>
              <div
                className="absolute bottom-0 left-0 w-[390px] h-[155px] pointer-events-none z-0 overflow-hidden"
                aria-hidden="true"
              >
                <img
                  src="/assets/events/corporate-events/templates/template-1/chrome/ticketing-page/bottom-background.webp"
                  alt=""
                  className="w-[390px] h-[155px] object-cover block"
                  width={390}
                  height={155}
                />
              </div>
              <img
                src="/assets/events/corporate-events/templates/template-1/chrome/ticketing-page/bottom-leaves.webp"
                alt=""
                className="absolute bottom-0 right-0 w-[155px] h-[225px] object-contain pointer-events-none z-[1]"
                width={155}
                height={225}
                aria-hidden="true"
              />
            </>
          )}

          {/* Main Content Column (Natural Flex Flow - Perfectly aligned, NO overlapping!) */}
          <div
            className={`relative z-10 w-[390px] h-full flex flex-col items-center px-6 ${
              isParty ? 'pt-[78px]' : 'pt-[70px]'
            } select-none`}
          >
            {/* 1. Checkmark with Confetti (Screenshots 1 & 2: centered green circle + confetti) */}
            <div className="w-[200px] h-[120px] flex items-center justify-center flex-shrink-0 animate-tick-pop-in pointer-events-none">
              <img
                src={
                  isParty
                    ? '/assets/events/parties/templates/template-1/chrome/ticketing-page/top-success-mark.webp'
                    : '/assets/events/corporate-events/templates/template-1/chrome/ticketing-page/top-success-mark.webp'
                }
                alt="Payment Successful"
                className="w-full h-full object-contain block drop-shadow-sm"
                width={200}
                height={120}
              />
            </div>

            {/* 2. Heading & Subtitle */}
            <div className="flex flex-col items-center text-center mt-2 flex-shrink-0">
              <h1 className="m-0 font-jakarta font-bold text-[30px] leading-[36px] text-[#0FA93E] tracking-[-0.015em]">
                Payment Successful!
              </h1>
              <p className="m-0 font-inter font-normal text-[14.5px] leading-[20px] text-[#64748B] mt-1 tracking-tight">
                Your tickets have been  confirmed.
              </p>
            </div>

            {/* 3. Attendee Card (Kavindu Perera / LN2026-0001) */}
            <div className="w-[326px] min-h-[66px] bg-[#E9EEFA] rounded-[16px] py-2.5 px-4 flex flex-col items-center justify-center text-center mt-3.5 flex-shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <span className="font-jakarta font-bold text-[20px] leading-[24px] text-[#0A2569]">
                {attendeeName}
              </span>
              <span className="font-jakarta font-medium text-[13px] leading-[17px] text-[#556987] mt-[3px] tracking-wide">
                {bookingRef}
              </span>
            </div>

            {/* 4. Purchased Details (Tickets Purchased & Total Paid) */}
            <div className="w-[326px] flex flex-col gap-3.5 mt-4 flex-shrink-0 px-2">
              {/* Row 1: Tickets Purchased */}
              <div className="flex items-start gap-3.5">
                <div className="w-[28px] h-[22px] flex items-center justify-center flex-shrink-0 pt-0.5">
                  <svg width="28" height="19" viewBox="0 0 30 20" fill="#94A3B8" aria-hidden="true">
                    <path d="M2 3a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v3.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3.5a2.5 2.5 0 0 0 0-5V3z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-jakarta font-bold text-[12.5px] leading-[16px] text-[#64748B] tracking-wider uppercase">
                    Tickets Purchased
                  </span>
                  <div className="flex flex-col mt-0.5">
                    {ticketLines.map((line, idx) => (
                      <span
                        key={idx}
                        className="font-inter font-medium text-[14px] leading-[20px] text-[#475569]"
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Total Paid */}
              <div className="flex items-start gap-3.5">
                <div className="w-[28px] h-[22px] flex items-center justify-center flex-shrink-0 pt-0.5">
                  <div className="w-[24px] h-[24px] rounded-full bg-[#94A3B8] flex items-center justify-center text-white font-bold text-[14px] leading-none select-none">
                    $
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-jakarta font-bold text-[12.5px] leading-[16px] text-[#64748B] tracking-wider uppercase">
                    Total Paid
                  </span>
                  <span className="font-inter font-medium text-[14px] leading-[20px] text-[#475569] mt-0.5">
                    LKR {formattedTotal}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Action Buttons Stack - Positioned directly below details with zero overlap! */}
            <div className="w-[326px] flex flex-col gap-2.5 mt-5 flex-shrink-0">
              <button
                type="button"
                id="view-my-tickets-btn"
                onClick={handleViewTicket}
                className="w-full h-[46px] bg-[#080480] hover:bg-[#060368] active:scale-[0.99] text-white font-jakarta font-bold text-[15px] rounded-xl flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(8,4,128,0.25)] transition-all"
              >
                View My Tickets
              </button>

              <button
                type="button"
                id="download-all-tickets-btn"
                onClick={handleDownloadAllTickets}
                className="w-full h-[46px] bg-white border-[1.5px] border-[#080480] hover:bg-[#F8FAFC] active:scale-[0.99] text-[#080480] font-jakarta font-bold text-[15px] rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <svg
                  className="w-[18px] h-[18px] flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0174EF"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download All Tickets</span>
              </button>

              <button
                type="button"
                id="payment-add-calendar-btn"
                onClick={handleAddToCalendar}
                className="w-full h-[46px] bg-white border-[1.5px] border-[#080480] hover:bg-[#F8FAFC] active:scale-[0.99] text-[#080480] font-jakarta font-bold text-[15px] rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <svg
                  className="w-[20px] h-[20px] flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0174EF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Add to Calendar</span>
              </button>
            </div>
          </div>

          {/* Toast Feedback */}
          {toastMessage && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#080480] text-white font-inter text-[12.5px] font-semibold py-[10px] px-5 rounded-[20px] shadow-[0_8px_24px_rgba(8,4,128,0.35)] pointer-events-none z-30 whitespace-nowrap transition-all duration-200"
              aria-live="polite"
            >
              {toastMessage}
            </div>
          )}
        </div>
      </div>
    );
  }

  // DEFAULT RSVP CONFIRMATION PAYMENT SUCCESS VIEW (Kept 100% as is per requirement)
  return (
    <div
      id="payment-success-view"
      role="dialog"
      aria-modal="true"
      aria-label="Payment Successful"
      className="absolute top-0 left-0 w-[390px] h-[844px] rounded-[26px] overflow-hidden z-[110] shadow-card bg-confirm-grad select-none animate-in fade-in zoom-in-95 duration-300"
      style={{
        '--corp-text-primary': '#080480',
        '--corp-text-highlight': '#0084FF',
      }}
    >
      <div className="relative w-[390px] h-[844px] mx-auto select-none">
        {/* Top Left Corner Back Button to RSVP Confirmation */}
        <button
          type="button"
          id="back-to-rsvp-btn"
          onClick={onBackToRsvp}
          aria-label="Back to RSVP confirmation"
          className="absolute top-[18px] left-[18px] w-[36px] h-[36px] rounded-full bg-[#080480] text-white shadow-[0_2px_8px_rgba(8,4,128,0.25)] flex items-center justify-center cursor-pointer z-[20] transition-all duration-150 hover:bg-[#0a0699] hover:scale-105 active:scale-95"
          style={{ backgroundColor: '#080480', color: '#ffffff' }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
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
        <div className="absolute top-[260px] left-[6px] w-[377px] h-[77px] flex flex-col items-center justify-start text-center z-[2]">
          <h1 className="m-0 font-jakarta font-bold text-[32px] leading-[40px] text-[#12A832] tracking-[-0.015em]">
            Payment Successful!
          </h1>
          <p className="m-0 font-inter font-normal text-[16px] leading-[22px] text-[#6B7280] mt-[3px]">
            Your registration is confimed.
          </p>
        </div>

        {/* Turn 2 - Screenshot 1: Square behind text 'Kavindu Perera' */}
        <div className="absolute top-[345px] left-[21px] w-[343px] min-h-[92px] bg-[#E8EEF8] rounded-[15px] p-3 flex flex-col items-center justify-center z-[2] shadow-sm border border-[#BFDBFE]/40">
          <div className="w-full flex flex-col items-center justify-center text-center">
            <span className="font-jakarta font-bold text-[21px] leading-[26px] text-[var(--corp-text-primary)]">
              {attendeeName}
            </span>
            <span className="font-jakarta font-medium text-[13.5px] leading-[18px] text-[#475467] mt-[2px]">
              {bookingRef}
            </span>
          </div>
        </div>

        {/* Turn 2 - Screenshot 2: Text 'You will receive a confirmation email shortly.' */}
        <div className="absolute top-[470px] left-[64px] w-[261px] h-[34px] flex items-center justify-center text-center z-[2]">
          <p className="font-inter font-medium text-[13.5px] leading-[17px] text-[var(--corp-text-primary)] m-0">
            You will receive a confirmation<br />email shortly.
          </p>
        </div>

        {/* Turn 2 - Screenshot 3 & 4: Button 'View My Tickets' */}
        <button
          type="button"
          id="view-my-ticket-btn"
          onClick={handleViewTicket}
          className="absolute top-[524px] left-[53px] w-[280px] h-[42px] px-4 bg-[#080480] hover:bg-[#060368] text-white rounded-lg flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(8,4,128,0.25)] z-[3] transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(8,4,128,0.32)] active:translate-y-[1px]"
          style={{ backgroundColor: '#080480', color: '#ffffff' }}
        >
          <span className="font-inter font-semibold text-[15px] leading-[19px] text-white">
            View My Ticket
          </span>
        </button>

        {/* Turn 2 - Screenshot 5: Button 'Add to Calendar' */}
        <button
          type="button"
          id="payment-add-calendar-btn"
          onClick={handleAddToCalendar}
          className="absolute top-[580px] left-[53px] w-[280px] h-[40px] px-4 bg-white text-[#080480] border-[1.5px] border-[#080480] rounded-lg flex items-center justify-center gap-[9px] cursor-pointer z-[3] transition-all duration-150 hover:bg-[#F1F6FE] hover:-translate-y-[1px] active:translate-y-[1px]"
          style={{ backgroundColor: '#ffffff', color: '#080480', borderColor: '#080480' }}
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
