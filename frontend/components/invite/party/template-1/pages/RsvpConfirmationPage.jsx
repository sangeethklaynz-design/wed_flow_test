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

        {/* 3. Subtitle 1: "Your RSVP has been successfully submitted." */}
        <p className={styles.subtitlePrimary}>
          Your RSVP has been<br />
          successfully submitted.
        </p>

        {/* 4. Highlight text: "We’re excited to have you!" */}
        <p className={styles.subtitleHighlight}>
          We’re excited to have you!
        </p>

        {/* 5. "Next Step" Section - Directly positioned per Figma layers */}
        {/* Next Step Circle Badge Group - Figma: X: 47, Y: 401, W: 68, H: 67 */}
        <div className={styles.nextStepIconGroup} aria-hidden="true">
          <div className={styles.nextStepCircle}>
            <img
              src="/assets/events/parties/templates/template-1/chrome/rsvp-confirmation-page/upper-tick-mark.webp"
              alt="Next step checkmark"
              className={styles.nextStepTickImg}
            />
          </div>
        </div>

        {/* Next Step Title - Figma: X: 129, Y: 396, W: 213, H: 23, Plus Jakarta Sans Bold 18 */}
        <h2 className={styles.nextStepTitle}>Next Step</h2>

        {/* Next Step Description - Figma: X: 129, Y: 426, W: 261, H: 34, Inter Regular 14 */}
        <p className={styles.nextStepDesc}>
          Please complete your payment<br />
          to confirm participation.
        </p>

        {/* 6. Action Buttons Stack */}
        <div className={styles.buttonsContainer}>
          {/* Button 1: Proceed to Payment - Disabled if guest is not attending */}
          <button
            type="button"
            className={`${styles.btnPrimary} ${!canAttend ? styles.btnDisabled : ""}`}
            onClick={canAttend ? onProceedToPayment : undefined}
            disabled={!canAttend}
            aria-disabled={!canAttend}
            aria-label={canAttend ? "Proceed to Payment" : "Payment not required (Not attending)"}
            title={!canAttend ? "Payment is not required because you are not attending." : "Proceed to Payment"}
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

          {/* Button 2: Back to Invitation */}
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onBackToInvite}
            aria-label="Back to Invitation"
          >
            <span>Back to Invitation</span>
          </button>

          {/* Button 3: Save the Schedule - Downloads Event Schedule PDF */}
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
        </div>
      </div>
    </div>
  );
}
