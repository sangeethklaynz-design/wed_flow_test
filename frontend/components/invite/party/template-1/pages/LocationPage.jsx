"use client";

import styles from "./Page5.module.css";
import { partyFixedPageStyle } from "@/lib/partyPageStyles";

export default function LocationPage({
  fields = {},
  locationName = null,
  locationAddress = null,
  googleMapsLink = null,
  contentScale = 1,
}) {
  const title = fields.locationTitle || "Event Location";
  const venue = locationName || "Venue TBA";
  const address = locationAddress || "";
  const addressLines = String(address || "")
    .split("\n")
    .filter(Boolean);
  const areaLabel =
    fields.areaLabel ||
    (addressLines.length ? addressLines[addressLines.length - 1] : "") ||
    "";
  const mapsUrl =
    googleMapsLink ||
    (venue || address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${venue} ${addressLines.join(" ")}`
        )}`
      : "#");

  return (
    <section
      className={styles.pageContainer}
      id="page-5"
      data-invite-page="location"
      aria-label="Event Location"
      style={partyFixedPageStyle(fields, 844)}
    >
      <img
        src="/assets/events/parties/templates/template-1/chrome/location-page/top-bg.webp"
        alt=""
        className={styles.topDeco}
      />
      <img
        src="/assets/events/parties/templates/template-1/chrome/location-page/bottom-bg.webp"
        alt=""
        className={styles.bottomBg}
      />

      <div
        className={styles.stage}
        style={{
          transform: `translate(-50%, -50%) scale(${contentScale})`,
        }}
      >
        <h2 className={styles.titleLocation}>{title}</h2>
        <div className={styles.underlineDeco}>
          <img
            src="/assets/events/parties/templates/template-1/chrome/location-page/underline-deco.webp"
            alt=""
          />
        </div>

        <div className={styles.hotelIconContainer}>
          <img
            src="/assets/events/parties/templates/template-1/chrome/location-page/location-icon.webp"
            alt=""
          />
        </div>

        <h3 className={styles.venueTitle}>{venue}</h3>

        <div className={styles.pinIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="#1e75c8">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>

        <p className={styles.addressText}>
          {addressLines.length
            ? addressLines.map((line, i) => (
                <span key={i}>
                  {i > 0 ? <br /> : null}
                  {line}
                </span>
              ))
            : "Address set when registering the event"}
        </p>

        {areaLabel ? (
          <>
            <span className={styles.areaLabel}>AREA</span>
            <span className={styles.areaValue}>{areaLabel}</span>
          </>
        ) : null}

        <span className={styles.directionsLabel}>GET DIRECTIONS</span>
        <span className={styles.directionsValue}>
          Find the fastest route to the events
        </span>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mapsButton}
          aria-label={`Open ${venue} in Google Maps`}
        >
          <svg viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
          <span>Open in Google Maps</span>
        </a>
      </div>
    </section>
  );
}
