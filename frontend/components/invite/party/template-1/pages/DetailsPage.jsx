"use client";

import styles from "./Page6.module.css";
import {
  computeDetailsHeight,
  DEFAULT_DETAIL_ITEMS,
} from "@/lib/partyLayoutMetrics";
import { partyPageSurfaceStyle } from "@/lib/partyPageStyles";

const ICON_BASE =
  "/assets/events/parties/templates/template-1/chrome/details-page";

/** Explicit icon keys — never cycle previous icons for new items. */
const ICON_MAP = {
  parking: `${ICON_BASE}/parking.webp`,
  dress: `${ICON_BASE}/dress-code.webp`,
  table: `${ICON_BASE}/table-number.webp`,
  cam: `${ICON_BASE}/cam.webp`,
  contact: `${ICON_BASE}/contact.webp`,
};

function resolveDetailIcon(item) {
  const kind = String(item?.kind || "text").toLowerCase();
  if (kind === "email") return { type: "email" };
  if (kind === "phone") return { type: "img", src: ICON_MAP.contact };

  const explicit = String(item?.icon || "").toLowerCase();
  if (explicit === "info" || explicit === "" || explicit === "standard") {
    return { type: "info" };
  }
  if (explicit && ICON_MAP[explicit]) {
    return { type: "img", src: ICON_MAP[explicit] };
  }

  const title = String(item?.title || "").toLowerCase();
  if (/park/i.test(title)) return { type: "img", src: ICON_MAP.parking };
  if (/dress/i.test(title)) return { type: "img", src: ICON_MAP.dress };
  if (/table/i.test(title)) return { type: "img", src: ICON_MAP.table };
  if (/photo|camera|memori/i.test(title)) return { type: "img", src: ICON_MAP.cam };
  if (/contact|phone|call/i.test(title)) return { type: "img", src: ICON_MAP.contact };

  return { type: "info" };
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className={styles.infoIconSvg}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="7.6" r="1.15" fill="currentColor" />
      <path
        d="M12 11.1v6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
    </svg>
  );
}

function extractEmail(text = "") {
  const m = String(text).match(/[\w.+-]+@[\w.-]+\.\w+/);
  return m ? m[0] : "";
}

export default function DetailsPage({ fields = {}, contentScale = 1 }) {
  const title = fields.detailsTitle || "Important Details";
  const items =
    Array.isArray(fields.detailItems) && fields.detailItems.length
      ? fields.detailItems
      : DEFAULT_DETAIL_ITEMS;
  const pageHeight = computeDetailsHeight(items);

  return (
    <section
      className={styles.pageContainer}
      id="page-6"
      data-invite-page="details"
      aria-label="Important Details"
      style={{
        ...partyPageSurfaceStyle(fields, pageHeight),
        height: "auto",
        transform: contentScale !== 1 ? `scale(${contentScale})` : undefined,
        transformOrigin: "top center",
      }}
    >
      <img
        src={`${ICON_BASE}/top-bg.webp`}
        alt=""
        className={styles.topDeco}
      />

      <div className={styles.contentColumn}>
        <div className={styles.headerBlock}>
          <h2 className={styles.pageTitle}>{title}</h2>
          <div className={styles.underlineDeco}>
            <img src={`${ICON_BASE}/underline-deco.webp`} alt="" />
          </div>
        </div>

        <div className={styles.detailsList}>
          {items.map((item, idx) => {
            const kind = String(item.kind || "text").toLowerCase();
            const lines = String(item.body || "")
              .split("\n")
              .filter(Boolean);
            const isEmail = kind === "email";
            const isPhone = kind === "phone";
            const email = extractEmail(item.body || "");
            const icon = resolveDetailIcon(item);

            return (
              <div key={`${item.title}-${idx}`} className={styles.detailRow}>
                <div className={styles.badgeCircle} aria-hidden="true">
                  {icon.type === "email" ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className={styles.mailIconSvg}
                    >
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  ) : icon.type === "info" ? (
                    <InfoIcon />
                  ) : (
                    <img
                      src={icon.src}
                      alt=""
                      className={styles.badgeIconImg}
                    />
                  )}
                </div>
                <div className={styles.detailTextCol}>
                  <h3 className={styles.detailTitle}>{item.title}</h3>
                  {isPhone ? (
                    <div className={styles.detailSubtitleCol}>
                      {lines.map((num, i) => (
                        <a
                          key={i}
                          href={`tel:${num.replace(/\s+/g, "")}`}
                          className={styles.detailLink}
                        >
                          {num}
                        </a>
                      ))}
                    </div>
                  ) : isEmail ? (
                    <div className={styles.detailSubtitleCol}>
                      {lines.map((line, i) =>
                        email && line.includes(email) ? (
                          <a
                            key={i}
                            href={`mailto:${email}`}
                            className={styles.detailLink}
                          >
                            {line}
                          </a>
                        ) : (
                          <span key={i} className={styles.detailSubtitleText}>
                            {line}
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <div className={styles.detailSubtitleCol}>
                      {lines.map((line, i) => (
                        <span key={i} className={styles.detailSubtitleText}>
                          {line}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <img
        src={`${ICON_BASE}/bottom-bg.webp`}
        alt=""
        className={styles.bottomDeco}
      />
    </section>
  );
}
