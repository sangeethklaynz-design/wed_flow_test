"use client";

import { useState } from "react";
import styles from "./RsvpChangeRequestPage.module.css";

export default function RsvpChangeRequestPage({
  rsvpData,
  guestToken = "",
  contentScale = 1,
}) {
  const [reason, setReason] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill with submitted RSVP values or sensible defaults
  const attendance = rsvpData?.attendance || "yes";
  const guestCount =
    rsvpData?.guestCount !== undefined
      ? String(rsvpData.guestCount)
      : attendance === "no"
      ? "0"
      : "1";
  const mealPreference = rsvpData?.mealPreference || "Veg or Non-Veg";
  const specialRequirements = rsvpData?.specialRequirements || "";

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setError("");
    if (!reason.trim()) {
      setError("Please tell us the reason for your change request.");
      return;
    }
    setSubmitting(true);
    try {
      const token =
        guestToken ||
        (typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("token") || ""
          : "");
      if (token) {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(
          `${apiUrl}/api/public/invite/${encodeURIComponent(token)}/rsvp-change-request`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: reason.trim() }),
          }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to submit change request");
        }
      }
      setRequestSubmitted(true);
    } catch (err) {
      setError(err.message || "Could not submit change request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.pageContainer} id="page-3" aria-label="Page 3 - RSVP Change Request">
      {/* Top Foliage Background - Figma: W: 390, H: 205 */}
      <img
        src="/assets/events/parties/templates/template-1/chrome/rsvp-change-request-page/top-bg.webp"
        alt="Top foliage decoration"
        className={styles.topDeco}
      />

      {/* Scaled Stage Container - exactly 390 x 944 reference canvas */}
      <div
        className={styles.stageWrapper}
        style={{
          minHeight: `${Math.round(944 * contentScale) + 24}px`,
        }}
      >
        <div
          className={styles.stage}
          style={{
            transform: `translateX(-50%) scale(${contentScale})`,
          }}
        >
        {/* 1. Heading "Need to Make a Change?" - Figma: X: 62, Y: 99, W: 264, H: 88, Plus Jakarta Sans Bold 35 */}
        <h1 className={styles.headingTitle}>
          Need to Make<br />a Change?
        </h1>

        {/* 2. Underline Decoration - Figma: X: 100, Y: 171, W: 188, H: 63 */}
        <div className={styles.underlineDeco} aria-hidden="true">
          <img
            src="/assets/events/parties/templates/template-1/chrome/rsvp-change-request-page/underline-deco.webp"
            alt="Gold flourish underline"
          />
        </div>

        {/* 3. Subtitle Description - Figma: X: 53, Y: 222, W: 283, H: 79, Inter Regular 13 */}
        <p className={styles.subtitleDesc}>
          If you’ve made a mistake or need to<br />
          update your RSVP, you can request to<br />
          enable changes<br />
          again
        </p>

        {/* 1. Will you attend? Label - Figma: X: 53, Y: 312, W: 119, H: 16 */}
        <h3 className={styles.willYouAttendLabel}>
          Will you attend?
        </h3>

        {/* 2. Radio Buttons Frame - Figma: X: 53, Y: 334, W: 174 Hug, H: 67 Hug, Gap: 1 */}
        <div className={styles.radioFrame} role="radiogroup" aria-label="Will you attend? (read only)">
          <div className={`${styles.radioRow} ${attendance === "yes" ? styles.radioRowSelected : ""}`}>
            <div className={styles.radioCircle}>
              {attendance === "yes" && <div className={styles.radioDot} />}
            </div>
            <span className={styles.radioText}>Yes, I'll attend</span>
          </div>
          <div className={`${styles.radioRow} ${attendance === "no" ? styles.radioRowSelected : ""}`}>
            <div className={styles.radioCircle}>
              {attendance === "no" && <div className={styles.radioDot} />}
            </div>
            <span className={styles.radioText}>Sorry, I can't attend</span>
          </div>
        </div>

        {/* 3. Number of Guests - Figma: X: 53, Y: 419, W: 300, H: 52 Hug, Gap: 6 */}
        <div className={styles.guestsFrame}>
          <label className={styles.inputLabel}>Number of Guests</label>
          <input
            type="text"
            className={styles.disabledInput}
            value={guestCount}
            readOnly
            disabled
            tabIndex={-1}
            aria-readonly="true"
          />
        </div>

        {/* 4. Meal Preference - Figma: X: 53, Y: 482, W: 300, H: 57, Spacing: 11 */}
        <div className={styles.mealPrefFrame}>
          <label className={styles.inputLabel}>
            Meal Preference <span className={styles.asterisk}>*</span>
          </label>
          <div className={styles.selectWrapper}>
            <input
              type="text"
              className={styles.disabledInput}
              value={mealPreference || "Veg or Non-Veg"}
              readOnly
              disabled
              tabIndex={-1}
              aria-readonly="true"
            />
            <svg
              className={styles.selectArrow}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#080480"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* 5. Any Special Requirements (Optional) - Figma: X: 53, Y: 567, W: 300, H: 66 Hug, Gap: 6 */}
        <div className={styles.specialReqFrame}>
          <label className={styles.inputLabel}>Any Special Requirements (Optional)</label>
          <input
            type="text"
            className={styles.disabledInputSpecial}
            value={specialRequirements}
            placeholder={!specialRequirements ? "e.g. Food preference" : ""}
            readOnly
            disabled
            tabIndex={-1}
            aria-readonly="true"
          />
        </div>

        {/* 6. Request Change Form */}
        <form onSubmit={handleSubmitRequest} className={styles.changeForm}>
          {/* Box with text "REQUEST FOR RSVP CHANGE" - Figma: X: 31, Y: 661, W: 336, H: 42 */}
          <div className={styles.bannerPill} aria-hidden="true">
            <svg
              className={styles.refreshIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#081368"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span className={styles.bannerText}>REQUEST  FOR  RSVP  CHANGE</span>
          </div>

          {/* Text "Tell us the reason" - Figma: X: 29, Y: 728, W: 138, H: 18, Inter Regular 15 */}
          <label className={styles.reasonLabel} htmlFor="rsvp-change-reason">
            Tell  us  the  reason
          </label>

          {/* Textbox - Figma: X: 29, Y: 759, W: 320, H: 61, Corner radius: 20 */}
          <textarea
            id="rsvp-change-reason"
            className={styles.reasonTextarea}
            placeholder="Write the reason....."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            disabled={submitting}
          />

          {error ? (
            <p style={{ color: "#b91c1c", fontSize: 12, margin: "8px 0 0" }}>
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? "SUBMITTING…" : "SUBMIT REQUEST"}
          </button>

          {/* Lock Icon + Text - Figma: X: 33.5, Y: 890, W: 329, H: 34, Spacing: 12 */}
          <div className={styles.lockNotice}>
            <svg
              className={styles.lockIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0174EF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className={styles.lockText}>
              Your request will be reviewed, and RSVP access will be enabled again once approved.
            </span>
          </div>
        </form>

        {/* Success Modal */}
        {requestSubmitted && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true">
            <div className={styles.modalCard}>
              <div className={styles.modalIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#00AF27" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className={styles.modalTitle}>Request Submitted!</h3>
              <p className={styles.modalDesc}>
                Your RSVP change request has been sent to the hosts. You will be notified once reviewed.
              </p>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setRequestSubmitted(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
