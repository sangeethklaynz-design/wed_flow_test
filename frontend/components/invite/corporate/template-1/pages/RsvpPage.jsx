'use client';

import React, { useMemo, useState } from 'react';
import {
  computeRsvpHeight,
  DEFAULT_RSVP_QUESTIONS,
  parseOptionList,
} from '@/lib/corporateLayoutMetrics';
import { corporatePageGradientStyle } from '@/lib/corporatePageStyles';
import { apiRequest } from '@/lib/api';

function fieldKey(question, index) {
  return `q_${index}_${String(question?.label || 'field')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')}`;
}

export const RsvpPage = ({
  fields = {},
  onRsvpSuccess,
  previewBypassValidation = false,
  guestToken = null,
  maxGuests = 1,
}) => {
  const questions =
    Array.isArray(fields.rsvpQuestions) && fields.rsvpQuestions.length
      ? fields.rsvpQuestions
      : DEFAULT_RSVP_QUESTIONS;

  const pageHeight = computeRsvpHeight(questions);

  const initialAnswers = useMemo(() => {
    const next = {};
    questions.forEach((q, i) => {
      const key = fieldKey(q, i);
      const type = String(q?.inputType || 'text').toLowerCase();
      if (type === 'radio') {
        const opts = parseOptionList(q?.options);
        next[key] = opts[0] || '';
      } else {
        next[key] = '';
      }
    });
    return next;
  }, [questions]);

  const [answers, setAnswers] = useState(initialAnswers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rsvpError, setRsvpError] = useState('');
  const [btnText, setBtnText] = useState('Submit RSVP');
  const [btnGreen, setBtnGreen] = useState(false);

  // Reset when question set changes (admin live preview)
  React.useEffect(() => {
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  const setAnswer = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRsvpError('');

    // Determine attendance
    let status = 'ATTENDING';
    let attendanceVal = 'yes';
    const attendIndex = questions.findIndex(
      (q) => /attend/i.test(q?.label || '') || /attendance/i.test(q?.label || '')
    );
    if (attendIndex >= 0) {
      const aKey = fieldKey(questions[attendIndex], attendIndex);
      const answerVal = String(answers[aKey] || '').toLowerCase();
      if (/can.?t|cannot|\bno\b|sorry|decline|won.?t|unable|not/i.test(answerVal)) {
        status = 'DECLINED';
        attendanceVal = 'no';
      }
    }

    // Determine guest count
    let attendingCount = 0;
    const limit = Math.max(1, Number(maxGuests) || 1);
    if (status === 'ATTENDING') {
      const guestsIndex = questions.findIndex((q) =>
        /number of guest|guests? count|how many guest|attendee/i.test(q?.label || '')
      );
      if (guestsIndex >= 0) {
        const gKey = fieldKey(questions[guestsIndex], guestsIndex);
        const digits = String(answers[gKey] || '').replace(/\D/g, '');
        let n = Number(digits);
        if (!digits || !Number.isInteger(n) || n < 1) {
          n = 1;
        }
        if (n > limit) {
          n = limit;
        }
        attendingCount = n;
      } else {
        attendingCount = 1;
      }
    }

    // Format extra notes/wishes from non-attendance and non-guest fields
    const notes = [];
    questions.forEach((q, i) => {
      const k = fieldKey(q, i);
      const lbl = q?.label || `Field ${i + 1}`;
      if (
        /attend/i.test(lbl) ||
        /number of guest|guest count|how many guest/i.test(lbl)
      ) {
        return;
      }
      const val = answers[k];
      if (val && String(val).trim()) {
        notes.push(`${lbl}: ${String(val).trim()}`);
      }
    });
    const wishesPayload = notes.join('\n');

    // Extract meal preference & special requirements for downstream display
    const mealQ = questions.find((q) => /meal/i.test(q?.label || ''));
    const mealVal = mealQ ? answers[fieldKey(mealQ, questions.indexOf(mealQ))] : '';
    const reqQ = questions.find((q) =>
      /special requirement|dietary|wishes|note/i.test(q?.label || '')
    );
    const reqVal = reqQ ? answers[fieldKey(reqQ, questions.indexOf(reqQ))] : '';

    const successPayload = {
      ...answers,
      attendance: attendanceVal,
      attendingStatus: status === 'ATTENDING' ? 'confirmed' : 'declined',
      attendingCount,
      guests: attendingCount,
      meal: mealVal,
      mealPreference: mealVal,
      specialRequirements: reqVal,
      requirements: reqVal,
      wishes: wishesPayload,
    };

    if (!guestToken) {
      // Preview mode (admin / template modal)
      setIsSubmitting(true);
      setBtnText(status === 'ATTENDING' ? 'RSVP Confirmed ✓' : 'RSVP Declined ✓');
      setBtnGreen(true);
      setTimeout(() => {
        if (typeof onRsvpSuccess === 'function') onRsvpSuccess(successPayload);
        setIsSubmitting(false);
        setBtnText('Submit RSVP');
        setBtnGreen(false);
      }, 350);
      return;
    }

    setIsSubmitting(true);
    setBtnText('Submitting...');
    try {
      await apiRequest(`/api/public/invite/${encodeURIComponent(guestToken)}/rsvp`, {
        method: 'POST',
        body: {
          status,
          attendingCount,
          wishes: wishesPayload,
        },
      });

      setBtnText(status === 'ATTENDING' ? 'RSVP Confirmed ✓' : 'RSVP Declined ✓');
      setBtnGreen(true);

      setTimeout(() => {
        if (typeof onRsvpSuccess === 'function') onRsvpSuccess(successPayload);
      }, 350);
    } catch (err) {
      setRsvpError(err?.message || 'Could not save RSVP. Please try again.');
      setBtnText('Submit RSVP');
      setBtnGreen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full h-[40px] bg-white border border-[#CFDFFD] rounded-lg px-[14px] font-instrument text-[13px] text-[#0F172A] shadow-[0_1px_3px_rgba(8,4,128,0.04)] focus:outline-none focus:border-[#2563EB] focus:ring-[2.5px] focus:ring-[#2563EB]/15 placeholder:text-[#94A3B8]';

  return (
    <section
      id="page-3"
      data-page="3"
      data-invite-page="rsvp"
      className="relative w-[390px] flex-shrink-0 overflow-hidden snap-start snap-always bg-rsvp-grad select-none"
      style={{ height: pageHeight, minHeight: pageHeight, ...corporatePageGradientStyle(fields) }}
    >
      <div
        className="relative z-[2] w-[390px] mx-auto select-none flex flex-col px-[37px] pb-7"
        style={{ minHeight: pageHeight }}
      >
        <div className="pt-[28px] w-full flex flex-col items-center justify-start text-center shrink-0 mb-5">
          <h2 className="font-petrona font-bold text-[27px] leading-[1.15] text-[var(--corp-text-primary)] tracking-[-0.01em] m-0">
            Confirm Your Attendance
          </h2>
          <p className="font-instrument font-medium text-[11.5px] leading-[1.25] text-[var(--corp-text-primary)] mt-[5px] tracking-[0.02em]">
            We&apos;d be delighted to have you with us
          </p>
        </div>

        <form
          id="rsvp-form"
          onSubmit={handleSubmit}
          noValidate={previewBypassValidation}
          className="w-full flex flex-col gap-5 flex-1"
          data-dynamic-field="rsvpQuestions"
        >
          {questions.map((question, index) => {
            const key = fieldKey(question, index);
            const type = String(question?.inputType || 'text').toLowerCase();
            const label = question?.label || `Field ${index + 1}`;
            const opts = parseOptionList(question?.options);

            if (type === 'textarea' || type === 'text_container') {
              return (
                <div key={key} className="w-full flex flex-col gap-[6px]">
                  <label
                    htmlFor={key}
                    className="font-instrument font-bold text-[12.5px] leading-[1.15] text-[var(--corp-text-primary)] tracking-[0.01em]"
                  >
                    {label}
                  </label>
                  <textarea
                    id={key}
                    name={key}
                    value={answers[key] || ''}
                    onChange={(e) => setAnswer(key, e.target.value)}
                    className="w-full h-[94px] bg-white border border-[#CFDFFD] rounded-lg p-[10px_14px] font-instrument text-[13px] text-[#0F172A] resize-none shadow-[0_1px_3px_rgba(8,4,128,0.04)] focus:outline-none focus:border-[#2563EB] focus:ring-[2.5px] focus:ring-[#2563EB]/15 placeholder:text-[#94A3B8]"
                    placeholder="Your answer"
                  />
                </div>
              );
            }

            if (type === 'radio') {
              return (
                <div key={key} className="w-full flex flex-col gap-[6px]">
                  <span className="font-instrument font-bold text-[12.5px] leading-[1.15] text-[var(--corp-text-primary)] tracking-[0.01em]">
                    {label}
                  </span>
                  <div className="flex flex-col gap-2 mt-[2px]">
                    {(opts.length ? opts : ['Yes', 'No']).map((opt, optIdx) => {
                      const id = `${key}_${optIdx}`;
                      const checked = answers[key] === opt;
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-[10px] cursor-pointer relative select-none py-[2px]"
                          htmlFor={id}
                        >
                          <input
                            type="radio"
                            id={id}
                            name={key}
                            value={opt}
                            checked={checked}
                            onChange={() => setAnswer(key, opt)}
                            className="custom-radio-input absolute opacity-0 cursor-pointer w-0 h-0"
                            required={!previewBypassValidation && optIdx === 0}
                          />
                          <span
                            className="radio-custom-indicator w-[18px] h-[18px] rounded-full border-2 border-[#94A3B8] bg-white inline-flex items-center justify-center flex-shrink-0 transition-colors"
                            aria-hidden="true"
                          />
                          <span
                            className={`font-instrument text-[13px] leading-[1.2] transition-colors ${
                              checked
                                ? 'text-[#1E293B] font-semibold'
                                : 'text-[#475569] font-medium'
                            }`}
                          >
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (type === 'dropdown') {
              return (
                <div key={key} className="w-full flex flex-col gap-[6px]">
                  <label
                    htmlFor={key}
                    className="font-instrument font-bold text-[12.5px] leading-[1.15] text-[var(--corp-text-primary)] tracking-[0.01em]"
                  >
                    {label}
                  </label>
                  <div className="relative w-full h-[40px]">
                    <select
                      id={key}
                      name={key}
                      value={answers[key] || ''}
                      onChange={(e) => setAnswer(key, e.target.value)}
                      className="w-full h-[40px] bg-white border border-[#CFDFFD] rounded-lg px-[14px] pr-[34px] font-instrument text-[13px] text-[#4944DF] appearance-none cursor-pointer shadow-[0_1px_3px_rgba(8,4,128,0.04)] focus:outline-none focus:border-[#2563EB] focus:ring-[2.5px] focus:ring-[#2563EB]/15"
                      required={!previewBypassValidation}
                    >
                      <option value="" disabled hidden>
                        Select…
                      </option>
                      {opts.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-[14px] top-1/2 -translate-y-1/2 pointer-events-none"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--corp-text-primary)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              );
            }

            // text (default) — includes Number of Guests
            const isGuestCount = /number of guest|guests? count|how many guest/i.test(label);
            return (
              <div key={key} className="w-full flex flex-col gap-[6px]">
                <label
                  htmlFor={key}
                  className="font-instrument font-bold text-[12.5px] leading-[1.15] text-[var(--corp-text-primary)] tracking-[0.01em]"
                >
                  {label}
                  {isGuestCount && maxGuests > 1 ? (
                    <span className="font-normal text-[11px] text-[#64748B] ml-1.5">
                      (Up to {maxGuests})
                    </span>
                  ) : null}
                </label>
                <input
                  type={isGuestCount ? 'number' : 'text'}
                  id={key}
                  name={key}
                  min={isGuestCount ? 1 : undefined}
                  max={isGuestCount ? maxGuests : undefined}
                  value={answers[key] || ''}
                  onChange={(e) => {
                    if (isGuestCount) {
                      const digits = e.target.value.replace(/\D/g, '');
                      let n = Number(digits);
                      if (maxGuests && n > maxGuests) n = maxGuests;
                      setAnswer(key, digits === '' ? '' : String(n));
                    } else {
                      setAnswer(key, e.target.value);
                    }
                  }}
                  className={inputClass}
                  placeholder={isGuestCount ? `1 (Max: ${maxGuests})` : label}
                  required={
                    !previewBypassValidation && !/optional/i.test(label)
                  }
                />
              </div>
            );
          })}

          {rsvpError ? (
            <div className="w-full bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2.5 text-center font-instrument">
              {rsvpError}
            </div>
          ) : null}

          <button
            type="submit"
            id="rsvp-submit-btn"
            disabled={isSubmitting}
            style={{ backgroundColor: btnGreen ? '#059669' : undefined }}
            className={`mt-1 w-full max-w-[280px] mx-auto h-[40px] px-4 rounded-lg font-instrument font-bold text-[13.5px] text-white tracking-[0.02em] cursor-pointer shadow-[0_4px_14px_rgba(8,4,128,0.28)] flex items-center justify-center transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(8,4,128,0.35)] active:translate-y-[1px] ${
              !btnGreen ? 'bg-[var(--corp-text-primary)] hover:opacity-90' : ''
            }`}
          >
            {btnText}
          </button>
        </form>
      </div>
    </section>
  );
};

export default RsvpPage;
