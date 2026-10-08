const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const { sequelize } = require("../models");
const { toDateOnly, formatDisplayCoupleNames } = require("./wedding");

const EVENTS_PER_PAGE = 13;
const CORP_EVENTS_PER_PAGE = 10;
const PARTY_EVENTS_PER_PAGE = 8;
const PAGE_WIDTH = 390;
const PAGE_HEIGHT = 844;

/** Wedding templates */
const CLEAN_BG = path.join(
  __dirname,
  "../../assets/schedule-templates/wedding-timeline-bg.png"
);

const REFERENCE_COMPOSITE = path.join(
  __dirname,
  "../../assets/schedule-templates/wedding-timeline-reference.png"
);

const FALLBACK_BG = path.join(
  __dirname,
  "../../assets/schedule-templates/default-schedule-bg.png"
);

/** Corporate schedule assets */
const CORP_BG_IMG = path.join(
  __dirname,
  "../../events/corporate-events/templates/template-1/chrome/event-schedule/event-schedule_background.png"
);

/** Party schedule assets */
const PARTY_TOP_BG = path.join(
  __dirname,
  "../../events/parties/templates/template-1/chrome/schedule-page/top-bg.png"
);
const PARTY_BOTTOM_BG = path.join(
  __dirname,
  "../../events/parties/templates/template-1/chrome/schedule-page/bottom-bg.png"
);
const PARTY_UNDERLINE = path.join(
  __dirname,
  "../../events/parties/templates/template-1/chrome/schedule-page/underline-deco.png"
);

const PARTY_ICONS = {
  drink: path.join(__dirname, "../../events/parties/templates/template-1/chrome/schedule-page/drink.png"),
  mic: path.join(__dirname, "../../events/parties/templates/template-1/chrome/schedule-page/mic.png"),
  food: path.join(__dirname, "../../events/parties/templates/template-1/chrome/schedule-page/food.png"),
  music: path.join(__dirname, "../../events/parties/templates/template-1/chrome/schedule-page/music.png"),
  celebrate: path.join(__dirname, "../../events/parties/templates/template-1/chrome/schedule-page/celebrate.png"),
  dj: path.join(__dirname, "../../events/parties/templates/template-1/chrome/schedule-page/dj.png"),
};

const DEFAULT_CORP_AGENDA = [
  { startTime: "09:00 AM", title: "Registration & Welcome Tea", note: "Ocean View Lobby" },
  { startTime: "09:30 AM", title: "Opening Remarks", note: "Grand Ballroom" },
  { startTime: "10:00 AM", title: "Keynote Session", note: "The Future of Business" },
  { startTime: "11:30 AM", title: "Panel Discussion", note: "Industry Trends" },
  { startTime: "01:00 PM", title: "Networking Lunch", note: "Sapphire Lawn" },
  { startTime: "02:30 PM", title: "Breakout Sessions", note: "Multiple Rooms" },
  { startTime: "04:00 PM", title: "Closing Ceremony", note: "Main Ballroom" },
  { startTime: "05:00 PM", title: "Cocktail & Networking", note: "Garden View" },
];

const DEFAULT_PARTY_ITEMS = [
  { startTime: "06:00 PM", title: "Guest Arrival & Welcome Drinks", icon: "drink" },
  { startTime: "06:30 PM", title: "Opening & Welcome", icon: "mic" },
  { startTime: "07:00 PM", title: "Dinner Service", icon: "food" },
  { startTime: "08:30 PM", title: "Live Music & Entertainment", icon: "music" },
  { startTime: "09:30 PM", title: "Games & Activities", icon: "celebrate" },
  { startTime: "10:30 PM", title: "DJ Night & Dance", icon: "dj" },
];

const FONT_FALLBACK_REGULAR = "C:\\Windows\\Fonts\\georgia.ttf";
const FONT_FALLBACK_BOLD = "C:\\Windows\\Fonts\\georgiab.ttf";

const {
  DEFAULT_SCHEDULE_TEXT_STYLE,
  mergeScheduleTextStyle,
  resolveFontFile,
} = require("./scheduleTextStyle");

// Wedding layout geometry
const WEDDING_LAYOUT = {
  leftMargin: 34,
  nameTop: 42,
  subtitleTopOffset: 6,
  timelineTop: 196,
  timelineBottom: 760,
  lineX: 136,
  timeRightGap: 12,
  titleLeftGap: 12,
  titleMaxWidth: 178,
  dotRadius: 3,
  lineWidth: 1,
  footerLeft: 34,
  footerY1: 788,
  footerY2: 806,
  colors: {
    brown: "#6B4226",
    dark: "#2D1B10",
    line: "#8B5E3C",
  },
};

function resolveBackgroundPath(scheduleImageUrl) {
  const candidates = [];

  if (scheduleImageUrl) {
    const raw = String(scheduleImageUrl).replace(/\\/g, "/");
    if (raw.includes("wedding-timeline-reference")) {
      candidates.push(CLEAN_BG);
    }
    if (path.isAbsolute(scheduleImageUrl)) candidates.push(scheduleImageUrl);
    candidates.push(path.resolve(process.cwd(), scheduleImageUrl));
    candidates.push(path.resolve(__dirname, "../..", scheduleImageUrl));
  }

  candidates.push(CLEAN_BG, REFERENCE_COMPOSITE, FALLBACK_BG);

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function isCompositeReference(backgroundPath) {
  if (!backgroundPath) return false;
  return String(backgroundPath)
    .replace(/\\/g, "/")
    .toLowerCase()
    .includes("wedding-timeline-reference");
}

function formatFooterDate(dateValue) {
  const dateOnly = toDateOnly(dateValue);
  if (!dateOnly) return "";
  const d = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(dateOnly).toUpperCase();
  return d
    .toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

function formatAmPm(time24) {
  if (!time24 || !/^\d{2}:\d{2}/.test(String(time24))) return "";
  const [hStr, mStr] = String(time24).slice(0, 5).split(":");
  let hours = Number(hStr);
  const minutes = mStr;
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${period}`;
}

function splitCoupleNameLines(coupleNames) {
  const raw = String(coupleNames || "Our Wedding").trim();
  if (raw.includes("&")) {
    const [left, ...rest] = raw.split("&").map((p) => p.trim());
    return [`${left} &`, rest.join(" & ").trim() || ""].filter(Boolean);
  }
  const parts = raw.split(/\s+/);
  if (parts.length >= 2) {
    const mid = Math.ceil(parts.length / 2);
    return [parts.slice(0, mid).join(" "), parts.slice(mid).join(" ")];
  }
  return [raw];
}

function chunkEvents(events, size = EVENTS_PER_PAGE) {
  if (!events.length) return [[]];
  const pages = [];
  for (let i = 0; i < events.length; i += size) {
    pages.push(events.slice(i, i + size));
  }
  return pages;
}

function registerFonts(doc, textStyle) {
  const style = mergeScheduleTextStyle(textStyle);
  const fonts = {
    script: "Times-Bold",
    event: "Times-Roman",
    eventSemi: "Times-Bold",
    time: "Times-Bold",
    footer: "Times-Roman",
    subtitle: "Times-Roman",
    title: "Times-Bold",
    text: "Helvetica",
    textBold: "Helvetica-Bold",
  };

  const registerNamed = (alias, fileName, fallbackAlias) => {
    const resolved = resolveFontFile(fileName);
    if (resolved) {
      doc.registerFont(alias, resolved.absolutePath);
      return alias;
    }
    return fallbackAlias;
  };

  if (
    fs.existsSync(FONT_FALLBACK_REGULAR) &&
    fs.existsSync(FONT_FALLBACK_BOLD)
  ) {
    doc.registerFont("ScheduleFallback", FONT_FALLBACK_REGULAR);
    doc.registerFont("ScheduleFallback-Bold", FONT_FALLBACK_BOLD);
    fonts.script = "ScheduleFallback-Bold";
    fonts.event = "ScheduleFallback";
    fonts.eventSemi = "ScheduleFallback-Bold";
    fonts.time = "ScheduleFallback-Bold";
    fonts.footer = "ScheduleFallback";
    fonts.subtitle = "ScheduleFallback";
    fonts.title = "ScheduleFallback-Bold";
  }

  if (fs.existsSync("C:\\Windows\\Fonts\\segoeui.ttf")) {
    doc.registerFont("AppSegoeUI", "C:\\Windows\\Fonts\\segoeui.ttf");
    fonts.text = "AppSegoeUI";
  }
  if (fs.existsSync("C:\\Windows\\Fonts\\segoeuib.ttf")) {
    doc.registerFont("AppSegoeUI-Bold", "C:\\Windows\\Fonts\\segoeuib.ttf");
    fonts.textBold = "AppSegoeUI-Bold";
  }

  fonts.script = registerNamed("ScheduleScript", style.name_font, fonts.script);
  fonts.subtitle = registerNamed(
    "ScheduleSubtitle",
    style.subtitle_font,
    fonts.subtitle
  );
  fonts.time = registerNamed("ScheduleTime", style.time_font, fonts.time);
  fonts.eventSemi = registerNamed(
    "ScheduleEvent",
    style.event_font,
    fonts.eventSemi
  );
  fonts.footer = registerNamed("ScheduleFooter", style.footer_font, fonts.footer);

  return { fonts, textStyle: style };
}

async function loadScheduleDownloadContext(weddingId) {
  const [[weddingRows], [eventRows], [inviteRows]] = await Promise.all([
    sequelize.query(
      `
      SELECT
        w.id,
        w.couple_names,
        w.bride_name,
        w.groom_name,
        w.wedding_date,
        w.schedule_image_url,
        w.schedule_title,
        w.schedule_venue,
        w.schedule_style_json,
        w.event_id,
        e.type AS event_type,
        e.name AS event_name,
        e.template_config AS event_template_config,
        e.location AS event_location
      FROM weddings w
      LEFT JOIN events e ON e.id = w.event_id
      WHERE w.id = ? OR w.event_id = ?
      LIMIT 1;
      `,
      { replacements: [weddingId, weddingId] }
    ),
    sequelize.query(
      `
      SELECT event_time, end_time, title, special_notes, location
      FROM schedule_events
      WHERE wedding_id = ?
      ORDER BY event_time ASC, display_order ASC;
      `,
      { replacements: [weddingId] }
    ),
    sequelize.query(
      `
      SELECT hotel_name
      FROM invitations
      WHERE wedding_id = ?
      LIMIT 1;
      `,
      { replacements: [weddingId] }
    ),
  ]);

  const wedding = weddingRows[0];
  if (!wedding) return null;

  let events = eventRows.map((row) => ({
    startTime: row.event_time ? String(row.event_time).slice(0, 5) : "",
    title: row.title || "",
    note: row.special_notes || row.location || "",
  }));

  const isCorporate = String(wedding.event_type || "").toLowerCase() === "corporate";
  const isParty = String(wedding.event_type || "").toLowerCase() === "party";
  let eventFields = {};
  if ((isCorporate || isParty) && wedding.event_template_config) {
    try {
      const cfg =
        typeof wedding.event_template_config === "string"
          ? JSON.parse(wedding.event_template_config)
          : wedding.event_template_config;
      eventFields = cfg.fields || {};
    } catch (_) {}

    if (isCorporate && Array.isArray(eventFields.agendaItems) && eventFields.agendaItems.length > 0) {
      events = eventFields.agendaItems
        .filter((item) => item.time || item.title)
        .map((item) => ({
          startTime: item.time || "",
          title: item.title || "",
          note: item.location || "",
        }));
    } else if (isParty && Array.isArray(eventFields.scheduleItems) && eventFields.scheduleItems.length > 0) {
      events = eventFields.scheduleItems
        .filter((item) => item.time || item.title || item.desc)
        .map((item) => ({
          startTime: item.time || "",
          title: item.title || item.desc || "",
          note: item.description || item.location || "",
          icon: item.icon || "celebrate",
        }));
    }
  }

  // Fallback defaults if no schedule items exist in DB
  if (isCorporate && events.length === 0) {
    events = [...DEFAULT_CORP_AGENDA];
  } else if (isParty && events.length === 0) {
    events = [...DEFAULT_PARTY_ITEMS];
  }

  const coupleNames = isCorporate
    ? (eventFields.orgName || wedding.event_name || wedding.couple_names || "EVENT")
    : isParty
      ? (wedding.event_name || wedding.couple_names || "GALA NIGHT")
      : (formatDisplayCoupleNames({
          brideName: wedding.bride_name,
          groomName: wedding.groom_name,
          coupleNames: wedding.couple_names,
        }) || wedding.couple_names);

  const title = isCorporate
    ? (eventFields.scheduleTitle || wedding.schedule_title || "Event Agenda")
    : isParty
      ? (eventFields.scheduleTitle || wedding.schedule_title || "Event Schedule")
      : (wedding.schedule_title || "WEDDING TIMELINE").toUpperCase();

  const venue = isCorporate
    ? (eventFields.eventVenueLabel || wedding.event_location || wedding.schedule_venue || inviteRows[0]?.hotel_name || "").toUpperCase()
    : isParty
      ? (wedding.event_location || wedding.schedule_venue || inviteRows[0]?.hotel_name || "").toUpperCase()
      : (wedding.schedule_venue || inviteRows[0]?.hotel_name || "").toUpperCase();

  const weddingDateLabel = isCorporate && eventFields.eventDateLabel
    ? eventFields.eventDateLabel
    : formatFooterDate(wedding.wedding_date);

  return {
    isCorporate,
    isParty,
    coupleNames,
    weddingDateLabel,
    title,
    venue,
    eventFields,
    backgroundPath: (isCorporate || isParty) ? null : resolveBackgroundPath(wedding.schedule_image_url),
    textStyle: mergeScheduleTextStyle(wedding.schedule_style_json),
    events,
  };
}

/** Draws Corporate Agenda matching the template page design */
function drawCorporatePage(doc, context, pageEvents, fonts, pageIndex, totalPages) {
  const fields = context.eventFields || {};
  const topColor = fields.gradientTop || "#D4E0F7";
  const midColor = fields.gradientMid || "#FFFFFF";
  const botColor = fields.gradientBottom || "#A5DBFD";

  // Background gradient
  const grad = doc.linearGradient(0, 0, 0, PAGE_HEIGHT);
  grad.stop(0, topColor).stop(0.4, midColor).stop(1, botColor);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(grad);

  // Header Title & Subtitle
  const baseTitle = context.title || "Event Agenda";
  const titleText = totalPages > 1 && pageIndex > 0
    ? `${baseTitle} (Cont.)`
    : baseTitle;

  doc
    .fillColor("#080480")
    .font(fonts.title)
    .fontSize(24)
    .text(titleText, 0, 22, { width: PAGE_WIDTH, align: "center" });

  doc
    .fillColor("#080480")
    .font(fonts.text)
    .fontSize(10.5)
    .text("A day of insights and connection.", 0, 50, { width: PAGE_WIDTH, align: "center" });

  // Timeline (10 items per page)
  const startY = 76;
  const lineX = 62;
  const count = pageEvents.length;
  const rowStep = count > 1 ? Math.min(49, (535 - startY) / (count - 1)) : 49;

  if (count > 0) {
    const endY = count > 1 ? startY + (count - 1) * rowStep + 8 : startY + 8;
    doc.save()
      .strokeColor("#5B61EA")
      .lineWidth(2)
      .moveTo(lineX, startY + 8)
      .lineTo(lineX, endY)
      .stroke()
      .restore();
  }

  pageEvents.forEach((item, idx) => {
    const y = startY + idx * rowStep;
    // Node circle
    doc.save()
      .circle(lineX, y + 8, 7)
      .fill("#FFFFFF")
      .strokeColor("#5B61EA")
      .lineWidth(2)
      .stroke()
      .restore();

    const rawTime = String(item.startTime || "");
    const timeLabel = rawTime.includes("AM") || rawTime.includes("PM") ? rawTime : (formatAmPm(rawTime) || rawTime);
    const textX = lineX + 18;
    const textW = 285;

    doc.fillColor("#080480").font(fonts.textBold).fontSize(11.5).text(timeLabel, textX, y - 4, { width: textW, lineBreak: false });
    doc.fillColor("#080480").font(fonts.textBold).fontSize(10.5).text(item.title || "", textX, y + 10, { width: textW, lineBreak: false, ellipsis: true });
    if (item.note) {
      doc.fillColor("#7A8797").font(fonts.text).fontSize(9).text(item.note, textX, y + 24, { width: textW, lineBreak: false, ellipsis: true });
    }
  });

  // Quote (on last page)
  if (pageIndex === totalPages - 1) {
    doc.fillColor("#080480").font(fonts.title).fontSize(13).text('" A Greater Tomorrow', 20, 584, { width: 350, align: "center" });
    doc.fillColor("#080480").font(fonts.title).fontSize(13).text('At A Brighter Together "', 20, 602, { width: 350, align: "center" });
  }

  // Bottom graphic
  if (fs.existsSync(CORP_BG_IMG)) {
    doc.image(CORP_BG_IMG, 0, PAGE_HEIGHT - 162, { width: PAGE_WIDTH, height: 162 });
  }
}

/** Draws Party Schedule matching the template page design */
function drawPartyPage(doc, context, pageEvents, fonts, pageIndex, totalPages) {
  const fields = context.eventFields || {};
  const topColor = fields.gradientTop || "#588dcf";
  const midColor = fields.gradientMid || "#e5f2fd";
  const botColor = fields.gradientBottom || "#4377bd";

  // Background gradient
  const grad = doc.linearGradient(0, 0, 0, PAGE_HEIGHT);
  grad.stop(0, topColor).stop(0.45, midColor).stop(1, botColor);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(grad);

  // Top decorative image
  if (fs.existsSync(PARTY_TOP_BG)) {
    doc.image(PARTY_TOP_BG, 0, 0, { width: PAGE_WIDTH });
  }

  // Bottom decorative image
  if (fs.existsSync(PARTY_BOTTOM_BG)) {
    doc.image(PARTY_BOTTOM_BG, 0, PAGE_HEIGHT - 250, { width: PAGE_WIDTH, height: 250 });
  }

  // Header Title
  const baseTitle = context.title || "Event Schedule";
  const titleText = totalPages > 1 && pageIndex > 0
    ? `${baseTitle} (Cont.)`
    : baseTitle;

  doc
    .fillColor("#0c1e48")
    .font(fonts.title)
    .fontSize(26)
    .text(titleText, 0, 98, { width: PAGE_WIDTH, align: "center" });

  // Underline decoration
  if (fs.existsSync(PARTY_UNDERLINE)) {
    doc.image(PARTY_UNDERLINE, (PAGE_WIDTH - 160) / 2, 126, { width: 160, height: 48 });
  }

  // Timeline (8 items per page)
  const startY = 182;
  const circleRadius = 18;
  const circleX = 70;
  const lineX = circleX + circleRadius; // 88
  const count = pageEvents.length;
  const rowStep = count > 1 ? Math.min(49, (535 - startY) / (count - 1)) : 49;

  if (count > 0) {
    const endY = count > 1 ? startY + (count - 1) * rowStep + circleRadius : startY + circleRadius;
    doc.save()
      .strokeColor("#d8b87a")
      .lineWidth(2)
      .moveTo(lineX, startY + circleRadius)
      .lineTo(lineX, endY)
      .stroke()
      .restore();
  }

  pageEvents.forEach((item, idx) => {
    const y = startY + idx * rowStep;
    const centerY = y + circleRadius;

    // Golden circle
    doc.save()
      .circle(lineX, centerY, circleRadius)
      .fill("#ecdaab")
      .restore();

    // Icon PNG
    const iconKey = String(item.icon || "celebrate").toLowerCase();
    const iconPath = PARTY_ICONS[iconKey] || PARTY_ICONS.celebrate;
    if (fs.existsSync(iconPath)) {
      doc.image(iconPath, lineX - 10, centerY - 10, { width: 20, height: 20 });
    }

    const rawTime = String(item.startTime || "");
    const timeLabel = rawTime.includes("AM") || rawTime.includes("PM") ? rawTime : (formatAmPm(rawTime) || rawTime);
    const textX = lineX + circleRadius + 14;
    const textW = 248;

    doc.fillColor("#0c1e48").font(fonts.textBold).fontSize(12.5).text(timeLabel, textX, y - 2, { width: textW, lineBreak: false });
    doc.fillColor("#1e3a7a").font(fonts.text).fontSize(10.5).text(item.title || item.note || "", textX, y + 15, { width: textW, lineBreak: false, ellipsis: true });
  });
}

/** Draws Wedding Timeline matching the traditional floral design */
function drawWeddingPage(doc, context, pageEvents, fonts) {
  const {
    leftMargin,
    nameTop,
    subtitleTopOffset,
    timelineTop,
    timelineBottom,
    lineX,
    timeRightGap,
    titleLeftGap,
    titleMaxWidth,
    dotRadius,
    lineWidth,
    footerLeft,
    footerY1,
    footerY2,
    colors,
  } = WEDDING_LAYOUT;

  const style = context.textStyle || DEFAULT_SCHEDULE_TEXT_STYLE;
  const nameFontSize = style.name_font_size;
  const nameLineHeight = style.name_line_height;
  const nameSecondLineIndent = style.name_second_line_indent;
  const subtitleFontSize = style.subtitle_font_size;
  const subtitleTracking = style.subtitle_tracking;
  const eventTimeSize = style.time_font_size;
  const eventTitleSize = style.event_font_size;
  const footerFontSize = style.footer_font_size;

  if (context.backgroundPath) {
    doc.image(context.backgroundPath, 0, 0, {
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
    });

    if (isCompositeReference(context.backgroundPath)) {
      doc.save();
      doc.fillColor("#F9F7F2");
      doc.rect(14, 24, 240, 160).fill();
      doc.rect(14, 170, 262, 565).fill();
      doc.rect(14, 730, 250, 95).fill();
      doc.restore();
    }
  } else {
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill("#F9F7F2");
  }

  // Header — couple names
  const nameLines = splitCoupleNameLines(context.coupleNames);

  doc
    .fillColor(colors.brown)
    .font(fonts.script)
    .fontSize(nameFontSize);

  nameLines.forEach((line, index) => {
    const x = index === 0 ? leftMargin : leftMargin + nameSecondLineIndent;
    doc.text(line, x, nameTop + index * nameLineHeight, {
      width: 320,
      align: "left",
      lineBreak: false,
    });
  });

  const subtitleY =
    nameTop + nameLines.length * nameLineHeight + subtitleTopOffset;
  doc
    .fillColor(colors.brown)
    .font(fonts.subtitle)
    .fontSize(subtitleFontSize)
    .text(context.title, leftMargin, subtitleY, {
      width: 320,
      align: "left",
      characterSpacing: subtitleTracking,
      lineBreak: false,
    });

  // Vertical timeline
  const slotCount = Math.max(pageEvents.length - 1, 1);
  const rowHeight =
    pageEvents.length > 1
      ? (timelineBottom - timelineTop) / Math.max(EVENTS_PER_PAGE - 1, slotCount)
      : 0;
  const firstY = timelineTop;
  const lastY =
    pageEvents.length > 1
      ? timelineTop + rowHeight * (pageEvents.length - 1)
      : timelineTop;

  if (pageEvents.length > 0) {
    doc
      .save()
      .strokeColor(colors.line)
      .lineWidth(lineWidth)
      .moveTo(lineX, firstY)
      .lineTo(lineX, lastY)
      .stroke()
      .restore();
  }

  pageEvents.forEach((event, index) => {
    const y = timelineTop + rowHeight * index;
    const rawTime = String(event.startTime || "");
    const timeLabel = rawTime.includes("AM") || rawTime.includes("PM") ? rawTime : formatAmPm(rawTime);
    const title = String(event.title || "").toUpperCase();

    doc.save().circle(lineX, y, dotRadius).fill(colors.line).restore();

    doc
      .fillColor(colors.dark)
      .font(fonts.time)
      .fontSize(eventTimeSize)
      .text(timeLabel, leftMargin, y - eventTimeSize / 2, {
        width: lineX - leftMargin - timeRightGap,
        align: "right",
        lineBreak: false,
      });

    doc
      .fillColor(colors.dark)
      .font(fonts.eventSemi)
      .fontSize(eventTitleSize)
      .text(title, lineX + titleLeftGap, y - eventTitleSize / 2, {
        width: titleMaxWidth,
        align: "left",
        lineBreak: false,
        ellipsis: true,
      });

    if (event.note) {
      doc
        .fillColor(colors.dark)
        .font(fonts.footer)
        .fontSize(9)
        .text(event.note, lineX + titleLeftGap, y + eventTitleSize / 2 + 1, {
          width: titleMaxWidth,
          align: "left",
          lineBreak: false,
          ellipsis: true,
        });
    }
  });

  // Footer — date + venue
  doc
    .fillColor(colors.brown)
    .font(fonts.footer)
    .fontSize(footerFontSize)
    .text(context.weddingDateLabel || "", footerLeft, footerY1, {
      width: 320,
      align: "left",
      lineBreak: false,
    });

  if (context.venue) {
    doc
      .fillColor(colors.dark)
      .font(fonts.footer)
      .fontSize(footerFontSize)
      .text(context.venue, footerLeft, footerY2, {
        width: 320,
        align: "left",
        lineBreak: false,
        ellipsis: true,
      });
  }
}

async function buildSchedulePdfBuffer(weddingId) {
  const context = await loadScheduleDownloadContext(weddingId);
  if (!context) {
    throw new Error("Wedding not found");
  }

  const eventsPerPage = context.isCorporate
    ? CORP_EVENTS_PER_PAGE
    : context.isParty
      ? PARTY_EVENTS_PER_PAGE
      : EVENTS_PER_PAGE;
  const pages = chunkEvents(context.events, eventsPerPage);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [PAGE_WIDTH, PAGE_HEIGHT],
      margin: 0,
      autoFirstPage: false,
    });
    const fontsBundle = registerFonts(doc, context.textStyle);
    const fonts = fontsBundle.fonts;
    context.textStyle = fontsBundle.textStyle;
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    pages.forEach((pageEvents, pageIndex) => {
      doc.addPage({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: 0 });
      if (context.isCorporate) {
        drawCorporatePage(doc, context, pageEvents, fonts, pageIndex, pages.length);
      } else if (context.isParty) {
        drawPartyPage(doc, context, pageEvents, fonts, pageIndex, pages.length);
      } else {
        drawWeddingPage(doc, context, pageEvents, fonts);
      }
    });

    doc.end();
  });
}

module.exports = {
  EVENTS_PER_PAGE,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  buildSchedulePdfBuffer,
  loadScheduleDownloadContext,
  resolveBackgroundPath,
  DEFAULT_BG: CLEAN_BG,
  CLEAN_BG,
  DEFAULT_SCHEDULE_TEXT_STYLE,
};
