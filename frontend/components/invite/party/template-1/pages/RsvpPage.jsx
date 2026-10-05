"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Page3.module.css";
import {
  computeRsvpHeight,
  parseOptionList,
} from "@/lib/partyLayoutMetrics";
import { partyPageSurfaceStyle } from "@/lib/partyPageStyles";

const DEFAULT_QUESTIONS = [
  { label: "Full name", inputType: "text", options: "" },
  { label: "Email", inputType: "text", options: "" },
  { label: "Phone Number", inputType: "text", options: "" },
  {
    label: "Will you attend?",
    inputType: "radio",
    options: "Yes I'll attend, Sorry I can't attend",
  },
  { label: "Number of Guests", inputType: "text", options: "" },
  {
    label: "Meal Preference",
    inputType: "dropdown",
    options: "Vegetarian, Non-Vegetarian",
  },
  {
    label: "Any Special Requirements (Optional)",
    inputType: "textarea",
    options: "",
  },
];

function fieldKey(question, index) {
  return `q_${index}_${String(question?.label || "field")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")}`;
}

function looksLikeAttendance(label = "") {
  return /attend/i.test(label);
}

export default function RsvpPage({
  fields = {},
  onRsvpSuccess,
  contentScale = 1,
  previewBypassValidation = false,
}) {
  const questions =
    Array.isArray(fields.rsvpQuestions) && fields.rsvpQuestions.length
      ? fields.rsvpQuestions
      : DEFAULT_QUESTIONS;

  const heading = fields.rsvpHeading || "Be Our Guest";
  const script = fields.rsvpScript || "RSVP";
  const tagline = fields.rsvpTagline || "We'd love to celebrate with you!";
  const pageHeight = computeRsvpHeight(questions);

  const initialAnswers = useMemo(() => {
    const next = {};
    questions.forEach((q, i) => {
      const key = fieldKey(q, i);
      const type = String(q?.inputType || "text").toLowerCase();
      if (type === "radio") {
        const opts = parseOptionList(q?.options);
        next[key] = opts[0] || "";
      } else {
        next[key] = "";
      }
    });
    return next;
  }, [questions]);

  const [answers, setAnswers] = useState(initialAnswers);

  useEffect(() => {
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  const setAnswer = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...answers };
    const attendQ = questions.findIndex((q) => looksLikeAttendance(q.label));
    if (attendQ >= 0) {
      const key = fieldKey(questions[attendQ], attendQ);
      const val = String(answers[key] || "").toLowerCase();
      payload.attendance = /can.?t|no|sorry/i.test(val) ? "no" : "yes";
    } else {
      payload.attendance = "yes";
    }
    if (typeof onRsvpSuccess === "function") {
      onRsvpSuccess(payload);
    }
  };

  return (
    <section
      className={styles.pageContainer}
      id="page-3"
      data-invite-page="rsvp"
      aria-label="RSVP"
      style={{
        ...partyPageSurfaceStyle(fields, pageHeight),
        height: "auto",
        transform: contentScale !== 1 ? `scale(${contentScale})` : undefined,
        transformOrigin: "top center",
      }}
    >
      <img
        src="/assets/events/parties/templates/template-1/chrome/rsvp-page/background.webp"
        alt=""
        className={styles.topDeco}
      />

      <div className={styles.contentColumn}>
        <div className={styles.headerBlock}>
          <h2 className={styles.beOurGuest}>{heading}</h2>
          <div className={styles.rsvpText}>{script}</div>
          <div className={styles.underlineDeco}>
            <img
              src="/assets/events/parties/templates/template-1/chrome/rsvp-page/underline-deco.webp"
              alt=""
            />
          </div>
          <p className={styles.celebrateWithYou}>{tagline}</p>
        </div>

        <form
          className={styles.formContainerFlow}
          onSubmit={handleSubmit}
          autoComplete="off"
          noValidate={previewBypassValidation}
          data-dynamic-field="rsvpQuestions"
        >
          {questions.map((question, index) => {
            const key = fieldKey(question, index);
            const type = String(question?.inputType || "text").toLowerCase();
            const label = question?.label || `Question ${index + 1}`;

            if (type === "radio") {
              const opts = parseOptionList(question?.options);
              return (
                <div className={styles.fieldGroup} key={key}>
                  <label className={styles.fieldLabel}>{label}</label>
                  <div
                    className={styles.radioGroup}
                    role="radiogroup"
                    aria-label={label}
                  >
                    {opts.map((opt) => (
                      <div
                        key={opt}
                        className={`${styles.radioOption} ${
                          answers[key] === opt ? styles.radioSelected : ""
                        }`}
                        onClick={() => setAnswer(key, opt)}
                      >
                        <div className={styles.radioCircle}>
                          {answers[key] === opt ? (
                            <div className={styles.radioDot} />
                          ) : null}
                        </div>
                        <span className={styles.radioText}>{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (type === "dropdown") {
              const opts = parseOptionList(question?.options);
              return (
                <div className={styles.fieldGroup} key={key}>
                  <label className={styles.fieldLabel} htmlFor={key}>
                    {label}
                  </label>
                  <div className={styles.selectWrapper}>
                    <select
                      id={key}
                      className={`${styles.selectField} ${
                        !answers[key] ? styles.selectPlaceholder : ""
                      }`}
                      value={answers[key] || ""}
                      onChange={(e) => setAnswer(key, e.target.value)}
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
                      className={styles.selectArrow}
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              );
            }

            return (
              <div className={styles.fieldGroup} key={key}>
                <label className={styles.fieldLabel} htmlFor={key}>
                  {label}
                </label>
                <input
                  id={key}
                  type="text"
                  className={styles.inputField}
                  value={answers[key] || ""}
                  onChange={(e) => setAnswer(key, e.target.value)}
                />
              </div>
            );
          })}

          <button type="submit" className={styles.submitButton}>
            Submit RSVP
          </button>
        </form>
      </div>
    </section>
  );
}
