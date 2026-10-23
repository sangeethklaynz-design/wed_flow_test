'use client';

import React, { useMemo, useState } from 'react';
import {
  computeRsvpHeight,
  DEFAULT_RSVP_QUESTIONS,
  parseOptionList,
} from '@/lib/corporateLayoutMetrics';
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
  onScrollNext = null,
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
        next[key] = opts[0] || "Yes, I'll attend";
      } else if (type === 'dropdown') {
        const opts = parseOptionList(q?.options);
        next[key] = opts[0] || 'Veg or Non-Veg';
      } else {
        next[key] = '';
      }
    });
    return next;
  }, [questions]);

  const [answers, setAnswers] = useState(initialAnswers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rsvpError, setRsvpError] = useState('');
  const [btnText, setBtnText] = useState('Confirm RSVP');
  const [btnGreen, setBtnGreen] = useState(false);

  const questionKeyList = React.useMemo(() => {
    return questions.map((q, i) => `${fieldKey(q, i)}:${q?.inputType}`).join('|');
  }, [questions]);

  // Merge schema updates smoothly without losing user input
  React.useEffect(() => {
    setAnswers((prev) => {
      let changed = false;
      const next = { ...prev };
      questions.forEach((q, i) => {
        const key = fieldKey(q, i);
        if (next[key] === undefined) {
          changed = true;
          const type = String(q?.inputType || 'text').toLowerCase();
          if (type === 'radio') {
            const opts = parseOptionList(q?.options);
            next[key] = opts[0] || "Yes, I'll attend";
          } else if (type === 'dropdown') {
            const opts = parseOptionList(q?.options);
            next[key] = opts[0] || 'Veg or Non-Veg';
          } else {
            next[key] = '';
          }
        }
      });
      return changed ? next : prev;
    });
  }, [questionKeyList, questions]);

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
    let attendingCount = 1;
    if (status === 'ATTENDING') {
      const gIndex = questions.findIndex((q) =>
        /number of guest|guests? count|how many guest/i.test(q?.label || '')
      );
      if (gIndex >= 0) {
        const gKey = fieldKey(questions[gIndex], gIndex);
        const digits = String(answers[gKey] ?? '').replace(/\D/g, '');
        const limit = maxGuests > 1 ? maxGuests : 1;
        let n = Number(digits);
        if (!digits || !Number.isInteger(n) || n < 1) n = 1;
        if (n > limit) n = limit;
        attendingCount = n;
      }
    }

    // Format extra notes / special requirements
    const notes = [];
    questions.forEach((q, i) => {
      const k = fieldKey(q, i);
      const lbl = q?.label || `Field ${i + 1}`;
      if (
        /attend/i.test(lbl) ||
        /number of guest|guests? count|how many guest/i.test(lbl)
      ) {
        return;
      }
      const val = answers[k];
      if (val && String(val).trim()) {
        notes.push(`${lbl}: ${String(val).trim()}`);
      }
    });
    const wishesPayload = notes.join('\n');

    // Extract first name, last name, full name
    const fNameQ = questions.find((q) => /first\s*name/i.test(q?.label || ''));
    const lNameQ = questions.find((q) => /last\s*name/i.test(q?.label || ''));
    const fNameVal = fNameQ ? answers[fieldKey(fNameQ, questions.indexOf(fNameQ))] : '';
    const lNameVal = lNameQ ? answers[fieldKey(lNameQ, questions.indexOf(lNameQ))] : '';
    const fullNameVal = [fNameVal, lNameVal].filter(Boolean).join(' ') || answers[fieldKey(questions[0], 0)] || '';

    // Extract phone & nic
    const phoneQ = questions.find((q) => /phone|mobile|whatsapp/i.test(q?.label || ''));
    const phoneVal = phoneQ ? answers[fieldKey(phoneQ, questions.indexOf(phoneQ))] : '';
    const nicQ = questions.find((q) => /nic|identity/i.test(q?.label || ''));
    const nicVal = nicQ ? answers[fieldKey(nicQ, questions.indexOf(nicQ))] : '';

    const mealQ = questions.find((q) => /meal/i.test(q?.label || ''));
    const mealVal = mealQ ? answers[fieldKey(mealQ, questions.indexOf(mealQ))] : '';

    const reqQ = questions.find((q) => /special requirement|requirement|preference|note/i.test(q?.label || ''));
    const reqVal = reqQ ? answers[fieldKey(reqQ, questions.indexOf(reqQ))] : '';

    const successPayload = {
      ...answers,
      fullName: fullNameVal,
      firstName: fNameVal,
      lastName: lNameVal,
      nic: nicVal,
      attendance: attendanceVal,
      attendingStatus: status === 'ATTENDING' ? 'confirmed' : 'declined',
      attendingCount,
      guestCount: attendingCount,
      guests: attendingCount,
      meal: mealVal,
      mealPreference: mealVal,
      specialRequirements: reqVal,
      requirements: reqVal,
      wishes: wishesPayload,
    };

    if (!guestToken) {
      setIsSubmitting(true);
      setBtnText(status === 'ATTENDING' ? 'RSVP Confirmed ✓' : 'RSVP Declined ✓');
      setBtnGreen(true);
      setTimeout(() => {
        if (typeof onRsvpSuccess === 'function') onRsvpSuccess(successPayload);
        setIsSubmitting(false);
        setBtnText('Confirm RSVP');
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
          fullName: fullNameVal || undefined,
          whatsappNumber: phoneVal || undefined,
          nic: nicVal || undefined,
        },
      });

      setBtnText(status === 'ATTENDING' ? 'RSVP Confirmed ✓' : 'RSVP Declined ✓');
      setBtnGreen(true);

      setTimeout(() => {
        if (typeof onRsvpSuccess === 'function') onRsvpSuccess(successPayload);
      }, 350);
    } catch (err) {
      setRsvpError(err?.message || 'Could not save RSVP. Please try again.');
      setBtnText('Confirm RSVP');
      setBtnGreen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full h-[42px] bg-white border border-[#CBD5E1] rounded-[10px] px-3.5 font-sans text-[13px] text-[#0F172A] shadow-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 placeholder:text-[#94A3B8] transition-all';

  return (
    <section
      id="page-3"
      data-page="3"
      data-invite-page="rsvp"
      className="relative w-[390px] flex-shrink-0 snap-start snap-always select-none overflow-hidden"
      style={{
        height: 'auto',
        minHeight: Math.max(844, pageHeight),
        background:
          'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 30%, #F0F6FE 70%, #DCEAFC 100%)',
      }}
    >
      <div
        className="relative z-[2] w-[390px] mx-auto select-none flex flex-col px-[28px] pb-9"
        style={{ minHeight: Math.max(844, pageHeight) }}
      >
        {/* Title & Subtitle (Matches Screenshot 1 Exactly) */}
        <div className="pt-[32px] pb-4 w-full flex flex-col items-center justify-start text-center shrink-0">
          <h2
            className="font-serif font-bold text-[28px] leading-[34px] text-[#080480] tracking-[-0.01em] m-0"
            style={{ fontFamily: "'Playfair Display', 'Petrona', 'Georgia', serif" }}
          >
            Confirm Your Attendance
          </h2>
          <p className="font-sans font-medium text-[12px] leading-[16px] text-[#1E293B] mt-[6px] tracking-normal">
            We&apos;d be an delighted to have you with us
          </p>
        </div>

        {/* RSVP Form */}
        <form
          id="rsvp-form"
          onSubmit={handleSubmit}
          noValidate={previewBypassValidation}
          className="w-full flex flex-col gap-3.5 flex-1 mt-1"
          data-dynamic-field="rsvpQuestions"
        >
          {questions.map((question, index) => {
            const key = fieldKey(question, index);
            const type = String(question?.inputType || 'text').toLowerCase();
            const label = question?.label || `Field ${index + 1}`;
            const placeholder = question?.placeholder || '';
            const helperText = question?.helperText || '';
            const opts = parseOptionList(question?.options);

            // Textarea (e.g. Any Special Requirements)
            if (type === 'textarea' || type === 'text_container' || type === 'textcontainer') {
              return (
                <div key={key} className="w-full flex flex-col gap-1">
                  <label
                    htmlFor={key}
                    className="font-sans font-bold text-[12.5px] leading-tight text-[#080480] tracking-normal"
                  >
                    {label}
                  </label>
                  <textarea
                    id={key}
                    name={key}
                    value={answers[key] || ''}
                    onChange={(e) => setAnswer(key, e.target.value)}
                    className="w-full h-[78px] bg-white border border-[#CBD5E1] rounded-[10px] p-3 font-sans text-[13px] text-[#0F172A] resize-none shadow-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 placeholder:text-[#94A3B8] transition-all"
                    placeholder={placeholder || 'e.g. Food preference'}
                  />
                </div>
              );
            }

            // Radio group (e.g. Will you attend?)
            if (type === 'radio') {
              let radioOpts = opts.length ? opts : ["Yes, I'll attend", "Sorry, I can't attend"];
              if (/attend/i.test(label) && (radioOpts.length !== 2 || radioOpts.some((o) => o.toLowerCase() === 'yes'))) {
                radioOpts = ["Yes, I'll attend", "Sorry, I can't attend"];
              }
              return (
                <div key={key} className="w-full flex flex-col gap-1 pt-0.5">
                  <span className="font-sans font-bold text-[12.5px] leading-tight text-[#080480] tracking-normal">
                    {label}
                  </span>
                  <div className="flex flex-col gap-2.5 mt-1">
                    {radioOpts.map((opt, optIdx) => {
                      const id = `${key}_${optIdx}`;
                      const checked =
                        answers[key] === opt ||
                        (!answers[key] && optIdx === 0);
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-2.5 cursor-pointer relative select-none py-0.5"
                          htmlFor={id}
                        >
                          <input
                            type="radio"
                            id={id}
                            name={key}
                            value={opt}
                            checked={checked}
                            onChange={() => setAnswer(key, opt)}
                            className="sr-only"
                          />
                          <div
                            className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                              checked ? 'border-[#2563EB] bg-white' : 'border-[#94A3B8] bg-white'
                            }`}
                          >
                            {checked && (
                              <div className="w-[8.5px] h-[8.5px] rounded-full bg-[#2563EB]" />
                            )}
                          </div>
                          <span
                            className={`font-sans text-[13px] leading-tight transition-colors ${
                              checked ? 'font-bold text-[#334155]' : 'font-normal text-[#64748B]'
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

            // Dropdown (e.g. Meal Preference)
            if (type === 'dropdown') {
              const dropOpts = opts.length
                ? opts
                : ['Veg or Non-Veg', 'Vegetarian', 'Non-Vegetarian'];
              return (
                <div key={key} className="w-full flex flex-col gap-1">
                  <label
                    htmlFor={key}
                    className="font-sans font-bold text-[12.5px] leading-tight text-[#080480] tracking-normal"
                  >
                    {label}
                  </label>
                  <div className="relative w-full h-[42px]">
                    <select
                      id={key}
                      name={key}
                      value={answers[key] || dropOpts[0] || ''}
                      onChange={(e) => setAnswer(key, e.target.value)}
                      className="w-full h-[42px] bg-white border border-[#CBD5E1] rounded-[10px] px-3.5 pr-9 font-sans text-[13px] text-[#334155] appearance-none cursor-pointer shadow-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                    >
                      {dropOpts.map((opt, optIdx) => (
                        <option
                          key={opt}
                          value={opt}
                          disabled={optIdx === 0 && opt.toLowerCase().includes('or')}
                        >
                          {opt}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-[#080480]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
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

            // Default Text input (First Name, Last Name, Email, Mobile, NIC, Number of Guests)
            const isGuestCount = /number of guest|guests? count|how many guest/i.test(label);
            const isNic = /nic|national identity/i.test(label);
            const defaultPlaceholder =
              placeholder ||
              (isGuestCount
                ? '1'
                : /first\s*name/i.test(label)
                ? 'Kavindu'
                : /last\s*name/i.test(label)
                ? 'Perera'
                : /email/i.test(label)
                ? 'kavindu@gmail.com'
                : /mobile|phone/i.test(label)
                ? '+94  77  123  4567'
                : isNic
                ? '199012345678'
                : label);

            const fieldHelper =
              helperText ||
              (isNic ? 'You can update your NIC later when purchasing tickets if you need.' : '');

            return (
              <div key={key} className="w-full flex flex-col gap-1">
                <label
                  htmlFor={key}
                  className="font-sans font-bold text-[12.5px] leading-tight text-[#080480] tracking-normal"
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
                  placeholder={defaultPlaceholder}
                  required={!previewBypassValidation && !/optional/i.test(label)}
                />
                {fieldHelper ? (
                  <p className="font-sans text-[10px] leading-tight text-[#94A3B8] mt-0.5 m-0">
                    {fieldHelper}
                  </p>
                ) : null}
              </div>
            );
          })}

          {rsvpError ? (
            <div className="w-full bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2.5 text-center font-sans">
              {rsvpError}
            </div>
          ) : null}

          {/* Confirm RSVP Submit Button (Matches Screenshot 1 Exactly) */}
          <button
            type="submit"
            id="rsvp-submit-btn"
            disabled={isSubmitting}
            style={{
              backgroundColor: btnGreen ? '#059669' : '#080480',
              color: '#ffffff',
            }}
            className="w-full h-[46px] rounded-[12px] font-sans font-bold text-[14.5px] text-white tracking-wide cursor-pointer shadow-[0_4px_14px_rgba(8,4,128,0.25)] flex items-center justify-center transition-all duration-150 hover:bg-[#060368] active:scale-[0.99] mt-3 disabled:opacity-50"
          >
            {btnText}
          </button>

          {typeof onScrollNext === 'function' ? (
            <div
              role="button"
              tabIndex={0}
              onClick={onScrollNext}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onScrollNext?.();
                }
              }}
              className="mt-4 mb-2 flex flex-col items-center justify-center cursor-pointer group mx-auto select-none"
              aria-label="Scroll down to explore"
            >
              <div className="px-3.5 py-1.5 rounded-full bg-white/95 border border-[#BED5EE] shadow-sm flex items-center gap-1.5 transition-all group-hover:scale-105">
                <span className="font-sans font-bold text-[9px] text-[#080480] uppercase tracking-[0.2em]">
                  Scroll to Explore
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#080480" strokeWidth="2.5">
                  <path d="M7 10l5 5 5-5" />
                </svg>
              </div>
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
};

export default RsvpPage;
