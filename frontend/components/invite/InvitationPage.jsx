"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiRequest, resolveMediaUrl } from "@/lib/api";
import {
  normalizeInvitationTemplate,
  splitSpecialText,
  buildGoogleMapsUrl,
  mapJourneyImagesBySlot,
} from "@/lib/inviteTemplate";
import RsvpChangeRequestForm from "@/components/invite/RsvpChangeRequestForm";
import {
  invitePage,
  dynamicField,
} from "@/templates/weddings/template-1/manifest";
import { computeInviteLayoutMetrics, FOOTER_HEIGHT } from "@/lib/inviteLayoutMetrics";
import { resolveWeddingTheme } from "@/lib/weddingTheme";

const JOURNEY_FALLBACKS = [
  "/invitation/7.2.png",
  "/invitation/7.3.png",
  "/invitation/7.4.png",
  "/invitation/7.5.png",
];

/** Set false only via admin template pages config. */
const SHOW_OUR_STORY = true;

/**
 * Full visual invitation template.
 *
 * API data:
 * - Couple preview: pass `data` from GET /api/couple/invitation-template
 * - Guest invite: pass `data` from GET /api/public/invite/:token/invitation-template
 * - RSVP submit: POST /api/public/invite/:token/rsvp (when guestToken + interactive)
 * - Our Journey images: static.images[] → /assets/couple_images/<slug>/...
 */
export default function InvitationPage({
  data = null,
  guestToken = null,
  interactive = true,
  /** When true, omit outer border/shadow — parent phone shell owns chrome */
  embedded = false,
  /** Guest RSVP success — parent can show schedule → thank you → invitation */
  onRsvpSuccess = null,
  /** Admin preview: skip RSVP field validation and advance on button click */
  previewBypassValidation = false,
  /** Optional admin/template overrides (also read from data.templateConfig) */
  templateConfig: templateConfigProp = null,
}) {
  const t = useMemo(() => normalizeInvitationTemplate(data), [data]);
  const templateConfig = templateConfigProp || t.templateConfig || null;
  const pagesCfg = templateConfig?.pages || null;
  const fieldsCfg = templateConfig?.fields || {};

  const showOurStory = pagesCfg
    ? pagesCfg.ourStory !== false
    : SHOW_OUR_STORY;
  const showRsvp = pagesCfg ? pagesCfg.rsvp !== false : true;
  const showAllDetails = pagesCfg ? pagesCfg.allDetails !== false : true;
  const showBigDay = pagesCfg ? pagesCfg.bigDay !== false : true;
  const showJourney = pagesCfg ? pagesCfg.journey !== false : true;
  const showClosing = pagesCfg ? pagesCfg.closing !== false : true;
  const showStarting = pagesCfg ? pagesCfg.starting !== false : true;
  const showOpening = pagesCfg ? pagesCfg.opening !== false : true;

  const theme = useMemo(() => resolveWeddingTheme(fieldsCfg), [fieldsCfg]);

  const brideName =
    String(fieldsCfg.landingBrideName || "").trim() || t.brideName;
  const groomName =
    String(fieldsCfg.landingGroomName || "").trim() || t.groomName;
  const coupleNames =
    brideName && groomName
      ? `${brideName} & ${groomName}`
      : t.coupleNames;

  const detailNodes = Array.isArray(fieldsCfg.detailNodes)
    ? fieldsCfg.detailNodes
    : null;
  const storyMilestones = Array.isArray(fieldsCfg.storyMilestones)
    ? fieldsCfg.storyMilestones
    : null;
  const rsvpQuestions = Array.isArray(fieldsCfg.rsvpQuestions)
    ? fieldsCfg.rsvpQuestions
    : null;
  const journeyImagesCfg = Array.isArray(fieldsCfg.journeyImages)
    ? fieldsCfg.journeyImages
    : null;
  // Legacy: journeyImageCount only — synthesize portrait slots.
  const legacyJourneyCount = Math.min(
    12,
    Math.max(0, Number(fieldsCfg.journeyImageCount) || 0)
  );
  const resolvedJourneyItems = useMemo(() => {
    if (Array.isArray(journeyImagesCfg)) {
      return journeyImagesCfg.slice(0, 12).map((item, index) => ({
        orientation:
          String(item?.orientation || "").toLowerCase() === "landscape"
            ? "landscape"
            : "portrait",
        filename: String(item?.filename || "").trim(),
        caption: String(item?.caption || "").trim(),
        key: `journey-${index}`,
      }));
    }
    if (legacyJourneyCount > 0) {
      const defaults = ["portrait", "portrait", "landscape", "portrait"];
      const defaultCaptions = [
        "Two souls\nOne promise.",
        "Little moments\nbig memories.",
        "Different\nchapters,\none love story.",
        "And the best\nis yet to come...",
      ];
      return Array.from({ length: legacyJourneyCount }, (_, i) => ({
        orientation: defaults[i] || (i % 2 === 0 ? "portrait" : "landscape"),
        filename: "",
        caption: defaultCaptions[i] || "",
        key: `journey-legacy-${i}`,
      }));
    }
    return [
      {
        orientation: "portrait",
        filename: "",
        caption: "Two souls\nOne promise.",
        key: "journey-0",
      },
      {
        orientation: "portrait",
        filename: "",
        caption: "Little moments\nbig memories.",
        key: "journey-1",
      },
      {
        orientation: "landscape",
        filename: "",
        caption: "Different\nchapters,\none love story.",
        key: "journey-2",
      },
      {
        orientation: "portrait",
        filename: "",
        caption: "And the best\nis yet to come...",
        key: "journey-3",
      },
    ];
  }, [journeyImagesCfg, legacyJourneyCount]);

  const journeyImageCount = resolvedJourneyItems.length;

  const maxGuests = Math.max(1, Number(t.maxGuests) || 1);
  const specialLines = useMemo(() => splitSpecialText(t.specialText), [t.specialText]);
  const mapsUrl = useMemo(
    () =>
      buildGoogleMapsUrl({
        googleMapsLink: t.googleMapsLink,
        hotelName: t.hotelName,
        hotelAddress: t.hotelAddress,
      }),
    [t.googleMapsLink, t.hotelName, t.hotelAddress]
  );
  const journeyFallbacks = useMemo(() => {
    const out = [];
    for (let i = 0; i < Math.max(journeyImageCount, JOURNEY_FALLBACKS.length); i += 1) {
      out.push(JOURNEY_FALLBACKS[i % JOURNEY_FALLBACKS.length]);
    }
    return out;
  }, [journeyImageCount]);
  const journeyImages = useMemo(() => {
    const fromApi = (t.images || []).map((img) => ({
      ...img,
      url: resolveMediaUrl(img.url),
    }));
    const byFile = new Map(
      fromApi.map((img) => [img.fileName || img.filename, img.url])
    );
    const slotted = mapJourneyImagesBySlot(fromApi, journeyFallbacks);
    return resolvedJourneyItems.map((item, index) => {
      if (item.filename && byFile.has(item.filename)) {
        return byFile.get(item.filename);
      }
      return slotted[index] || journeyFallbacks[index % journeyFallbacks.length];
    });
  }, [t.images, journeyFallbacks, resolvedJourneyItems]);
  const landingBackgroundUrl = useMemo(() => {
    if (!t.background?.hasBackground || !t.background?.url) return null;
    return resolveMediaUrl(t.background.url);
  }, [t.background]);
  const router = useRouter();

  const [attendance, setAttendance] = useState("");
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [guests, setGuests] = useState("");
  const [wishes, setWishes] = useState("");
  const [extraAnswers, setExtraAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
  const dropdownRef = useRef(null);
  const rsvpLocked = Boolean(guestToken && t.rsvp?.hasSubmitted);

  // When templateConfig provides detailNodes (even []), never fall back to static defaults.
  const resolvedDetailNodes = Array.isArray(detailNodes)
    ? detailNodes
    : [
        { label: "CEREMONY", value: t.ceremonySetting, iconKey: "ceremony" },
        { label: "WEATHER NOTE", value: t.weatherNote, iconKey: "weather" },
        { label: "PARKING", value: t.parkingNote, iconKey: "parking" },
        {
          label: "Contact",
          kind: "contact",
          iconKey: "contact",
          phones: (t.contacts || []).slice(0, 2).map((c) => ({
            name: c.name || "",
            phone: c.phone || "",
          })),
        },
      ];
  const detailIconByKey = {
    ceremony: {
      src: "/invitation/4.2.png",
      alt: "Ceremony setting icon",
      box: "w-[43px] h-[35px]",
      topOffset: 12,
      left: 46,
    },
    weather: {
      src: "/invitation/4.3.png",
      alt: "Sun icon",
      box: "w-[42px] h-[42px]",
      topOffset: 10,
      left: 46,
    },
    parking: {
      src: "/invitation/4.4.png",
      alt: "Car icon",
      box: "w-[43px] h-[32px]",
      topOffset: 14,
      left: 45,
    },
    contact: {
      src: "/invitation/4.5.png",
      alt: "Phone icon",
      box: "w-[34px] h-[31px]",
      topOffset: 15,
      left: 50,
    },
  };
  /** New detail items reuse the ceremony (sun umbrella + chairs) icon. */
  const defaultNewDetailIcon = detailIconByKey.ceremony;

  const defaultRsvpQuestions = [
    { label: "Will you attend?", inputType: "dropdown", options: "Yes, I will attend, No, I cannot attend", key: "attendance" },
    { label: "Number of guests", inputType: "text", options: "", key: "guests" },
    { label: "Your wishes for us", inputType: "textarea", options: "", key: "wishes" },
  ];
  const resolvedRsvpQuestions = Array.isArray(rsvpQuestions)
    ? rsvpQuestions
    : defaultRsvpQuestions;

  const timelineItems = Array.isArray(storyMilestones)
    ? storyMilestones
    : [
        { year: "2019", title: "The day we met" },
        { year: "2021", title: "We fell in love" },
        { year: "2023", title: "The proposal" },
        { year: "2026", title: "Forever starts here" },
      ];
  /** One standard icon for every Our Story milestone. */
  const storyMilestoneIcon = "/invitation/5.3.png";

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAttendanceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!t.rsvp) return;
    if (t.rsvp.attendingStatus === "declined") {
      setAttendance("no");
      setGuests("0");
    } else if (t.rsvp.attendingStatus === "attending") {
      setAttendance("yes");
      setGuests(String(t.rsvp.attendingCount || 1));
    }
    setWishes(t.rsvp.wishes || "");
  }, [t.rsvp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRsvpError("");

    if (!interactive) {
      return;
    }

    if (rsvpLocked) {
      setRsvpError("Your RSVP has already been submitted.");
      return;
    }

    // Admin preview: allow advancing without filling RSVP fields.
    if (
      previewBypassValidation ||
      (!guestToken && typeof onRsvpSuccess === "function")
    ) {
      const status = attendance === "no" ? "DECLINED" : "ATTENDING";
      const attendingCount =
        status === "DECLINED"
          ? 0
          : Number.isInteger(Number(guests)) && Number(guests) >= 1
            ? Number(guests)
            : 1;
      onRsvpSuccess?.({
        attendingStatus: status === "ATTENDING" ? "attending" : "declined",
        attendingCount,
        wishes: wishes.trim(),
      });
      return;
    }

    if (!attendance) {
      setRsvpError("Please select whether you will attend.");
      return;
    }

    const status = attendance === "yes" ? "ATTENDING" : "DECLINED";
    let attendingCount = status === "DECLINED" ? 0 : Number(guests);

    if (status === "ATTENDING") {
      if (!Number.isInteger(attendingCount) || attendingCount < 1 || attendingCount > maxGuests) {
        setRsvpError(`Enter a number of guests between 1 and ${maxGuests}.`);
        return;
      }
    }

    const successPayload = {
      attendingStatus: status === "ATTENDING" ? "attending" : "declined",
      attendingCount,
      wishes: wishes.trim(),
    };

    // Admin / couple preview without onRsvpSuccess handler
    if (!guestToken) {
      router.push("/invitation/thank-you");
      return;
    }

    setSubmitting(true);
    try {
      // API: POST /api/public/invite/:token/rsvp
      await apiRequest(`/api/public/invite/${encodeURIComponent(guestToken)}/rsvp`, {
        method: "POST",
        body: {
          status,
          attendingCount,
          wishes: wishes.trim(),
        },
      });
      if (typeof onRsvpSuccess === "function") {
        onRsvpSuccess(successPayload);
      } else {
        router.push(`/invitation/thank-you?token=${encodeURIComponent(guestToken)}`);
      }
    } catch (err) {
      setRsvpError(err.message || "Could not save RSVP");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestsChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (digits === "") {
      setGuests("");
      return;
    }
    let n = Number(digits);
    if (n > maxGuests) n = maxGuests;
    if (n < 1) n = 1;
    setGuests(String(n));
  };

  const DETAIL_NODE_STEP = 102;

  const layout = computeInviteLayoutMetrics({
    pages: {
      starting: showStarting,
      opening: showOpening,
      rsvp: showRsvp,
      ourStory: showOurStory,
      allDetails: showAllDetails,
      bigDay: showBigDay,
      journey: showJourney,
      closing: showClosing,
    },
    rsvpQuestions: resolvedRsvpQuestions,
    detailNodes: resolvedDetailNodes,
    storyMilestones: timelineItems,
    journeyImageCount,
    journeyImages: resolvedJourneyItems,
  });

  const {
    decorTop: rsvpDecorTop,
    storyGrowth,
    journeyGrowth,
    detailsLayout,
    pageShift,
    canvasHeight,
  } = layout;

  // Contact above floral; floral is the hard bottom border for All the details.
  const detailsFloralTop = detailsLayout.floralTop;
  /** Resolve icon: default keys keep originals; newer items use ceremony icon. */
  const resolveDetailIcon = (node, index) => {
    const explicit = String(node?.iconKey || node?.kind || "").toLowerCase();
    if (explicit && detailIconByKey[explicit]) return detailIconByKey[explicit];

    const label = String(node?.label || "").toLowerCase();
    if (label.includes("contact")) return detailIconByKey.contact;
    if (label.includes("weather") || label.includes("sun")) {
      return detailIconByKey.weather;
    }
    if (label.includes("parking") || label.includes("car")) {
      return detailIconByKey.parking;
    }
    if (label.includes("ceremon") || label.includes("outdoor")) {
      return detailIconByKey.ceremony;
    }

    // Legacy configs without iconKey: keep original icons on the first three rows.
    const legacyKey = ["ceremony", "weather", "parking"][index];
    if (legacyKey && !node?.phones) return detailIconByKey[legacyKey];

    return defaultNewDetailIcon;
  };

  const shiftStyle = (pageId) => {
    const shift = pageShift?.[pageId] || 0;
    return shift ? { transform: `translateY(${shift}px)` } : undefined;
  };

  return (
    <div
      className={`relative w-[390px] mx-auto overflow-hidden select-none ${
        embedded ? "" : "shadow-2xl border border-gray-200"
      }`}
      style={{
        height: canvasHeight,
        background: `linear-gradient(180deg, ${theme.gradientTop} 0%, ${theme.gradientMid} 48%, ${theme.gradientBottom} 100%)`,
        backgroundColor: theme.accent,
        ["--invite-landing-names"]: theme.landingNames,
        ["--invite-page-title"]: theme.pageTitle,
        ["--invite-subtitle"]: theme.subtitle,
        ["--invite-body"]: theme.body,
        ["--invite-icon-fill"]: theme.iconFill,
        ["--invite-accent"]: theme.accent,
        ["--invite-surface"]: theme.surface,
      }}
      data-template-id="weddings/template-1"
    >
      
      {/* =========================================================
          PAGE: starting — dynamic: landingBackground, color tokens
          ========================================================= */}

      {showStarting ? (
        <div className="absolute left-0 top-0 w-full" style={shiftStyle("starting")}>
      {/* Landing background - assets/background_image/<slug>/ @ 50% opacity, fit to height */}
      {landingBackgroundUrl ? (
        <div
          className="absolute top-0 left-0 w-[390px] h-[875px] z-0 overflow-hidden pointer-events-none select-none opacity-50 flex justify-center"
          {...invitePage("starting")}
          {...dynamicField("landingBackground")}
        >
          <Image
            src={landingBackgroundUrl}
            alt=""
            width={1200}
            height={1800}
            className="h-full w-auto max-w-none"
            unoptimized
            aria-hidden
          />
        </div>
      ) : (
        <div className="absolute top-0 left-0 w-0 h-0" {...invitePage("starting")} />
      )}

      {/* Top Flower Decoration (Width: 390px, Height: 175px, Y: 0) */}
      <div className="absolute top-0 left-0 w-[390px] h-[175px] pointer-events-none select-none z-0">
        <Image 
          src="/invitation/top-flower.png" 
          alt="" 
          fill 
          className="object-contain object-center"
          unoptimized
          priority
        />
      </div>

      {/* Bottom Flower Decoration (Width: 389px, Height: 592px, Y: 283px) */}
      <div className="absolute top-[283px] left-[0.5px] w-[389px] h-[592px] pointer-events-none select-none z-0">
        <Image 
          src="/invitation/bottom-flower.png" 
          alt="" 
          fill 
          className="object-contain object-bottom"
          unoptimized
          priority
        />
      </div>

      {/* Page 1 Text Content */}
      <span className="absolute top-[175px] left-0 w-[390px] font-serif font-semibold text-[14px] text-[var(--invite-subtitle)] uppercase tracking-[0.05em] leading-none flex items-center justify-center text-center z-10">
        Together, we begin
      </span>

      <div className="absolute top-[214px] left-[182.5px] w-[25px] h-[40px] z-10">
        <Image 
          src="/invitation/heart.png" 
          alt="" 
          fill 
          className="object-contain"
          unoptimized
        />
      </div>

      <div
        className="absolute top-[277px] left-0 w-[390px] h-[178px] flex flex-col items-center justify-center z-10"
        {...dynamicField("landingBrideName")}
      >
        <h2 className="font-script-custom text-[68px] text-[var(--invite-landing-names)] leading-none mb-1">
          {brideName}
        </h2>
        <span className="font-script-custom text-[42px] text-[var(--invite-landing-names)] leading-none my-1">
          &
        </span>
        <h2 className="font-script-custom text-[68px] text-[var(--invite-landing-names)] leading-none mt-1">
          {groomName}
        </h2>
      </div>

      <div className="absolute top-[478px] left-0 w-[390px] h-[66px] flex items-center justify-center z-10">
        <p className="font-serif text-[28px] font-extrabold text-[var(--invite-landing-names)] tracking-wider leading-none">
          {t.formattedDate}
        </p>
      </div>

      <div className="absolute top-[527px] left-[126.5px] w-[137px] h-[91px] z-10">
        <Image 
          src="/invitation/gold-lotus.png" 
          alt="" 
          fill 
          className="object-contain"
          unoptimized
        />
      </div>
        </div>
      ) : (
        <div className="absolute top-0 left-0 w-0 h-0" {...invitePage("starting")} />
      )}


      {/* =========================================================
          PAGE: opening — invitation letter
          ========================================================= */}

      {showOpening ? (
        <div className="absolute left-0 top-0 w-full" style={shiftStyle("opening")} {...invitePage("opening")}>
      {/* Card Header Frame (Width: 390px, Height: 276px, Y: 867px) */}
      <div className="absolute top-[867px] left-0 w-[390px] h-[276px] z-0">
        <Image 
          src="/invitation/page2-card-header.png" 
          alt="Page 2 card header decoration" 
          fill 
          className="object-contain"
          unoptimized
        />
      </div>

      {/* "TOGETHER WITH OUR FAMILIES" */}
      <span className="absolute top-[1025px] left-0 w-[390px] font-serif font-semibold text-[14px] text-[var(--invite-subtitle)] uppercase tracking-[0.05em] leading-tight flex items-center justify-center text-center z-10">
        Together with our families
      </span>

      {/* Guest invitation note (or dotted placeholders in couple preview) */}
      <div className="absolute top-[1065px] left-0 w-[390px] h-[75px] flex flex-col items-center justify-center z-10">
        <p className="font-greatvibes-custom text-[32px] text-[var(--invite-landing-names)] leading-none mb-1">
          {t.invitationNoteLine1}
        </p>
        <p className="font-greatvibes-custom text-[32px] text-[var(--invite-landing-names)] leading-none mt-1">
          {t.invitationNoteLine2}
        </p>
      </div>

      {/* Lotus Divider (Width: 175px, Height: 34px, Y: 1143px) */}
      <div className="absolute top-[1143px] left-[107.5px] w-[175px] h-[34px] z-0">
        <Image 
          src="/invitation/page2-lotus-divider.png" 
          alt="Lotus divider" 
          fill 
          className="object-contain"
        />
      </div>

      {/* Main Paragraph */}
      <div className="absolute top-[1205px] left-[20px] w-[350px] font-quattrocento-custom font-bold text-[13px] text-[var(--invite-body)] tracking-[0.05em] leading-[24px] text-center z-10">
        {specialLines.map((line, index) => (
          <React.Fragment key={`${line}-${index}`}>
            {line}
            {index < specialLines.length - 1 ? <br /> : null}
          </React.Fragment>
        ))}
      </div>

      {/* Pearl Divider (Width: 158px, Height: 17px, Y: 1351px) */}
      <div className="absolute top-[1351px] left-[116px] w-[158px] h-[17px] z-0">
        <Image 
          src="/invitation/page2-pearl-divider.png" 
          alt="Pearl divider" 
          fill 
          className="object-contain"
        />
      </div>

      {/* "Your presence will be" */}
      <span className="absolute top-[1395px] left-0 w-[390px] font-quattrocento-custom font-bold text-[13px] text-[var(--invite-body)] tracking-[0.05em] leading-[24px] text-center z-10">
        Your presence will be
      </span>

      {/* "Our greatest gift." */}
      <p className="absolute top-[1428px] left-0 w-[390px] font-pinyon-custom text-[40px] text-[var(--invite-landing-names)] leading-none text-center z-10">
        Our greatest gift.
      </p>

      {/* Bottom Left Floral Bouquet */}
      <div className="absolute top-[1393px] left-0 w-[127px] h-[254px] z-0">
        <Image 
          src="/invitation/page2-left-flower.png" 
          alt="Bottom left bouquet" 
          fill 
          className="object-fill"
        />
      </div>

      {/* Bottom Right Floral Bouquet */}
      <div className="absolute top-[1393px] right-0 w-[127px] h-[254px] z-0">
        <Image 
          src="/invitation/page2-right-flower.png" 
          alt="Bottom right bouquet" 
          fill 
          className="object-fill"
        />
      </div>

      {/* Gold Lotus Divider */}
      <div className="absolute top-[1625px] left-[130px] w-[130px] h-[33px] z-0">
        <Image 
          src="/invitation/page2-gold-divider.png" 
          alt="Gold lotus divider bottom" 
          fill 
          className="object-contain"
          unoptimized
        />
      </div>
        </div>
      ) : (
        <div className="absolute top-0 left-0 w-0 h-0" {...invitePage("opening")} />
      )}


      {/* =========================================================
          PAGE: rsvp — dynamic: rsvpQuestions
          ========================================================= */}

      {showRsvp ? (
        <div className="absolute left-0 top-0 w-full" style={shiftStyle("rsvp")}>
      {/* "BE OUR GUEST" (Cormorant Garamond SemiBold 38px, Color: #7732A4, Y: 1719px) */}
      <h1
        className="absolute top-[1719px] left-0 w-[390px] font-cormorant-custom font-semibold text-[38px] tracking-normal leading-none text-center z-10"
        style={{ color: theme.pageTitle }}
        {...invitePage("rsvp")}
        {...dynamicField("rsvpQuestions")}
      >
        BE OUR GUEST
      </h1>

      {/* "RSVP" (Cormorant Garamond Bold 38px, Color: #B54AB6, Y: 1780px) */}
      <h1 className="absolute top-[1780px] left-0 w-[390px] font-cormorant-custom font-bold text-[38px] text-[var(--invite-subtitle)] tracking-normal leading-none text-center z-10">
        RSVP
      </h1>

      {/* Lotus Divider (Width: 175px, Height: 34px, Y: 1840px) */}
      <div className="absolute top-[1840px] left-[107.5px] w-[175px] h-[34px] z-0">
        <Image 
          src="/invitation/page3-lotus-divider.png" 
          alt="Page 3 lotus divider" 
          fill 
          className="object-contain"
        />
      </div>

      {/* "We'd love to celebrate with you!" (Quattrocento Bold 20px, Line Height: 25px, Color: #7732A4, Y: 1895px) */}
      <div className="absolute top-[1895px] left-[20px] w-[350px] font-quattrocento-custom font-bold text-[20px] text-[var(--invite-body)] tracking-[0.05em] leading-[25px] text-center z-10">
        We'd love to celebrate<br />with you!
      </div>

      {/* Small Lotus (Width: 53px, Height: 48px, Y: 1951px) */}
      <div className="absolute top-[1951px] left-[168.5px] w-[53px] h-[48px] z-0">
        <Image 
          src="/invitation/page3-small-lotus.png" 
          alt="Page 3 small lotus" 
          fill 
          className="object-contain"
        />
      </div>

      {/* RSVP Form Inputs container (Y: 2010px -> Y: 2240px, centered at left-[35px] with W: 320px) */}
      {rsvpLocked && guestToken ? (
        <div className="absolute top-[2010px] left-[35px] w-[320px] z-10">
          <RsvpChangeRequestForm
            guestToken={guestToken}
            rsvp={t.rsvp}
            maxGuests={t.maxGuests}
          />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate={previewBypassValidation || !guestToken}
          className="absolute top-[2010px] left-[35px] w-[320px] z-10 flex flex-col gap-[18px] text-left"
        >
          {resolvedRsvpQuestions.map((question, qIndex) => {
            const label = question.label || `Question ${qIndex + 1}`;
            const inputType = String(question.inputType || "text").toLowerCase();
            const isDropdown = inputType === "dropdown" || inputType === "select";
            const isTextField = // multiline ("Text field" in admin)
              inputType === "textarea" ||
              inputType === "text_container" ||
              inputType === "textcontainer";
            const isText = !isDropdown && !isTextField; // single-line ("Text")
            const options = Array.isArray(question.options)
              ? question.options.map((o) => String(o || "").trim()).filter(Boolean)
              : String(question.options || "")
                  .split(",")
                  .map((o) => o.trim())
                  .filter(Boolean);

            // Semantic bindings (still respect chosen field type).
            const isAttendance = qIndex === 0 && isDropdown;
            const isGuests =
              !isAttendance && isText && /guest/i.test(label);
            const isPrimaryWishes =
              isTextField &&
              !resolvedRsvpQuestions.slice(0, qIndex).some((q) => {
                const t = String(q.inputType || "").toLowerCase();
                return (
                  t === "textarea" ||
                  t === "text_container" ||
                  t === "textcontainer"
                );
              });

            if (isAttendance) {
              return (
                <div className="flex flex-col items-start" ref={dropdownRef} key={qIndex}>
                  <label className="font-quattrocento-custom font-normal text-[15px] tracking-normal uppercase mb-1.5 text-left w-full pl-2" style={{ color: theme.pageTitle }}>
                    {label}
                  </label>
                  <div className="relative w-[320px]">
                    <div
                      className="w-full h-[36px] bg-white border border-[#D1D1D1] text-navy font-sans text-xs px-4 rounded-[20px] outline-none flex items-center justify-between transition-colors cursor-pointer focus:border-[color:var(--invite-page-title)]/50"
                      onClick={() => {
                        if (!interactive) return;
                        setAttendanceOpen(!attendanceOpen);
                      }}
                    >
                      <span>
                        {attendance === "yes"
                          ? options[0] || "Yes, I will attend"
                          : attendance === "no"
                            ? options[1] || "No, I cannot attend"
                            : "Please Select"}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 292.4 292.4" fill={theme.pageTitle} className={`transition-transform duration-200 ${attendanceOpen ? "rotate-180" : ""}`}>
                        <path d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-5 0-9.3 1.8-12.9 5.4A17.6 17.6 0 0 0 0 82.2c0 5 1.8 9.3 5.4 12.9l128 127.9c3.6 3.6 7.8 5.4 12.8 5.4s9.2-1.8 12.8-5.4L287 95c3.5-3.5 5.4-7.8 5.4-12.8 0-5-1.9-9.2-5.5-12.8z"/>
                      </svg>
                    </div>
                    {attendanceOpen && (
                      <div className="absolute top-[42px] left-0 w-full bg-white border border-[#D1D1D1] rounded-[16px] shadow-lg z-[100] overflow-hidden font-sans text-xs divide-y divide-[#F0F0F0]">
                        <div
                          className={`px-4 py-3 cursor-pointer hover:bg-[#FAF6F0] transition-colors ${attendance === "" ? "font-bold bg-[#FAF6F0]" : "text-navy"}`}
                          style={attendance === "" ? { color: theme.pageTitle } : undefined}
                          onClick={() => { setAttendance(""); setAttendanceOpen(false); }}
                        >
                          Please Select
                        </div>
                        {(options.length ? options : ["Yes, I will attend", "No, I cannot attend"]).map((opt, oi) => {
                          const value = oi === 0 ? "yes" : "no";
                          return (
                            <div
                              key={opt}
                              className={`px-4 py-3 cursor-pointer hover:bg-[#FAF6F0] transition-colors ${attendance === value ? "font-bold bg-[#FAF6F0]" : "text-navy"}`}
                              style={attendance === value ? { color: theme.pageTitle } : undefined}
                              onClick={() => {
                                setAttendance(value);
                                if (value === "no") setGuests("");
                                setAttendanceOpen(false);
                              }}
                            >
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            if (isGuests) {
              return (
                <div className="flex flex-col items-start" key={qIndex}>
                  <label className="font-quattrocento-custom font-normal text-[15px] tracking-normal uppercase mb-1.5 text-left w-full pl-2" style={{ color: theme.pageTitle }}>
                    {label}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={String(maxGuests)}
                    value={guests}
                    onChange={handleGuestsChange}
                    disabled={!interactive || attendance === "no"}
                    className="w-[320px] h-[36px] bg-white border border-[#D1D1D1] text-navy font-sans text-xs px-4 rounded-[20px] outline-none focus:border-[color:var(--invite-page-title)]/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-[#F7F4EF]"
                  />
                </div>
              );
            }

            if (isTextField) {
              const textValue = isPrimaryWishes
                ? wishes
                : extraAnswers[qIndex] || "";
              const onTextChange = (next) => {
                if (isPrimaryWishes) setWishes(next);
                else
                  setExtraAnswers((prev) => ({ ...prev, [qIndex]: next }));
              };

              return (
                <div className="flex flex-col items-start" key={qIndex}>
                  <label className="font-quattrocento-custom font-normal text-[15px] tracking-normal uppercase mb-1.5 text-left w-full pl-2" style={{ color: theme.pageTitle }}>
                    {label}
                  </label>
                  <textarea
                    placeholder="Write your wishes....."
                    rows="3"
                    value={textValue}
                    onChange={(e) => onTextChange(e.target.value)}
                    disabled={!interactive}
                    className="w-[320px] h-[126px] bg-white border border-[#D1D1D1] text-navy font-sans text-xs px-4 py-3 rounded-[20px] outline-none resize-none focus:border-[color:var(--invite-page-title)]/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-[#F7F4EF]"
                  />
                </div>
              );
            }

            if (isDropdown) {
              return (
                <div className="flex flex-col items-start" key={qIndex}>
                  <label className="font-quattrocento-custom font-normal text-[15px] tracking-normal uppercase mb-1.5 text-left w-full pl-2" style={{ color: theme.pageTitle }}>
                    {label}
                  </label>
                  <select
                    value={extraAnswers[qIndex] || ""}
                    disabled={!interactive}
                    onChange={(e) =>
                      setExtraAnswers((prev) => ({ ...prev, [qIndex]: e.target.value }))
                    }
                    className="w-[320px] h-[36px] bg-white border border-[#D1D1D1] text-navy font-sans text-xs px-4 rounded-[20px] outline-none"
                  >
                    <option value="">Please Select</option>
                    {options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              );
            }

            return (
              <div className="flex flex-col items-start" key={qIndex}>
                <label className="font-quattrocento-custom font-normal text-[15px] tracking-normal uppercase mb-1.5 text-left w-full pl-2" style={{ color: theme.pageTitle }}>
                  {label}
                </label>
                <input
                  type="text"
                  value={extraAnswers[qIndex] || ""}
                  disabled={!interactive}
                  onChange={(e) =>
                    setExtraAnswers((prev) => ({ ...prev, [qIndex]: e.target.value }))
                  }
                  className="w-[320px] h-[36px] bg-white border border-[#D1D1D1] text-navy font-sans text-xs px-4 rounded-[20px] outline-none"
                />
              </div>
            );
          })}

          <button type="submit" className="hidden" id="rsvp-submit-hidden-btn" />
          {rsvpError ? (
            <p className="text-xs text-red-600 text-center w-full">{rsvpError}</p>
          ) : null}

          {/* Send RSVP stays in the form stack — always above the floral border */}
          {!rsvpLocked ? (
            <button
              type="button"
              disabled={submitting || !interactive}
              onClick={() => document.getElementById("rsvp-submit-hidden-btn")?.click()}
              className="mx-auto mt-1 w-[108px] h-[48px] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-serif font-bold text-xs uppercase tracking-wider rounded-[24px] transition-colors shadow-md flex items-center justify-center"
              style={{ backgroundColor: theme.pageTitle }}
            >
              {submitting ? "Sending..." : "Send RSVP"}
            </button>
          ) : null}
        </form>
      )}

      {/* Decorative Bottom Frame — hard border below RSVP content; shifts when form grows */}
      <div
        className="absolute left-0 w-[390px] h-[287px] z-0 pointer-events-none"
        style={{ top: rsvpDecorTop }}
      >
        <Image 
          src="/invitation/page3-bottom-frame.png" 
          alt="Page 3 bottom floral frame" 
          fill 
          className="object-contain"
        />
      </div>
        </div>
      ) : (
        <div className="absolute top-[1719px] left-0 w-0 h-0" {...invitePage("rsvp")} />
      )}

      {/* =========================================================
          PAGE: allDetails — dynamic: detailNodes
          ========================================================= */}

      {showAllDetails ? (
        <div className="absolute left-0 top-0 w-full" style={shiftStyle("allDetails")}>
      {/* ALL THE DETAILS Text */}
      <div
        className="absolute top-[2609px] left-0 w-full h-[98px] flex items-center justify-center z-10"
        {...invitePage("allDetails")}
        {...dynamicField("detailNodes")}
      >
        <h1 className="font-cormorant-custom font-semibold text-[38px] tracking-wider uppercase text-center leading-none whitespace-nowrap" style={{ color: theme.pageTitle }}>
          ALL THE DETAILS
        </h1>
      </div>

      {/* 4.1 Lotus Divider */}
      <div className="absolute top-[2690px] left-1/2 -translate-x-1/2 w-[175px] h-[34px] z-0">
        <Image src="/invitation/4.1.png" alt="Page 4 lotus divider" fill className="object-contain" />
      </div>

      {/* CIRCLE 1 — table number disabled for now; keep markup for later re-enable */}
      {false && (
        <>
          <div className="absolute top-[2811px] left-[37px] w-[60px] h-[60px] rounded-full bg-[var(--invite-icon-fill)] border-[2px] border-[#C6A15B] z-0"></div>
          <div className="absolute top-[2823px] left-[46px] w-[43px] h-[35px] z-10">
            <Image src="/invitation/4.2.png" alt="Table number icon" fill className="object-contain" />
          </div>
          <div className="absolute top-[2811px] left-[160px] h-[60px] flex flex-col justify-center z-10 w-[210px]">
            <h3 className="font-cormorant-custom font-bold text-[18px] text-[var(--invite-subtitle)] tracking-widest uppercase leading-none mb-1.5">TABLE NUMBER</h3>
            <p className="font-quattrocento-custom font-bold text-[16px] text-[var(--invite-body)] leading-none">{t.tableNumber}</p>
          </div>
        </>
      )}

      {/* Detail nodes — contact is an optional list item (editable / removable) */}
      {resolvedDetailNodes.map((node, index) => {
        const top = 2811 + index * 102;
        const icon = resolveDetailIcon(node, index);
        const isContact =
          String(node?.kind || "").toLowerCase() === "contact" ||
          String(node?.iconKey || "").toLowerCase() === "contact";
        const phones = (
          Array.isArray(node?.phones) ? node.phones : []
        )
          .map((p) => ({
            name: String(p?.name || "").trim(),
            phone: String(p?.phone || "").trim(),
          }))
          .filter((p) => p.name || p.phone)
          .slice(0, 2);

        return (
          <div key={`detail-node-${index}`}>
            <div
              className="absolute left-[37px] w-[60px] h-[60px] rounded-full border-[2px] border-[#C6A15B] z-0 flex items-center justify-center text-white text-lg font-bold"
              style={{ top, backgroundColor: theme.iconFill }}
            >
              {!icon ? "i" : null}
            </div>
            {icon ? (
              <div
                className={`absolute ${icon.box} z-10`}
                style={{
                  top: top + (icon.topOffset ?? 12),
                  left: icon.left ?? 46,
                }}
              >
                <Image src={icon.src} alt={icon.alt} fill className="object-contain" />
              </div>
            ) : null}
            <div
              className="absolute left-[160px] h-[60px] flex flex-col justify-center z-10 w-[210px]"
              style={{ top }}
            >
              <h3 className="font-cormorant-custom font-bold text-[18px] text-[var(--invite-subtitle)] tracking-widest uppercase leading-none mb-1.5">
                {node.label || (isContact ? "Contact" : `Detail ${index + 1}`)}
              </h3>
              {isContact ? (
                phones.length ? (
                  phones.map((contact) => (
                    <p
                      key={`${contact.name}-${contact.phone}`}
                      className="font-quattrocento-custom font-bold text-[16px] text-[var(--invite-body)] leading-tight mb-1"
                    >
                      {[contact.name, contact.phone].filter(Boolean).join(" - ")}
                    </p>
                  ))
                ) : null
              ) : (
                <p className="font-quattrocento-custom font-bold text-[16px] text-[var(--invite-body)] leading-snug">
                  {node.value || ""}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Bottom floral — hard border below last detail item */}
      <div
        className="absolute left-[0px] w-[390px] h-[287px] z-0 pointer-events-none"
        style={{ top: detailsFloralTop }}
      >
        <Image src="/invitation/4.6.png" alt="Page 4 bottom frame" fill className="object-contain" />
      </div>
        </div>
      ) : (
        <div className="absolute top-[2609px] left-0 w-0 h-0" {...invitePage("allDetails")} />
      )}

      {showOurStory ? (
        <div className="absolute left-0 top-0 w-full" style={shiftStyle("ourStory")}>
        <div className="contents" {...invitePage("ourStory")} {...dynamicField("storyMilestones")}>
          <div className="absolute top-[3460px] left-0 w-full flex items-center justify-center z-10">
            <h1 className="font-cormorant-custom font-semibold text-[38px] tracking-wider uppercase text-center leading-none whitespace-nowrap" style={{ color: theme.pageTitle }}>
              OUR STORY
            </h1>
          </div>
          <div className="absolute top-[3510px] left-1/2 -translate-x-1/2 w-[175px] h-[34px] z-0">
            <Image src="/invitation/5.1.png" alt="Our story lotus divider" fill className="object-contain" />
          </div>
          <div className="absolute top-[3570px] w-full flex flex-col items-center justify-center z-10">
            <p className="font-quattrocento-custom font-bold text-[18px] text-[var(--invite-body)] text-center leading-relaxed">
              Every <span className="font-greatvibes-custom text-[30px] text-[var(--invite-subtitle)] font-normal mx-1">love story</span><br/>
              is beautiful,<br/>
              but ours is<br/>
              my favourite.
            </p>
          </div>
          <div className="absolute top-[3720px] left-1/2 -translate-x-1/2 w-[80px] h-[53px] z-0">
            <Image src="/invitation/0.2.png" alt="Small lotus" fill className="object-contain" />
          </div>
          {/* Bottom floral / gold ornament — hard border; shifts when milestones grow */}
          <div
            className="absolute left-[0px] w-[390px] h-[442px] z-0 pointer-events-none"
            style={{ top: 3861 + storyGrowth }}
          >
            <Image src="/invitation/5.7.png" alt="Page 5 floral background" fill className="object-contain" />
          </div>
          {timelineItems.length > 1 ? (
            <div
              className="absolute left-[119px] w-[2px] bg-[var(--invite-subtitle)] z-0"
              style={{
                top: 3840,
                height: (timelineItems.length - 1) * 90,
              }}
            />
          ) : null}
          {timelineItems.map((item, index) => {
            const top = 3810 + index * 90;
            const titleLines = String(item.title || "").split(/\n|<br\s*\/?>/i);
            return (
              <div key={`story-${index}`}>
                <div className="absolute left-[90px] w-[60px] h-[60px] rounded-full border border-[var(--invite-subtitle)] bg-white z-10 flex items-center justify-center shadow-sm" style={{ top }}>
                  <div className="relative w-[45px] h-[45px]">
                    <Image src={storyMilestoneIcon} alt="" fill className="object-contain" />
                  </div>
                </div>
                <div className="absolute left-[200px] h-[60px] flex flex-col justify-center z-10" style={{ top }}>
                  <h3 className="font-cormorant-custom font-bold text-[20px] text-[var(--invite-subtitle)] leading-none mb-1">{item.year || ""}</h3>
                  <p className="font-quattrocento-custom font-bold text-[16px] text-[var(--invite-body)] leading-tight">
                    {titleLines.map((line, li) => (
                      <span key={li}>{line}{li < titleLines.length - 1 ? <br /> : null}</span>
                    ))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      ) : (
        <div
          className="absolute left-0 w-0 h-0"
          style={{ top: 3460 }}
          {...invitePage("ourStory")}
        />
      )}

      {/* =========================================================
          PAGE: bigDay
          ========================================================= */}

      {showBigDay ? (
        <div className="absolute left-0 top-0 w-full" style={shiftStyle("bigDay")}>
      {/* THE BIG DAY Text */}
      <div
        className="absolute top-[4390px] left-0 w-full flex items-center justify-center z-10"
        {...invitePage("bigDay")}
      >
        <h1 className="font-cormorant-custom font-semibold text-[38px] tracking-wider uppercase text-center leading-none whitespace-nowrap" style={{ color: theme.pageTitle }}>
          THE BIG DAY
        </h1>
      </div>

      {/* 6.1 Lotus Divider */}
      <div className="absolute top-[4466px] left-1/2 -translate-x-1/2 w-[175px] h-[34px] z-0">
        <Image src="/invitation/6.1.png" alt="The big day lotus divider" fill className="object-contain" />
      </div>

      {/* We can't wait... Text */}
      <div className="absolute top-[4520px] w-full flex flex-col items-center justify-center z-10">
        <p className="font-quattrocento-custom font-bold text-[18px] text-[var(--invite-body)] text-center leading-relaxed">
          We can&apos;t wait to<br/>
          celebrate with you!
        </p>
      </div>

      {/* 6.2 Small Lotus */}
      <div className="absolute top-[4579px] left-1/2 -translate-x-1/2 w-[51px] h-[43px] z-0">
        <Image src="/invitation/0.2.png" alt="Small lotus decoration" fill className="object-contain" />
      </div>

      {/* 6.7 Background Floral */}
      <div className="absolute top-[4691px] left-[0px] w-[390px] h-[523px] z-0 pointer-events-none">
        <Image src="/invitation/6.7.png" alt="Page 6 floral background" fill className="object-contain object-bottom" />
      </div>

      {/* Event Block 1: Wednesday */}
      <div className="absolute top-[4648px] left-1/2 -translate-x-1/2 w-[206px] h-[129px] z-10 flex flex-col items-center pt-[24px]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image src="/invitation/6.4.png" alt="Event frame" fill className="object-contain" />
        </div>
        <div className="relative z-10 w-[36px] h-[36px] bg-[var(--invite-icon-fill)] rounded-full flex items-center justify-center mb-1">
          <div className="relative w-[18px] h-[18px]">
            <Image src="/invitation/6.3.png" alt="Calendar icon" fill className="object-contain" />
          </div>
        </div>
        <h3 className="relative z-10 font-cormorant-custom font-bold text-[15px] text-[var(--invite-body)] tracking-widest uppercase leading-none mb-1.5 text-center">{t.weekday}</h3>
        <p className="relative z-10 font-quattrocento-custom font-bold text-[16px] text-[var(--invite-body)] text-center leading-none">{t.longDate}</p>
      </div>

      {/* Event Block 2: Poruwa Ceremony */}
      <div className="absolute top-[4795px] left-1/2 -translate-x-1/2 w-[206px] h-[129px] z-10 flex flex-col items-center pt-[24px]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image src="/invitation/6.4.png" alt="Event frame" fill className="object-contain" />
        </div>
        <div className="relative z-10 w-[36px] h-[36px] bg-[var(--invite-icon-fill)] rounded-full flex items-center justify-center mb-1">
          <div className="relative w-[18px] h-[18px]">
            <Image src="/invitation/6.5.png" alt="Clock icon" fill className="object-contain" />
          </div>
        </div>
        <h3 className="relative z-10 font-cormorant-custom font-bold text-[14px] text-[var(--invite-body)] tracking-widest uppercase leading-none mb-1.5 text-center px-2">PORUWA CEREMONY</h3>
        <p className="relative z-10 font-quattrocento-custom font-bold text-[16px] text-[var(--invite-body)] text-center leading-none">{t.poruwaTime}</p>
      </div>

      {/* Event Block 3: Granbell Hotel */}
      <div className="absolute top-[4941px] left-1/2 -translate-x-1/2 w-[206px] h-[129px] z-10 flex flex-col items-center pt-[18px]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image src="/invitation/6.4.png" alt="Event frame" fill className="object-contain" />
        </div>
        <div className="relative z-10 w-[36px] h-[36px] bg-[var(--invite-icon-fill)] rounded-full flex items-center justify-center mb-1">
          <div className="relative w-[18px] h-[18px]">
            <Image src="/invitation/6.6.png" alt="Location icon" fill className="object-contain" />
          </div>
        </div>
        <h3 className="relative z-10 font-cormorant-custom font-bold text-[14px] text-[var(--invite-body)] tracking-widest uppercase leading-none mb-1.5 text-center px-2">{t.hotelName}</h3>
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="relative z-10 bg-[var(--invite-icon-fill)] text-white font-quattrocento-custom text-[10px] font-bold py-2 px-8 rounded-full tracking-wider hover:bg-[#342461] transition-colors leading-none shadow-md"
          >
            VIEW MAP
          </a>
        ) : null}
      </div>
        </div>
      ) : (
        <div className="absolute top-[4390px] left-0 w-0 h-0" {...invitePage("bigDay")} />
      )}

      {/* =========================================================
          PAGE: journey
          ========================================================= */}

      {showJourney ? (
        <div className="absolute left-0 top-0 w-full" style={shiftStyle("journey")}>
      {/* OUR JOURNEY Text */}
      <div
        className="absolute top-[5280px] left-0 w-full flex items-center justify-center z-10"
        {...invitePage("journey")}
        {...dynamicField("journeyImages")}
      >
        <h1 className="font-cormorant-custom font-semibold text-[38px] tracking-wider uppercase text-center leading-none whitespace-nowrap" style={{ color: theme.pageTitle }}>
          OUR JOURNEY
        </h1>
      </div>

      {/* 7.1 Lotus Divider */}
      <div className="absolute top-[5350px] left-1/2 -translate-x-1/2 w-[175px] h-[34px] z-0">
        <Image src="/invitation/7.1.png" alt="Our journey lotus divider" fill className="object-contain" />
      </div>

      {resolvedJourneyItems.map((item, index) => {
            const isLandscape = item.orientation === "landscape";
            const top = 5403 + index * 170;
            const alignRight = index % 2 === 1;
            const box = isLandscape
              ? { width: 175, height: 120 }
              : { width: 103, height: 155 };
            const captionLines = String(item.caption || "")
              .split(/\n|<br\s*\/?>/i)
              .map((line) => line.trim())
              .filter(Boolean);
            const captionTop = top + (isLandscape ? 20 : 37);
            const captionSide = alignRight ? "left" : "right";

            return (
              <div key={item.key || `journey-row-${index}`}>
                <div
                  className="absolute z-10 overflow-hidden rounded-[12px] shadow-md"
                  style={{
                    top,
                    width: box.width,
                    height: box.height,
                    left: alignRight ? undefined : 21,
                    right: alignRight ? 26 : undefined,
                    backgroundColor: isLandscape ? theme.accent : undefined,
                  }}
                >
                  <Image
                    src={journeyImages[index]}
                    alt={`Journey ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {captionLines.length ? (
                  <div
                    className="absolute z-10 flex items-center justify-center"
                    style={{
                      top: captionTop,
                      width: isLandscape ? 155 : 198,
                      left: captionSide === "left" ? 40 : undefined,
                      right: captionSide === "right" ? 21 : undefined,
                    }}
                  >
                    <p className="font-greatvibes-custom text-[28px] text-[var(--invite-subtitle)] text-center leading-snug">
                      {captionLines.map((line, li) => (
                        <span key={li}>
                          {line}
                          {li < captionLines.length - 1 ? <br /> : null}
                        </span>
                      ))}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}

      {/* 7.6 Background Floral */}
      <div
        className="absolute left-[0px] w-[390px] h-[287px] z-20 pointer-events-none"
        style={{ top: 5913 + journeyGrowth }}
      >
        <Image src="/invitation/7.6.png" alt="Page 7 floral background" fill className="object-contain" />
      </div>
        </div>
      ) : (
        <div className="absolute top-[5280px] left-0 w-0 h-0" {...invitePage("journey")} />
      )}

      {/* =========================================================
          PAGE: closing
          ========================================================= */}

      {showClosing ? (
        <div className="absolute left-0 top-0 w-full" style={shiftStyle("closing")}>
      {/* OUR HEARTS ARE FULL Text */}
      <div className="absolute top-[6220px] left-0 w-full flex items-center justify-center z-10" {...invitePage("closing")}>
        <h1 className="font-cormorant-custom font-semibold text-[38px] text-[var(--invite-page-title)] tracking-wider uppercase text-center leading-[1.2]">
          OUR HEARTS ARE<br/>FULL
        </h1>
      </div>

      {/* 8.1 Lotus Divider */}
      <div className="absolute top-[6330px] left-1/2 -translate-x-1/2 w-[175px] h-[34px] z-0">
        <Image src="/invitation/8.1.png" alt="Our hearts lotus divider" fill className="object-contain" />
      </div>

      {/* Paragraph Text */}
      <div className="absolute top-[6390px] w-full flex flex-col items-center justify-center z-10 px-8">
        <p className="font-quattrocento-custom font-bold text-[17px] text-[var(--invite-body)] text-center leading-[1.6]">
          As we step into this dream<br/>
          together, we carry your love<br/>
          with us.<br/>
          Thank you for witnessing two<br/>
          hearts become one.<br/>
          Forever & Always,
        </p>
      </div>

      {/* Kasun & Hiruni */}
      <div className="absolute top-[6565px] w-full flex items-center justify-center z-10">
        <p className="font-greatvibes-custom text-[34px] text-[var(--invite-subtitle)] text-center">
          {coupleNames}
        </p>
      </div>

      {/* 8.2 Thank you! Text and Image */}
      <div
        className="absolute top-[6680px] w-full flex flex-col items-center justify-center z-10 gap-2"
      >
        <p className="font-greatvibes-custom font-bold text-[30px] text-center leading-none" style={{ color: theme.pageTitle }}>
          Thank you!
        </p>
        <div className="relative w-[80px] h-[53px]">
          <Image src="/invitation/0.2.png" alt="Small lotus" fill className="object-contain" />
        </div>
      </div>

      {/* 8.3 Background Floral */}
      <div className="absolute top-[6760px] left-[0px] w-[390px] h-[260px] z-0 pointer-events-none origin-bottom scale-[1.15]">
        <Image src="/invitation/8.3.png" alt="Page 8 floral background" fill className="object-contain object-bottom" />
      </div>
        </div>
      ) : (
        <div className="absolute top-[6220px] left-0 w-0 h-0" {...invitePage("closing")} />
      )}

      {/* Footer — always at packed canvas bottom */}
      <div
        className="absolute left-0 w-full h-[80px] bg-[#FAF6F0] z-20 flex items-center justify-center gap-5"
        style={{ top: canvasHeight - FOOTER_HEIGHT }}
      >
        
        {/* Left Side: Wed Flow */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-[36px] h-[36px]">
            <Image src="/footer/wedflow-logo.png" alt="Wed Flow logo" fill className="object-contain" unoptimized />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-serif font-bold text-[18px] text-[#1B1B1B] leading-none mb-0.5 tracking-wide">Wed Flow</span>
            <span className="font-sans text-[7px] text-[#49454F] leading-tight text-left">Events. People. Possibilities.</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[28px] w-px bg-[#1B1B1B] shrink-0"></div>

        {/* Right Side: Powered by KLAYNZ */}
        <a 
          href="https://klaynz.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="font-sans text-[8px] text-[#49454F]">Powered by</span>
          <div className="relative w-[32px] h-[32px]">
            <Image src="/footer/KLAYNZ logo.png" alt="KLAYNZ logo" fill className="object-contain" />
          </div>
          <span className="font-sans font-bold text-[12px] tracking-[0.15em] text-[#1B1B1B]">KLAYNZ</span>
        </a>

      </div>

    </div>
  );
}
