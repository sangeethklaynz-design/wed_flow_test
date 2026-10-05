'use client';

import React, { useState } from 'react';

export const RsvpChangeRequestPage = ({
  rsvpData = {},
  guestToken = '',
  onRequestSubmitted,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isAttending =
    (rsvpData.attendance || 'yes').toLowerCase() === 'yes' ||
    (rsvpData.attendingStatus || '').toLowerCase() === 'confirmed' ||
    (rsvpData.attendingStatus || '').toLowerCase() === 'attending';

  const displayGuests = rsvpData.guests ?? rsvpData.attendingCount ?? rsvpData.guestCount ?? 1;
  const displayMeal = rsvpData.meal || rsvpData.mealPreference || '—';
  const displayRequirements =
    rsvpData.requirements || rsvpData.wishes || rsvpData.specialRequirements || '—';

  const handleSubmitChangeRequest = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!reason.trim()) {
      setError('Please tell us the reason for your change request.');
      return;
    }

    setSubmitting(true);
    try {
      const resolvedToken =
        guestToken ||
        (typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('token') || ''
          : '');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      if (resolvedToken) {
        const res = await fetch(
          `${apiUrl}/api/public/invite/${encodeURIComponent(resolvedToken)}/rsvp-change-request`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason.trim() }),
          }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to submit change request');
        }
      }

      setSubmitted(true);
      if (onRequestSubmitted) {
        onRequestSubmitted(reason.trim());
      }
    } catch (err) {
      setError(err.message || 'Could not submit change request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="page-3"
      data-page="3"
      data-invite-page="rsvp"
      className="relative w-[390px] h-[844px] min-h-[844px] flex-shrink-0 overflow-y-auto overflow-x-hidden snap-start snap-always bg-rsvp-grad select-none no-scrollbar"
    >
      <img
        src="/assets/events/corporate-events/templates/template-1/chrome/rsvp-confirmation/top-background.webp"
        alt=""
        className="absolute top-0 left-0 w-[390px] h-[130px] object-cover pointer-events-none z-[1]"
        width={390}
        height={130}
        aria-hidden="true"
      />

      <div className="relative z-[2] w-[390px] min-h-[844px] mx-auto px-[35px] pt-[72px] pb-[32px] flex flex-col items-center justify-start select-none">
        <h2 className="font-petrona font-bold text-[31px] text-[var(--corp-text-primary)] text-center leading-[1.12] tracking-[-0.01em] m-0">
          Need to Make
          <br />
          a Change?
        </h2>

        <div className="w-[140px] h-[18px] my-[9px] flex items-center justify-center">
          <img
            src="/assets/events/corporate-events/templates/template-1/chrome/rsvp/gold-infinity-divider.png"
            alt=""
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>

        <p className="font-instrument font-medium text-[11px] text-[#1E3A2F] text-center leading-[16px] max-w-[245px] mb-[18px]">
          If you&apos;ve made a mistake or need to
          <br />
          update your RSVP, you can request to
          <br />
          enable changes
          <br />
          again
        </p>

        <div className="w-full flex flex-col gap-[13px] text-left">
          <div className="flex flex-col gap-1.5">
            <span className="font-instrument font-bold text-[12.5px] leading-[1.15] text-[var(--corp-text-primary)] tracking-[0.01em]">
              Will you attend?
            </span>
            <div className="flex flex-col gap-[7px] mt-[1px]">
              <div className="flex items-center gap-[9px] select-none cursor-not-allowed">
                <div
                  className={`w-[17px] h-[17px] rounded-full border-2 bg-white flex items-center justify-center shrink-0 ${
                    isAttending ? 'border-[#4944DF]' : 'border-[#94A3B8]'
                  }`}
                >
                  {isAttending ? (
                    <div className="w-[7.5px] h-[7.5px] rounded-full bg-[#4944DF]" />
                  ) : null}
                </div>
                <span
                  className={`font-instrument text-[12.5px] ${
                    isAttending
                      ? 'font-semibold text-[#475569]'
                      : 'font-medium text-[#94A3B8]'
                  }`}
                >
                  Yes, I&apos;ll attend
                </span>
              </div>

              <div className="flex items-center gap-[9px] select-none cursor-not-allowed">
                <div
                  className={`w-[17px] h-[17px] rounded-full border-2 bg-white flex items-center justify-center shrink-0 ${
                    !isAttending ? 'border-[#4944DF]' : 'border-[#94A3B8]'
                  }`}
                >
                  {!isAttending ? (
                    <div className="w-[7.5px] h-[7.5px] rounded-full bg-[#4944DF]" />
                  ) : null}
                </div>
                <span
                  className={`font-instrument text-[12.5px] ${
                    !isAttending
                      ? 'font-semibold text-[#475569]'
                      : 'font-medium text-[#94A3B8]'
                  }`}
                >
                  Sorry, I can&apos;t attend
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="font-instrument font-bold text-[12.5px] leading-[1.15] text-[var(--corp-text-primary)] tracking-[0.01em]">
              Number of Guests
            </label>
            <div className="w-full h-[38px] bg-white border border-[#D4E2F4] rounded-[14px] px-[14px] flex items-center text-[13px] text-[#94A3B8] shadow-[0_1px_3px_rgba(8,4,128,0.03)] cursor-not-allowed select-none">
              {displayGuests}
            </div>
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="font-instrument font-bold text-[12.5px] leading-[1.15] text-[var(--corp-text-primary)] tracking-[0.01em]">
              Meal Preference
            </label>
            <div className="w-full h-[38px] bg-white border border-[#D4E2F4] rounded-[14px] px-[14px] flex items-center justify-between text-[13px] text-[#4944DF] shadow-[0_1px_3px_rgba(8,4,128,0.03)] cursor-not-allowed select-none">
              <span>{displayMeal}</span>
            </div>
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="font-instrument font-bold text-[12.5px] leading-[1.15] text-[var(--corp-text-primary)] tracking-[0.01em]">
              Any Special Requirements (Optional)
            </label>
            <div className="w-full h-[38px] bg-white border border-[#D4E2F4] rounded-[14px] px-[14px] flex items-center text-[13px] text-[#94A3B8] shadow-[0_1px_3px_rgba(8,4,128,0.03)] cursor-not-allowed select-none overflow-hidden text-ellipsis whitespace-nowrap">
              {displayRequirements}
            </div>
          </div>
        </div>

        <div className="w-full h-[40px] mt-[16px] mb-[14px] rounded-full border border-[#D4A145] bg-[#FFFFFF]/85 backdrop-blur-xs flex items-center justify-center gap-[9px] shadow-[0_1px_4px_rgba(212,161,69,0.15)] select-none">
          <span className="font-petrona font-bold text-[11.5px] text-[var(--corp-text-primary)] uppercase tracking-[0.14em]">
            REQUEST FOR RSVP CHANGE
          </span>
        </div>

        {submitted ? (
          <div className="w-full flex flex-col items-center justify-center gap-2 py-4 bg-white/80 border border-[#B7DBFE] rounded-[18px] text-center px-4 shadow-sm">
            <div className="w-[32px] h-[32px] rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-[16px]">
              ✓
            </div>
            <p className="font-petrona font-bold text-[14px] text-[var(--corp-text-primary)]">
              Change Request Submitted
            </p>
            <p className="font-instrument text-[11.5px] text-[#475569] leading-[15px]">
              Your note has reached us with care. RSVP access will be re-enabled
              once approved.
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="w-full flex flex-col items-start gap-[5px]">
              <label
                htmlFor="change-reason-input"
                className="font-instrument font-semibold text-[13px] text-[#1E3A2F]"
              >
                Tell us the reason
              </label>
              <textarea
                id="change-reason-input"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Write the reason....."
                className="w-full h-[66px] bg-white border border-[#D4E2F4] rounded-[16px] px-[14px] py-[10px] font-instrument text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] shadow-[0_1px_3px_rgba(8,4,128,0.03)] resize-none outline-none focus:border-[#4944DF] focus:ring-[2px] focus:ring-[#4944DF]/15"
              />
            </div>

            {error ? (
              <p className="text-[11px] text-red-600 text-center w-full mt-1.5">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleSubmitChangeRequest}
              disabled={submitting}
              className="w-[170px] h-[38px] mt-[14px] bg-[#06046A] hover:bg-[#040250] text-white font-instrument font-bold text-[11.5px] uppercase tracking-wider rounded-full shadow-[0_4px_12px_rgba(6,4,106,0.3)] transition-all active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'SUBMIT REQUEST'}
            </button>

            <div className="flex items-start justify-center gap-[7px] mt-[12px] px-[10px]">
              <p className="font-petrona text-[11px] text-[var(--corp-text-primary)] leading-[15px] text-center">
                Your request will be reviewed, and RSVP access will be enabled
                again once approved.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RsvpChangeRequestPage;
