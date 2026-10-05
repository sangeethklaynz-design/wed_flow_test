'use client';

import React, { useMemo, useState } from 'react';
import {
  computeRsvpHeight,
  DEFAULT_RSVP_QUESTIONS,
  parseOptionList,
} from '@/lib/corporateLayoutMetrics';
import { corporatePageGradientStyle } from '@/lib/corporatePageStyles';

function fieldKey(question, index) {
  return `q_${index}_${String(question?.label || 'field')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')}`;
}

export const RsvpPage = ({
  fields = {},
  onRsvpSuccess,
  previewBypassValidation = false,
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
  const [btnText, setBtnText] = useState('Submit RSVP');
  const [btnGreen, setBtnGreen] = useState(false);

  // Reset when question set changes (admin live preview)
  React.useEffect(() => {
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  const setAnswer = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBtnText('RSVP Confirmed ✓');
    setBtnGreen(true);
    setTimeout(() => {
      if (typeof onRsvpSuccess === 'function') onRsvpSuccess(answers);
    }, 350);
    setTimeout(() => {
      setBtnText('Submit RSVP');
      setBtnGreen(false);
      setIsSubmitting(false);
    }, 3500);
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
            return (
              <div key={key} className="w-full flex flex-col gap-[6px]">
                <label
                  htmlFor={key}
                  className="font-instrument font-bold text-[12.5px] leading-[1.15] text-[var(--corp-text-primary)] tracking-[0.01em]"
                >
                  {label}
                </label>
                <input
                  type="text"
                  id={key}
                  name={key}
                  value={answers[key] || ''}
                  onChange={(e) => setAnswer(key, e.target.value)}
                  className={inputClass}
                  placeholder={label}
                  required={
                    !previewBypassValidation && !/optional/i.test(label)
                  }
                />
              </div>
            );
          })}

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
