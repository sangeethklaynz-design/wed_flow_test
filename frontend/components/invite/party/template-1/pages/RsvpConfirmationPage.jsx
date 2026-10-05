"use client";

import styles from "./RsvpConfirmationPage.module.css";

export default function RsvpConfirmationPage({
  onBackToInvite,
  onProceedToPayment,
  onSaveSchedule,
  canAttend = true,
  isDownloadingPdf = false,
  contentScale = 1,
}) {
  return (
    <div className={styles.pageContainer} aria-label="RSVP Confirmation Page">
      {/* Top Foliage Background - Figma: W: 390, H: 205, Rotation: 180° */}
      <img
        src="/assets/events/parties/templates/template-1/chrome/rsvp-confirmation-page/top-bg.webp"
        alt="Top foliage decoration"
        className={styles.topDeco}
      />

      {/* Bottom Foliage Background - Figma: W: 390, H: 205, Rotation: 0° */}
      <img
        src="/assets/events/parties/templates/template-1/chrome/rsvp-confirmation-page/bottom-bg.webp"
        alt="Bottom foliage decoration"
        className={styles.bottomDeco}
      />

      {/* Scaled Stage Container - exactly 390 x 844 reference canvas */}
      <div
        className={styles.stage}
        style={{
          transform: `translate(-50%, -50%) scale(${contentScale})`,
        }}
      >
        {/* 1. Circled Tick Mark - Figma: X: 154, Y: 101, W: 81, H: 74 */}
        <div className={styles.tickContainer} aria-hidden="true">
          <img
            src="/assets/events/parties/templates/template-1/chrome/rsvp-confirmation-page/upper-tick-mark.webp"
            alt="Success checkmark emblem"
            className={styles.tickImg}
          />
        </div>

        {/* 2. Heading "THANK YOU!" - Figma: X: 13, Y: 183, W: 364, H: 44, Plus Jakarta Sans Bold 35 */}
        <h1 className={styles.headingTitle}>
          THANK YOU!
        </h1>

        {/* 3. Subtitle 1 */}
        <p className={styles.subtitlePrimary}>
          {canAttend ? (
            <>
              Your RSVP has been<br />
              successfully submitted.
            </>
          ) : (
            <>
              Your response has been<br />
              successfully submitted.
            </>
          )}
        </p>

        {/* 4. Highlight text */}
        <p className={styles.subtitleHighlight}>
          {canAttend ? "We’re excited to have you!" : "We'll miss celebrating with you!"}
        </p>

        {/* 5. "Next Step" Section - Shown only when attending */}
        {canAttend ? (
          <>
            <div className={styles.nextStepIconGroup} aria-hidden="true">
              <div className={styles.nextStepCircle}>
                <img
                  src="/assets/events/parties/templates/template-1/chrome/rsvp-confirmation-page/upper-tick-mark.webp"
                  alt="Next step checkmark"
                  className={styles.nextStepTickImg}
                />
              </div>
            </div>

            <h2 className={styles.nextStepTitle}>Next Step</h2>

            <p className={styles.nextStepDesc}>
              Please complete your payment<br />
              to confirm participation.
            </p>
          </>
        ) : null}

        {/* 6. Action Buttons Stack */}
        <div
          className={styles.buttonsContainer}
          style={!canAttend ? { top: "370px" } : undefined}
        >
          {canAttend ? (
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={onProceedToPayment}
              aria-label="Proceed to Payment"
            >
              <span>Proceed to Payment</span>
              <svg
                viewBox="0 0 24 24"
                className={styles.arrowIcon}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          ) : null}

          {/* Button 2: Back to Invitation */}
          <button
            type="button"
            className={canAttend ? styles.btnSecondary : styles.btnPrimary}
            onClick={onBackToInvite}
            aria-label="Back to Invitation"
          >
            <span>Back to Invitation</span>
          </button>

          {/* Button 3: Save the Schedule */}
          {typeof onSaveSchedule === "function" ? (
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onSaveSchedule}
              aria-label="Save the Schedule"
              disabled={isDownloadingPdf}
            >
              {isDownloadingPdf ? (
                <span className={styles.btnLoading}>
                  <svg className={styles.spinner} viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="#081368"
                      strokeWidth="2.5"
                      strokeDasharray="28"
                      strokeLinecap="round"
                    />
                  </svg>
                  Downloading PDF...
                </span>
              ) : (
                <span>Save the Schedule</span>
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
