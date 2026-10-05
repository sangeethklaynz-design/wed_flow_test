"use client";

import styles from "./Page2.module.css";
import {
  computeAboutHeight,
  DEFAULT_ABOUT_FEATURES,
} from "@/lib/partyLayoutMetrics";
import { partyPageSurfaceStyle } from "@/lib/partyPageStyles";

const ICON_MAP = {
  group: "/assets/events/parties/templates/template-1/chrome/about-event-page/group.webp",
  celebrate:
    "/assets/events/parties/templates/template-1/chrome/about-event-page/celebrate.webp",
  cam: "/assets/events/parties/templates/template-1/chrome/about-event-page/cam.webp",
};

const TITLE_DEFAULTS = {
  aboutTitleTop: "About the",
  aboutTitleBottom: "Event",
  aboutBody:
    "Join us for an unforgettable evening filled with great company, delicious food, entertainment and memorable moments. This event is a celebration of our journey, achievements and the amazing people who make it possible.",
};

function resolveFeatures(fields) {
  if (Array.isArray(fields.aboutFeatures) && fields.aboutFeatures.length) {
    return fields.aboutFeatures;
  }
  if (
    fields.featureNetworkTitle ||
    fields.featureCelebrateTitle ||
    fields.featureMemoriesTitle
  ) {
    return [
      {
        title: fields.featureNetworkTitle || "Network",
        description:
          fields.featureNetworkDesc || "Meet & connect with great people",
        icon: "group",
      },
      {
        title: fields.featureCelebrateTitle || "Celebrate",
        description:
          fields.featureCelebrateDesc ||
          "Enjoy food, music and entertainment",
        icon: "celebrate",
      },
      {
        title: fields.featureMemoriesTitle || "Create Memories",
        description:
          fields.featureMemoriesDesc ||
          "Be part of a special evening together",
        icon: "cam",
      },
    ];
  }
  return DEFAULT_ABOUT_FEATURES;
}

export default function AboutPage({ fields = {}, contentScale = 1 }) {
  const titleTop = fields.aboutTitleTop || TITLE_DEFAULTS.aboutTitleTop;
  const titleBottom =
    fields.aboutTitleBottom || TITLE_DEFAULTS.aboutTitleBottom;
  const body = fields.aboutBody || TITLE_DEFAULTS.aboutBody;
  const features = resolveFeatures(fields);
  const pageHeight = computeAboutHeight(features);

  return (
    <section
      className={styles.pageContainer}
      id="page-2"
      data-invite-page="about"
      aria-label="About the Event"
      style={{
        ...partyPageSurfaceStyle(fields, pageHeight),
        height: "auto",
        transform: contentScale !== 1 ? `scale(${contentScale})` : undefined,
        transformOrigin: "top center",
      }}
    >
      <img
        src="/assets/events/parties/templates/template-1/chrome/about-event-page/background-deco.webp"
        alt=""
        className={styles.topDeco}
      />

      <div className={styles.contentColumn}>
        <div className={styles.headerBlock}>
          <div className={styles.titleGroup}>
            <span className={styles.titleTop}>{titleTop}</span>
            <span className={styles.titleBottom}>{titleBottom}</span>
          </div>
          <div className={styles.underlineDeco}>
            <img
              src="/assets/events/parties/templates/template-1/chrome/about-event-page/underline-deco.webp"
              alt=""
            />
          </div>
          <div className={styles.descriptionContainer}>
            <p className={styles.descriptionText}>{body}</p>
          </div>
        </div>

        <div className={styles.featuresList}>
          {features.map((feature, idx) => {
            const iconKey = String(feature.icon || "group").toLowerCase();
            const iconSrc = ICON_MAP[iconKey] || ICON_MAP.group;
            return (
              <div key={`${feature.title}-${idx}`} className={styles.featureRow}>
                <div className={styles.featureCircle} aria-hidden="true">
                  <img src={iconSrc} alt="" />
                </div>
                <div className={styles.featureText}>
                  <div className={styles.featureTitle}>{feature.title}</div>
                  <div className={styles.featureDesc}>
                    {feature.description || feature.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <img
        src="/assets/events/parties/templates/template-1/chrome/about-event-page/background-deco.webp"
        alt=""
        className={styles.bottomDeco}
      />
    </section>
  );
}
