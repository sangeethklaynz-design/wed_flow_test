"use client";

import styles from "./LandingPage.module.css";
import { resolveMediaUrl } from "@/lib/api";
import { partyThemeVars } from "@/lib/partyPageStyles";

const DEFAULTS = {
  inviteEyebrow: "YOU ARE INVITED",
  eventScriptTitle: "Annual",
  eventMainTitle: "GALA NIGHT",
  eventSubtitle: "An Evening To Celebrate, Connect & Create\nLasting Memories",
  eventTimeLabel: "06:00 PM Onwards",
};

function formatEventDate(raw) {
  if (!raw) return "";
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(raw);
  }
}

export default function LandingPage({
  fields = {},
  onScrollNext,
  contentScale = 1,
  eventDate = null,
  eventTime = null,
  eventVenue = null,
  backgroundUrl = null,
}) {
  const f = { ...DEFAULTS, ...fields };
  const subtitleLines = String(f.eventSubtitle || "").split("\n");
  const dateLabel =
    formatEventDate(eventDate) || f.eventDateLabel || "Date TBA";
  const timeLabel =
    f.eventTimeLabel || eventTime || "06:00 PM Onwards";
  const venueLabel = eventVenue || f.eventVenueLabel || "Venue TBA";
  const bgSrc =
    resolveMediaUrl(backgroundUrl) ||
    "/assets/events/parties/templates/template-1/chrome/landing-page/background.webp";

  return (
    <section
      className={styles.pageContainer}
      id="page-1"
      data-invite-page="landing"
      aria-label="Landing Page - Gala Invitation"
      style={{ height: 844, minHeight: 844, backgroundColor: "#060e1d" }}
    >
      <img
        src={bgSrc}
        alt="Gala Evening Banquet Background"
        className={styles.bgImage}
      />

      <div className={styles.overlay} />

      <div
        className={styles.stage}
        style={{
          transform: `translate(-50%, -50%) scale(${contentScale})`,
          ...partyThemeVars(fields),
        }}
      >
        <h1 className={styles.invitedText}>{f.inviteEyebrow}</h1>

        <div className={styles.underlineDeco}>
          <img
            src="/assets/events/parties/templates/template-1/chrome/landing-page/underline-deco.webp"
            alt=""
          />
        </div>

        <div className={styles.annualText}>{f.eventScriptTitle}</div>
        <div className={styles.galaNightText}>{f.eventMainTitle}</div>

        <div className={styles.subtitleContainer}>
          <p className={styles.subtitle}>
            {subtitleLines.map((line, i) => (
              <span key={i}>
                {i > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>
        </div>

        <div className={styles.calendarCircle} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <circle cx="8" cy="14" r="0.9" fill="currentColor" />
            <circle cx="12" cy="14" r="0.9" fill="currentColor" />
            <circle cx="16" cy="14" r="0.9" fill="currentColor" />
            <circle cx="8" cy="18" r="0.9" fill="currentColor" />
            <circle cx="12" cy="18" r="0.9" fill="currentColor" />
          </svg>
        </div>
        <div className={styles.dateText}>{dateLabel}</div>

        {timeLabel ? (
          <>
            <div className={styles.clockCircle} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15.5 12" />
              </svg>
            </div>
            <div className={styles.timeText}>{timeLabel}</div>
          </>
        ) : null}

        <div className={styles.locationCircle} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div className={styles.locationText}>{venueLabel}</div>
      </div>
    </section>
  );
}
