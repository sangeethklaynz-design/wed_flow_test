"use client";

import styles from "./PaymentSuccessPage.module.css";

export default function PaymentSuccessPage({
  onAddToCalendar,
  onBackToInvite,
  contentScale = 1,
}) {
  return (
    <div className={styles.pageContainer} aria-label="Payment Successful Page">
      {/* Top Foliage Background - Figma: W: 390, H: 205, Rotation: 180° */}
      <img
        src="/assets/events/parties/templates/template-1/chrome/payment-success-page/top-bg.webp"
        alt="Top foliage decoration"
        className={styles.topDeco}
      />

      {/* Bottom Gala Dinner Table Scene - full-bleed responsive */}
      <img
        src="/assets/events/parties/templates/template-1/chrome/payment-success-page/bottom-bg.webp"
        alt="Romantic evening banquet scene with warm lanterns by the lake"
        className={styles.bottomBg}
      />

      {/* Scaled Stage Container - exactly 390 x 844 reference canvas */}
      <div
        className={styles.stage}
        style={{
          transform: `translate(-50%, -50%) scale(${contentScale})`,
        }}
      >
        {/* 1. Success Emblem with Confetti - Figma: X: 46, Y: 65, W: 294, H: 177 */}
        <div className={styles.successMarkContainer} aria-hidden="true">
          <img
            src="/assets/events/parties/templates/template-1/chrome/payment-success-page/top-success-mark.webp"
            alt="Payment success checkmark with colorful celebration confetti"
            className={styles.successMarkImg}
          />
        </div>

        {/* 2. Heading "Payment Successful!" - Figma: X: 6, Y: 261, W: 377, H: 42, Plus Jakarta Sans Bold 33 */}
        <h1 className={styles.headingTitle}>
          Payment Successful!
        </h1>

        {/* 3. Subtitle 1 "Your registration is confimed." - Figma: X: 41, Y: 303, W: 303, H: 35, Inter Regular 18 */}
        <p className={styles.subtitlePrimary}>
          Your registration is confimed.
        </p>

        {/* 4. Subtitle 2 "You will receive a confirmation email shortly." */}
        <p className={styles.subtitleSecondary}>
          You will receive a confirmation<br />
          email shortly.
        </p>

        {/* 5. Action Buttons Stack */}
        <div className={styles.buttonsContainer}>
          {/* Button 1: Add to Calendar */}
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={onAddToCalendar}
            aria-label="Add to Calendar"
          >
            <svg
              viewBox="0 0 24 24"
              className={styles.btnIcon}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Add to Calendar</span>
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
        </div>
      </div>
    </div>
  );
}
