"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Page3.module.css";
import {
  computeRsvpHeight,
  parseOptionList,
} from "@/lib/partyLayoutMetrics";
import { partyPageSurfaceStyle } from "@/lib/partyPageStyles";
import { apiRequest } from "@/lib/api";

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
  guestToken = null,
  maxGuests = 1,
  guest = null,
  onScrollNext = null,
}) {
  const questions =
    Array.isArray(fields.rsvpQuestions) && fields.rsvpQuestions.length
      ? fields.rsvpQuestions
      : DEFAULT_QUESTIONS;

  const heading = fields.rsvpHeading || "Be Our Guest";
  const script = fields.rsvpScript || "RSVP";
  const tagline = fields.rsvpTagline || "We'd love to celebrate with you!";
  const pageHeight = computeRsvpHeight(questions);

  // Keep every field as empty only with placeholders so guests can fill them
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
  const [btnText, setBtnText] = useState("Submit RSVP");

  const questionKeyList = useMemo(() => {
    return questions.map((q, i) => `${fieldKey(q, i)}:${q?.inputType}`).join("|");
  }, [questions]);

  // When question schema changes (e.g. admin template editor), merge any new keys without wiping existing user answers
  useEffect(() => {
    setAnswers((prev) => {
      let changed = false;
      const next = { ...prev };
      questions.forEach((q, i) => {
        const key = fieldKey(q, i);
        if (next[key] === undefined) {
          changed = true;
          const type = String(q?.inputType || "text").toLowerCase();
          if (type === "radio") {
            const opts = parseOptionList(q?.options);
            next[key] = opts[0] || "";
          } else {
            next[key] = "";
          }
        }
      });
      return changed ? next : prev;
    });
  }, [questionKeyList, questions]);

  const setAnswer = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const isDeclined = useMemo(() => {
    const attendIndex = questions.findIndex((q) => looksLikeAttendance(q?.label || ""));
    if (attendIndex < 0) return false;
    const key = fieldKey(questions[attendIndex], attendIndex);
    const val = String(answers[key] || "").toLowerCase();
    return /can.?t|cannot|\bno\b|sorry|decline|won.?t|unable|not/i.test(val);
  }, [questions, answers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRsvpError("");

    // Determine attendance
    let status = "ATTENDING";
    let attendanceVal = "yes";
    const attendIndex = questions.findIndex((q) => looksLikeAttendance(q?.label || ""));
    if (attendIndex >= 0) {
      const key = fieldKey(questions[attendIndex], attendIndex);
      const val = String(answers[key] || "").toLowerCase();
      if (/can.?t|cannot|\bno\b|sorry|decline|won.?t|unable|not/i.test(val)) {
        status = "DECLINED";
        attendanceVal = "no";
      }
    }

    // Determine guest count
    let attendingCount = 0;
    const limit = Math.max(1, Number(maxGuests) || 1);
    if (status === "ATTENDING") {
      const guestsIndex = questions.findIndex((q) =>
        /number of guest|guests? count|how many guest|attendee/i.test(q?.label || "")
      );
      if (guestsIndex >= 0) {
        const gKey = fieldKey(questions[guestsIndex], guestsIndex);
        const digits = String(answers[gKey] || "").replace(/\D/g, "");
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
    const wishesPayload = notes.join("\n");

    const mealQ = questions.find((q) => /meal/i.test(q?.label || ""));
    const mealVal = mealQ ? answers[fieldKey(mealQ, questions.indexOf(mealQ))] : "";
    const reqQ = questions.find((q) =>
      /special requirement|dietary|wishes|note/i.test(q?.label || "")
    );
    const reqVal = reqQ ? answers[fieldKey(reqQ, questions.indexOf(reqQ))] : "";

    const successPayload = {
      ...answers,
      attendance: attendanceVal,
      attendingStatus: status === "ATTENDING" ? "confirmed" : "declined",
      attendingCount,
      guests: attendingCount,
      meal: mealVal,
      mealPreference: mealVal,
      specialRequirements: reqVal,
      requirements: reqVal,
      wishes: wishesPayload,
    };

    if (!guestToken) {
      setIsSubmitting(true);
      setBtnText(status === "ATTENDING" ? "RSVP Confirmed ✓" : "RSVP Declined ✓");
      setTimeout(() => {
        if (typeof onRsvpSuccess === "function") onRsvpSuccess(successPayload);
        setIsSubmitting(false);
        setBtnText("Submit RSVP");
      }, 350);
      return;
    }

    setIsSubmitting(true);
    setBtnText("Submitting...");
    try {
      const nameQ = questions.find((q) => /full\s*name|your\s*name|^name$/i.test(q?.label || ""));
      const nameVal = nameQ ? answers[fieldKey(nameQ, questions.indexOf(nameQ))] : "";
      const phoneQ = questions.find((q) => /phone|mobile|whatsapp/i.test(q?.label || ""));
      const phoneVal = phoneQ ? answers[fieldKey(phoneQ, questions.indexOf(phoneQ))] : "";

      await apiRequest(`/api/public/invite/${encodeURIComponent(guestToken)}/rsvp`, {
        method: "POST",
        body: {
          status,
          attendingCount,
          wishes: wishesPayload,
          fullName: nameVal || undefined,
          whatsappNumber: phoneVal || undefined,
        },
      });

      setBtnText(status === "ATTENDING" ? "RSVP Confirmed ✓" : "RSVP Declined ✓");

      setTimeout(() => {
        if (typeof onRsvpSuccess === "function") onRsvpSuccess(successPayload);
      }, 350);
    } catch (err) {
      setRsvpError(err?.message || "Could not save RSVP. Please try again.");
      setBtnText("Submit RSVP");
    } finally {
      setIsSubmitting(false);
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

            const isGuestCount = /number of guest|guests? count|how many guest/i.test(label);
            return (
              <div className={styles.fieldGroup} key={key}>
                <label className={styles.fieldLabel} htmlFor={key}>
                  {label}
                  {isGuestCount && maxGuests > 1 ? (
                    <span style={{ fontWeight: 400, fontSize: "11px", opacity: 0.8, marginLeft: "6px" }}>
                      (Up to {maxGuests})
                    </span>
                  ) : null}
                </label>
                <input
                  id={key}
                  type={isGuestCount ? "number" : "text"}
                  min={isGuestCount ? 1 : undefined}
                  max={isGuestCount ? maxGuests : undefined}
                  className={styles.inputField}
                  placeholder={
                    isGuestCount
                      ? isDeclined
                        ? "0 (Declined)"
                        : `1 (Max: ${maxGuests})`
                      : label
                  }
                  value={isDeclined && isGuestCount ? "0" : (answers[key] || "")}
                  disabled={isDeclined && isGuestCount}
                  onChange={(e) => {
                    if (isGuestCount) {
                      const digits = e.target.value.replace(/\D/g, "");
                      let n = Number(digits);
                      if (maxGuests && n > maxGuests) n = maxGuests;
                      setAnswer(key, digits === "" ? "" : String(n));
                    } else {
                      setAnswer(key, e.target.value);
                    }
                  }}
                  required={
                    !previewBypassValidation &&
                    !/optional/i.test(label) &&
                    !(isDeclined && isGuestCount)
                  }
                />
              </div>
            );
          })}

          {rsvpError ? (
            <div style={{ color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", textAlign: "center" }}>
              {rsvpError}
            </div>
          ) : null}

          <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
            {btnText}
          </button>

          {typeof onScrollNext === "function" ? (
            <div
              role="button"
              tabIndex={0}
              className={styles.scrollGroup}
              onClick={onScrollNext}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onScrollNext?.();
                }
              }}
              aria-label="Scroll down to explore"
            >
              <div className={styles.scrollButton}>
                <svg viewBox="0 0 24 24">
                  <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className={styles.scrollText}>SCROLL  TO  EXPLORE</span>
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
