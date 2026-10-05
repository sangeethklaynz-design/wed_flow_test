"use client";

import { useMemo, useState } from "react";
import styles from "./Page4.module.css";
import {
  computeScheduleHeight,
  SCHEDULE_ITEM_H,
  SCHEDULE_ITEM_GAP,
  DEFAULT_SCHEDULE_ITEMS,
} from "@/lib/partyLayoutMetrics";
import { partyPageSurfaceStyle } from "@/lib/partyPageStyles";

const ICON_MAP = {
  drink: "/assets/events/parties/templates/template-1/chrome/schedule-page/drink.webp",
  mic: "/assets/events/parties/templates/template-1/chrome/schedule-page/mic.webp",
  food: "/assets/events/parties/templates/template-1/chrome/schedule-page/food.webp",
  music: "/assets/events/parties/templates/template-1/chrome/schedule-page/music.webp",
  celebrate: "/assets/events/parties/templates/template-1/chrome/schedule-page/celebrate.webp",
  dj: "/assets/events/parties/templates/template-1/chrome/schedule-page/dj.webp",
};

function formatTime12(time24) {
  if (!time24) return "";
  const [hStr, mStr] = String(time24).slice(0, 5).split(":");
  let hours = Number(hStr);
  const minutes = mStr || "00";
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${period}`;
}

function resolvePartyIcon(title = "", desc = "") {
  const text = `${title} ${desc}`.toLowerCase();
  if (/drink|cocktail|toast|wine|beer|bar|beverage|champagne/i.test(text)) return "drink";
  if (/music|band|concert|song|acoustic|orchestra/i.test(text)) return "music";
  if (/dj|dance|party|floor|disco/i.test(text)) return "dj";
  if (/food|dinner|lunch|breakfast|buffet|meal|eat|cake|catering/i.test(text)) return "food";
  if (/speech|mic|welcome|talk|announcement|toast|address|remarks/i.test(text)) return "mic";
  return "celebrate";
}

function escapePdfText(str) {
  return String(str || "").replace(/[\\()]/g, "\\$&");
}

function generateClientPartySchedulePdf(fields, meta, items) {
  const eventName = meta?.eventName || fields.partyTitle || "GALA NIGHT";
  const title = (fields.scheduleTitle || "Event Schedule").toUpperCase();
  const dateVenue = [meta?.eventDate, meta?.eventVenue].filter(Boolean).join(" | ");

  const textOps = [];
  textOps.push("BT");
  textOps.push("/F2 18 Tf");
  textOps.push("50 780 Td");
  textOps.push(`(${escapePdfText(eventName)}) Tj`);
  textOps.push("ET");

  textOps.push("BT");
  textOps.push("/F2 13 Tf");
  textOps.push("50 755 Td");
  textOps.push(`(${escapePdfText(title)}) Tj`);
  textOps.push("ET");

  if (dateVenue) {
    textOps.push("BT");
    textOps.push("/F1 10 Tf");
    textOps.push("50 735 Td");
    textOps.push(`(${escapePdfText(dateVenue)}) Tj`);
    textOps.push("ET");
  }

  let y = 690;
  items.forEach((item) => {
    if (!item.time && !item.title && !item.desc) return;
    textOps.push("BT");
    textOps.push("/F2 11 Tf");
    textOps.push(`50 ${y} Td`);
    textOps.push(`(${escapePdfText(item.time || "")}) Tj`);
    textOps.push("ET");

    textOps.push("BT");
    textOps.push("/F1 11 Tf");
    textOps.push(`140 ${y} Td`);
    textOps.push(`(${escapePdfText(item.title || item.desc || "")}) Tj`);
    textOps.push("ET");

    if (item.desc && item.title) {
      y -= 14;
      textOps.push("BT");
      textOps.push("/F1 9 Tf");
      textOps.push(`140 ${y} Td`);
      textOps.push(`(${escapePdfText(item.desc)}) Tj`);
      textOps.push("ET");
    }

    y -= 28;
  });

  const streamContent = textOps.join("\n");
  const streamLength = Buffer.byteLength(streamContent, "utf-8");

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
xref
0 7
0000000000 65535 f 
0000000010 00000 n 
0000000059 00000 n 
0000000116 00000 n 
0000000244 00000 n 
0000000300 00000 n 
0000000371 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
444
%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export default function SchedulePage({
  fields = {},
  contentScale = 1,
  scheduleEvents = null,
  isRsvpConfirmed = false,
  guestToken = null,
  eventName = null,
  eventDate = null,
  eventVenue = null,
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const title = fields.scheduleTitle || "Event Schedule";

  const items = useMemo(() => {
    if (Array.isArray(scheduleEvents) && scheduleEvents.length > 0) {
      return scheduleEvents.map((ev) => {
        const timeStr = ev.startTime
          ? formatTime12(ev.startTime) + (ev.endTime ? ` - ${formatTime12(ev.endTime)}` : "")
          : ev.time || "";
        const titleStr = ev.title || "";
        const descStr = ev.specialNotes || ev.location || ev.desc || "";
        return {
          time: timeStr,
          title: titleStr,
          desc: descStr,
          icon: ev.icon || resolvePartyIcon(titleStr, descStr),
        };
      });
    }
    if (Array.isArray(fields.scheduleItems) && fields.scheduleItems.length > 0) {
      return fields.scheduleItems;
    }
    return DEFAULT_SCHEDULE_ITEMS;
  }, [scheduleEvents, fields.scheduleItems]);

  const pageHeight = computeScheduleHeight(items, isRsvpConfirmed);
  const listH =
    items.length === 0
      ? 0
      : items.length * SCHEDULE_ITEM_H +
        Math.max(0, items.length - 1) * SCHEDULE_ITEM_GAP;

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      let blob = null;
      if (guestToken) {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(
          `${apiUrl}/api/public/invite/${encodeURIComponent(guestToken)}/schedule/download`
        );
        if (res.ok) {
          blob = await res.blob();
        }
      }

      if (!blob) {
        blob = generateClientPartySchedulePdf(
          fields,
          { eventName, eventDate, eventVenue },
          items
        );
      }

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "party-schedule.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    } catch (err) {
      setDownloadError(err?.message || "Failed to download schedule");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section
      className={styles.pageContainer}
      id="page-4"
      data-invite-page="schedule"
      aria-label="Event Schedule"
      style={{
        ...partyPageSurfaceStyle(fields, pageHeight),
        height: "auto",
        transform: contentScale !== 1 ? `scale(${contentScale})` : undefined,
        transformOrigin: "top center",
      }}
    >
      <img
        src="/assets/events/parties/templates/template-1/chrome/schedule-page/top-bg.webp"
        alt=""
        className={styles.topDeco}
      />

      <div className={styles.contentColumn}>
        <div className={styles.headerBlock}>
          <h2 className={styles.titleSchedule}>{title}</h2>
          <div className={styles.underlineDeco}>
            <img
              src="/assets/events/parties/templates/template-1/chrome/schedule-page/underline-deco.webp"
              alt=""
            />
          </div>
        </div>

        <div className={styles.timelineContainer} style={{ minHeight: listH }}>
          {items.length > 0 ? (
            <div
              className={styles.timelineLine}
              style={{ height: Math.max(0, listH - 48) }}
              aria-hidden="true"
            />
          ) : null}
          <div className={styles.timelineList}>
            {items.map((item, idx) => {
              const iconKey = String(item.icon || "celebrate").toLowerCase();
              const iconSrc = ICON_MAP[iconKey] || ICON_MAP.celebrate;
              return (
                <div key={idx} className={styles.timelineItem}>
                  <div className={styles.timelineCircle} aria-hidden="true">
                    <img src={iconSrc} alt="" />
                  </div>
                  <div className={styles.timelineInfo}>
                    <span className={styles.timelineTime}>{item.time}</span>
                    <span className={styles.timelineDesc}>
                      {item.title || item.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save the Schedule Button - Visible only after RSVP is submitted */}
        {isRsvpConfirmed ? (
          <div className={styles.saveScheduleContainer}>
            <button
              type="button"
              id="save-party-schedule-btn"
              onClick={handleDownload}
              disabled={downloading}
              className={styles.saveScheduleBtn}
              aria-label="Save the Schedule"
            >
              {downloading ? (
                <>
                  <svg
                    className={styles.spinner}
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeDasharray="28"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <svg
                    className={styles.downloadIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Save the Schedule</span>
                </>
              )}
            </button>
            {downloadError ? (
              <p className={styles.downloadError}>{downloadError}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <img
        src="/assets/events/parties/templates/template-1/chrome/schedule-page/bottom-bg.webp"
        alt=""
        className={styles.bottomBg}
      />
    </section>
  );
}
