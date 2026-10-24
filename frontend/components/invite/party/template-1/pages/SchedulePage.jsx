"use client";

import React, { useState } from "react";
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

function escapePdfText(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function generatePartySchedulePdf(fields, items) {
  const scheduleTitle = fields.scheduleTitle || "Event Schedule";

  const ops = [];
  // Background gradient: top #588dcf, mid #e5f2fd, bot #4377bd
  ops.push('0.35 0.55 0.81 rg'); // Top soft party blue
  ops.push('0 560 390 284 re f');
  ops.push('0.90 0.95 0.99 rg'); // Mid pale blue
  ops.push('0 200 390 360 re f');
  ops.push('0.26 0.47 0.74 rg'); // Bot deep blue #4377bd
  ops.push('0 0 390 200 re f');

  // Title: Event Schedule in dark navy #0c1e48 (moved down below foliage)
  ops.push('0.05 0.12 0.28 rg');
  ops.push('BT');
  ops.push('/F2 22 Tf');
  ops.push('115 726 Td');
  ops.push(`(${escapePdfText(scheduleTitle)}) Tj`);
  ops.push('ET');

  // Underline decoration line (gold #d8b87a)
  ops.push('0.85 0.72 0.48 RG');
  ops.push('2 w');
  ops.push('130 706 m 260 706 l S');

  // Timeline vertical line: gold #d8b87a
  const lineX = 72;
  const startY = 642;
  const step = 58;
  const itemList = Array.isArray(items) && items.length ? items.slice(0, 6) : [];
  const count = itemList.length;

  if (count > 0) {
    ops.push('0.85 0.72 0.48 RG');
    ops.push('2 w');
    ops.push(`${lineX} ${startY} m ${lineX} ${startY - (count - 1) * step} l S`);
  }

  itemList.forEach((item, idx) => {
    const y = startY - idx * step;
    // Golden circle node #ecdaab with gold border
    ops.push('0.92 0.85 0.67 rg');
    ops.push('0.85 0.72 0.48 RG');
    ops.push('1.5 w');
    ops.push(`${lineX - 10} ${y - 10} 20 20 re b`);

    // Time (bold navy #0c1e48)
    ops.push('0.05 0.12 0.28 rg');
    ops.push('BT');
    ops.push('/F2 13 Tf');
    ops.push(`${lineX + 22} ${y} Td`);
    ops.push(`(${escapePdfText(item.time || '')}) Tj`);
    ops.push('ET');

    // Title / Description (blue #1e3a7a)
    ops.push('0.12 0.23 0.48 rg');
    ops.push('BT');
    ops.push('/F2 11.5 Tf');
    ops.push(`${lineX + 22} ${y - 16} Td`);
    ops.push(`(${escapePdfText(item.title || item.desc || '')}) Tj`);
    ops.push('ET');
  });

  const streamContent = ops.join('\n');
  const streamLength = streamContent.length;

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 390 844] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
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

  return new Blob([pdf], { type: 'application/pdf' });
}

export default function SchedulePage({
  fields = {},
  contentScale = 1,
  guestToken = null,
  onSaveSchedule = null,
  isDownloadingPdf = false,
}) {
  const [internalDownloading, setInternalDownloading] = useState(false);
  const isDownloading = isDownloadingPdf || internalDownloading;

  const title = fields.scheduleTitle || "Event Schedule";
  const items =
    Array.isArray(fields.scheduleItems) && fields.scheduleItems.length
      ? fields.scheduleItems
      : DEFAULT_SCHEDULE_ITEMS;
  const pageHeight = computeScheduleHeight(items);
  const listH =
    items.length === 0
      ? 0
      : items.length * SCHEDULE_ITEM_H +
        Math.max(0, items.length - 1) * SCHEDULE_ITEM_GAP;

  const handleDownloadSchedule = async () => {
    if (typeof onSaveSchedule === "function") {
      onSaveSchedule();
      return;
    }

    setInternalDownloading(true);
    try {
      let blob = null;
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      if (guestToken) {
        const res = await fetch(
          `${apiUrl}/api/public/invite/${encodeURIComponent(guestToken)}/schedule/download`
        );
        if (res.ok) {
          blob = await res.blob();
        }
      } else {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;
        if (token) {
          const res = await fetch(`${apiUrl}/api/couple/schedule/download`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            blob = await res.blob();
          }
        }
      }

      if (!blob) {
        blob = generatePartySchedulePdf(fields, items);
      }

      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = "party-schedule.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
      }
    } catch (err) {
      console.error("Failed to download schedule:", err);
    } finally {
      setInternalDownloading(false);
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

        {/* Save the Schedule Button at the end of the schedule list */}
        <div className={styles.saveScheduleContainer}>
          <button
            type="button"
            id="save-schedule-btn"
            onClick={handleDownloadSchedule}
            disabled={isDownloading}
            className={styles.saveScheduleBtn}
            aria-label="Save the Schedule"
          >
            {isDownloading ? (
              <>
                <svg
                  className="animate-spin"
                  style={{ width: 16, height: 16 }}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Downloading Schedule…</span>
              </>
            ) : (
              <>
                <svg
                  style={{ width: 18, height: 18, flexShrink: 0 }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Save the Schedule</span>
              </>
            )}
          </button>
        </div>
      </div>

      <img
        src="/assets/events/parties/templates/template-1/chrome/schedule-page/bottom-bg.webp"
        alt=""
        className={styles.bottomBg}
      />
    </section>
  );
}
