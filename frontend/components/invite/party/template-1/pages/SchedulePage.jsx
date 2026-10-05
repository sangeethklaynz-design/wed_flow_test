"use client";

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

export default function SchedulePage({ fields = {}, contentScale = 1 }) {
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
      </div>

      <img
        src="/assets/events/parties/templates/template-1/chrome/schedule-page/bottom-bg.webp"
        alt=""
        className={styles.bottomBg}
      />
    </section>
  );
}
