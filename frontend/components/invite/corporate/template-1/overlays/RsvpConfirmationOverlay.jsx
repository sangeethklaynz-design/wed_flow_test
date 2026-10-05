'use client';

import React, { useEffect, useState } from 'react';

export const RsvpConfirmationOverlay = ({
  isOpen,
  onClose,
  onProceedToPayment,
  canAttend = true,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(23 * 3600 + 59 * 60 + 45);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTotalSeconds((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  const handleProceedPayment = (e) => {
    if (e) e.preventDefault();
    if (onProceedToPayment) {
      onProceedToPayment();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="rsvp-confirmation-view"
      role="dialog"
      aria-modal="true"
      aria-label="RSVP Confirmation"
      className="absolute top-0 left-0 w-[390px] h-[844px] rounded-[26px] overflow-hidden z-[100] shadow-card bg-confirm-grad select-none animate-in fade-in zoom-in-95 duration-300"
    >
      <div className="relative w-[390px] h-[844px] mx-auto select-none">
        {/* Top Background Waves (W: 390, H: 130, X: 0, Y: 0) */}
        <img
          src="/assets/events/corporate-events/templates/template-1/chrome/rsvp-confirmation/top-background.webp"
          alt=""
          className="absolute top-0 left-0 w-[390px] h-[130px] object-cover pointer-events-none z-[1]"
          width={390}
          height={130}
          aria-hidden="true"
        />

        {/* Upper Tick Mark (W: 131, H: 119, X: 122, Y: 66) */}
        <div className="absolute top-[66px] left-[122px] w-[131px] h-[119px] flex items-center justify-center z-[2] animate-tick-pop-in">
          <img
            src="/assets/events/corporate-events/templates/template-1/chrome/rsvp-confirmation/upper-tick-mark.webp"
            alt="Success Checkmark"
            className="w-full h-full object-contain block"
            width={131}
            height={119}
          />
        </div>

        {/* Text 'THANK YOU!' (W: 364, H: 44, X: 6, Y: 195) */}
        <h1 className="absolute top-[195px] left-[6px] w-[364px] h-[44px] m-0 font-jakarta font-bold text-[35px] leading-[44px] text-[var(--corp-text-primary)] text-center tracking-[-0.015em] z-[2]">
          THANK YOU!
        </h1>

        {/* Subtitle */}
        <p className="absolute top-[238px] left-[47px] w-[283px] h-[44px] m-0 font-inter font-normal text-[18px] leading-[22px] text-[var(--corp-text-primary)] text-center z-[2]">
          {canAttend ? (
            <>
              Your RSVP has been<br />successfully submitted.
            </>
          ) : (
            <>
              Your response has been<br />successfully submitted.
            </>
          )}
        </p>

        {/* Tagline */}
        <p className="absolute top-[285px] left-[46px] w-[283px] h-[22px] m-0 font-inter font-bold text-[18px] leading-[22px] text-[#0150E6] text-center z-[2]">
          {canAttend ? "We’re excited to have you!" : "We're sorry you can't make it!"}
        </p>

        {canAttend ? (
          <>
            {/* Payment Notice Card (Within 24 Hours) */}
            <div className="absolute top-[323px] left-[14px] w-[362px] h-[211px] bg-[#DFEDFC]/72 rounded-[15px] box-border z-[2]">
              {/* Circle behind clock icon (W: 68, H: 67, X: 40, Y: 338 -> left: 26, top: 15) */}
              <div className="absolute left-[26px] top-[15px] w-[68px] h-[67px] rounded-full bg-[#CCDAF9] flex items-center justify-center" aria-hidden="true">
                {/* Clock icon (W: 40, H: 40) */}
                <svg className="w-[40px] h-[40px] block" viewBox="0 0 24 24" fill="none" stroke="#0174EF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9.5" />
                  <polyline points="12 6.5 12 12 16 14" />
                </svg>
              </div>

              {/* Text 'Complete Your Payment Within 24 Hours' (W: 228, H: 51, left: 104, top: 23) */}
              <h2 className="absolute left-[104px] top-[23px] w-[228px] h-[51px] font-jakarta font-bold text-[18px] leading-[24px] text-[var(--corp-text-primary)] text-left m-0">
                Complete Your Payment<br />Within 24 Hours
              </h2>

              {/* Text 'To confirm your attendance...' (W: 341, H: 48, left: 10, top: 84) */}
              <p className="absolute left-[10px] top-[84px] w-[341px] h-[48px] font-inter font-normal text-[13px] leading-[16px] text-[var(--corp-text-primary)] text-center m-0">
                To confirm your attendance, please complete the payment within 24 hours from your RSVP submission time.
              </p>

              {/* Countdown Timer (Hours : Minutes : Seconds) */}
              <div className="absolute left-[51px] top-[142px] w-[259px] h-[50px] flex items-center justify-between box-border" aria-label="Payment countdown timer">
                <div className="w-[58px] h-[50px] bg-[#DCE8F8] rounded-[10px] flex flex-col items-center justify-center box-border">
                  <span className="font-jakarta font-bold text-[20px] leading-none text-[var(--corp-text-primary)]">{hours}</span>
                  <span className="font-inter font-normal text-[8.5px] text-[#475569] mt-[2px] capitalize">Hours</span>
                </div>
                <span className="font-jakarta font-bold text-[18px] text-[var(--corp-text-primary)] mb-1">:</span>
                <div className="w-[58px] h-[50px] bg-[#DCE8F8] rounded-[10px] flex flex-col items-center justify-center box-border">
                  <span className="font-jakarta font-bold text-[20px] leading-none text-[var(--corp-text-primary)]">{minutes}</span>
                  <span className="font-inter font-normal text-[8.5px] text-[#475569] mt-[2px] capitalize">Minutes</span>
                </div>
                <span className="font-jakarta font-bold text-[18px] text-[var(--corp-text-primary)] mb-1">:</span>
                <div className="w-[58px] h-[50px] bg-[#DCE8F8] rounded-[10px] flex flex-col items-center justify-center box-border">
                  <span className="font-jakarta font-bold text-[20px] leading-none text-[var(--corp-text-primary)]">{seconds}</span>
                  <span className="font-inter font-normal text-[8.5px] text-[#475569] mt-[2px] capitalize">Seconds</span>
                </div>
              </div>
            </div>

            {/* Proceed to Payment Button (W: 280, H: 40, X: 48, Y: 557) */}
            <button
              type="button"
              id="proceed-payment-btn"
              onClick={handleProceedPayment}
              className="absolute top-[557px] left-[48px] w-[280px] h-[40px] px-4 bg-[var(--corp-text-primary)] text-white rounded-lg font-jakarta font-bold text-[14px] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(8,4,128,0.25)] z-[3] transition-all duration-150 hover:opacity-90 hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(8,4,128,0.32)] active:translate-y-[1px]"
            >
              <span>Proceed to Payment</span>
              <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            {/* Back to Invitation Button (W: 280, H: 40, X: 48, Y: 620) */}
            <button
              type="button"
              id="back-to-invitation-btn"
              onClick={onClose}
              className="absolute top-[620px] left-[48px] w-[280px] h-[40px] px-4 bg-white text-[var(--corp-text-primary)] border-[1.5px] border-[var(--corp-text-primary)] rounded-lg font-jakarta font-bold text-[14px] flex items-center justify-center cursor-pointer z-[3] transition-all duration-150 hover:bg-[#F1F6FE] hover:-translate-y-[1px] active:translate-y-[1px]"
            >
              Back to Invitation
            </button>
          </>
        ) : (
          /* Declined response view */
          <div className="absolute top-[340px] left-[48px] w-[280px] flex flex-col items-center gap-4 z-[3]">
            <p className="font-inter font-normal text-[14px] leading-[20px] text-[var(--corp-text-primary)] text-center m-0">
              We hope to celebrate with you at future events. You can return to the invitation below.
            </p>
            <button
              type="button"
              id="back-to-invitation-btn"
              onClick={onClose}
              className="w-[280px] h-[42px] px-4 bg-[var(--corp-text-primary)] text-white rounded-lg font-jakarta font-bold text-[14px] flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(8,4,128,0.25)] transition-all duration-150 hover:opacity-90 hover:-translate-y-[1px] active:translate-y-[1px]"
            >
              Back to Invitation
            </button>
          </div>
        )}

        {/* Bottom Background Waves (W: 390, H: 162, X: 0, Y: 682) */}
        <img
          src="/assets/events/corporate-events/templates/template-1/chrome/rsvp-confirmation/bottom-background.webp"
          alt=""
          className="absolute top-[682px] left-0 w-[390px] h-[162px] object-cover pointer-events-none z-[1]"
          width={390}
          height={162}
          aria-hidden="true"
        />

        {/* Bottom Leaves (W: 162, H: 221, X: 233, Y: 623) */}
        <img
          src="/assets/events/corporate-events/templates/template-1/chrome/rsvp-confirmation/bottom-leaves.webp"
          alt=""
          className="absolute top-[623px] left-[233px] w-[162px] h-[221px] object-contain pointer-events-none z-[2]"
          width={162}
          height={221}
          aria-hidden="true"
        />

        {/* Bottom Left Quote (X: 34, Y: 695, W: 172, H: 98) */}
        <div className="absolute top-[695px] left-[34px] w-[172px] h-[98px] flex flex-col justify-start z-[3]">
          <div className="flex items-center gap-2">
            <img
              src="/assets/events/corporate-events/templates/template-1/chrome/rsvp-confirmation/double-quotations-icon.webp"
              alt=""
              className="w-[22px] h-[15px] object-contain block flex-shrink-0"
              width={22}
              height={15}
              aria-hidden="true"
            />
            <span className="font-petrona font-normal text-[20px] leading-[1.25] text-[var(--corp-text-primary)]">
              People
            </span>
          </div>
          <div className="font-petrona font-normal text-[20px] leading-[1.25] text-[var(--corp-text-primary)] mt-[2px]">
            Make Events
          </div>
          <div className="font-petrona font-normal text-[20px] leading-[1.25] text-[var(--corp-text-primary)]">
            <span className="border-b-[2.2px] border-[#0174EF] pb-[2px] inline-block">
              Exraordinary
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RsvpConfirmationOverlay;
