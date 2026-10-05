"use client";

import styles from "./Page7.module.css";
import {
  computeSaveTheDateHeight,
  DEFAULT_CALENDAR_LINKS,
} from "@/lib/partyLayoutMetrics";
import { partyPageSurfaceStyle } from "@/lib/partyPageStyles";

/** Fixed copy — not editable in the template admin. */
const PAGE_COPY = {
  calendarTitle: "Save the Date",
  calendarSubtitle: "Add the event to your calendar\nso you don't miss it!",
};

const PROVIDER_META = {
  google: {
    label: "Google Calendar",
    logo: "/assets/events/parties/templates/template-1/chrome/save-the-date-page/google-calendar-logo.webp",
  },
  apple: {
    label: "Apple Calendar",
    logo: "/assets/events/parties/templates/template-1/chrome/save-the-date-page/apple-logo.webp",
  },
  outlook: {
    label: "Outlook",
    logo: "/assets/events/parties/templates/template-1/chrome/save-the-date-page/outlook-logo.webp",
  },
  custom: {
    label: "Add to calendar",
    logo: "/assets/events/parties/templates/template-1/chrome/save-the-date-page/tick-icon.webp",
  },
};

function toUtcStamp(dateStr, endOfDay = false) {
  if (!dateStr) return "";
  const day = String(dateStr).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "";
  const [y, m, d] = day.split("-");
  return endOfDay ? `${y}${m}${d}T173000Z` : `${y}${m}${d}T130000Z`;
}

function toIsoStamp(dateStr, endOfDay = false) {
  if (!dateStr) return "";
  const day = String(dateStr).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "";
  return endOfDay ? `${day}T17:30:00Z` : `${day}T13:00:00Z`;
}

export default function SaveTheDatePage({
  fields = {},
  contentScale = 1,
  eventDate = null,
  eventName = null,
  eventVenue = null,
  eventAddress = null,
}) {
  const subtitleLines = PAGE_COPY.calendarSubtitle.split("\n");
  const location = [eventVenue, eventAddress].filter(Boolean).join(", ");
  const calendarEventName = eventName || "Event";
  const calendarEventDetails = location
    ? `${calendarEventName} at ${location}`
    : calendarEventName;
  const startUtc = toUtcStamp(eventDate, false) || "20261112T130000Z";
  const endUtc = toUtcStamp(eventDate, true) || "20261112T173000Z";
  const startIso = toIsoStamp(eventDate, false) || "2026-11-12T13:00:00Z";
  const endIso = toIsoStamp(eventDate, true) || "2026-11-12T17:30:00Z";

  const links =
    Array.isArray(fields.calendarLinks) && fields.calendarLinks.length
      ? fields.calendarLinks
      : DEFAULT_CALENDAR_LINKS;
  const pageHeight = computeSaveTheDateHeight(links);

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    calendarEventName
  )}&dates=${startUtc}/${endUtc}&details=${encodeURIComponent(
    calendarEventDetails
  )}&location=${encodeURIComponent(location)}`;

  const outlookCalendarUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&subject=${encodeURIComponent(
    calendarEventName
  )}&startdt=${encodeURIComponent(startIso)}&enddt=${encodeURIComponent(
    endIso
  )}&body=${encodeURIComponent(
    calendarEventDetails
  )}&location=${encodeURIComponent(location)}`;

  const handleDownloadIcs = () => {
    const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//${calendarEventName}//EN`,
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `SUMMARY:${calendarEventName}`,
      `DESCRIPTION:${calendarEventDetails}`,
      `LOCATION:${location}`,
      `DTSTART:${startUtc}`,
      `DTEND:${endUtc}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${String(calendarEventName).replace(/\s+/g, "-")}.ics`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resolveHref = (item) => {
    const provider = String(item?.provider || "custom").toLowerCase();
    const customUrl = String(item?.url || "").trim();
    if (customUrl) return customUrl;
    if (provider === "google") return googleCalendarUrl;
    if (provider === "outlook") return outlookCalendarUrl;
    if (provider === "custom") return "#";
    return null;
  };

  const handleBuiltinClick = (item, e) => {
    const provider = String(item?.provider || "").toLowerCase();
    const customUrl = String(item?.url || "").trim();
    if (customUrl) return;
    if (provider === "apple") {
      e.preventDefault();
      handleDownloadIcs();
    }
  };

  return (
    <section
      className={styles.pageContainer}
      id="page-7"
      data-invite-page="saveTheDate"
      aria-label="Save the Date"
      style={{
        ...partyPageSurfaceStyle(fields, pageHeight),
        height: "auto",
        transform: contentScale !== 1 ? `scale(${contentScale})` : undefined,
        transformOrigin: "top center",
      }}
    >
      <img
        src="/assets/events/parties/templates/template-1/chrome/save-the-date-page/top-bg.webp"
        alt=""
        className={styles.topDeco}
      />

      <div className={styles.contentColumn}>
        <h2 className={styles.pageTitle}>{PAGE_COPY.calendarTitle}</h2>

        <div className={styles.calendarLogoContainer} aria-hidden="true">
          <svg viewBox="0 0 104 97" className={styles.calendarSvg} fill="none">
            <rect
              x="9"
              y="18"
              width="86"
              height="70"
              rx="14"
              stroke="#0b63e5"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M32 9V24"
              stroke="#0b63e5"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M72 9V24"
              stroke="#0b63e5"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </svg>
          <img
            src="/assets/events/parties/templates/template-1/chrome/save-the-date-page/tick-icon.webp"
            alt=""
            className={styles.calendarTickImg}
          />
        </div>

        <p className={styles.subtitle}>
          {subtitleLines.map((line, i) => (
            <span key={i}>
              {i > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </p>

        <div
          className={styles.buttonsContainer}
          data-dynamic-field="calendarLinks"
        >
          {links.map((item, idx) => {
            const provider = String(item?.provider || "custom").toLowerCase();
            const meta = PROVIDER_META[provider] || PROVIDER_META.custom;
            const label = item?.label || meta.label;
            const href = resolveHref(item);
            const isDownload =
              !String(item?.url || "").trim() && provider === "apple";

            if (isDownload) {
              return (
                <button
                  key={`${provider}-${idx}`}
                  type="button"
                  onClick={(e) => handleBuiltinClick(item, e)}
                  className={styles.actionButton}
                  aria-label={label}
                >
                  <div className={styles.iconWrapper}>
                    <img
                      src={meta.logo}
                      alt=""
                      className={styles.buttonLogoImg}
                    />
                  </div>
                  <span className={styles.buttonLabel}>{label}</span>
                </button>
              );
            }

            return (
              <a
                key={`${provider}-${idx}`}
                href={href || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionButton}
                aria-label={label}
                onClick={(e) => {
                  if (!href || href === "#") e.preventDefault();
                }}
              >
                <div className={styles.iconWrapper}>
                  <img
                    src={meta.logo}
                    alt=""
                    className={styles.buttonLogoImg}
                  />
                </div>
                <span className={styles.buttonLabel}>{label}</span>
              </a>
            );
          })}
        </div>
      </div>

      <img
        src="/assets/events/parties/templates/template-1/chrome/save-the-date-page/bottom-bg.webp"
        alt=""
        className={styles.bottomBg}
      />
    </section>
  );
}
