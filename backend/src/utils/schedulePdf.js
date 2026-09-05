const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const { sequelize } = require("../models");
const { toDateOnly, formatDisplayCoupleNames } = require("./wedding");

const EVENTS_PER_PAGE = 13;
const PAGE_WIDTH = 390;
const PAGE_HEIGHT = 844;

/** Exact floral art (no baked-in sample text) — preferred background */
const CLEAN_BG = path.join(
  __dirname,
  "../../assets/schedule-templates/wedding-timeline-bg.png"
);

/** Full reference composite (has sample text — only used as last resort) */
const REFERENCE_COMPOSITE = path.join(
  __dirname,
  "../../assets/schedule-templates/wedding-timeline-reference.png"
);

const FALLBACK_BG = path.join(
  __dirname,
  "../../assets/schedule-templates/default-schedule-bg.png"
);

const FONT_FALLBACK_REGULAR = "C:\\Windows\\Fonts\\georgia.ttf";
const FONT_FALLBACK_BOLD = "C:\\Windows\\Fonts\\georgiab.ttf";

const {
  DEFAULT_SCHEDULE_TEXT_STYLE,
  mergeScheduleTextStyle,
  resolveFontFile,
} = require("./scheduleTextStyle");

// Layout calibrated to the 390×844 reference timeline (non-text geometry)
const LAYOUT = {
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
    // Prefer clean floral art over composite reference (which has baked text)
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
        id,
        couple_names,
        bride_name,
        groom_name,
        wedding_date,
        schedule_image_url,
        schedule_title,
        schedule_venue,
        schedule_style_json
      FROM weddings
      WHERE id = ?
      LIMIT 1;
      `,
      { replacements: [weddingId] }
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

  const events = eventRows.map((row) => ({
    startTime: row.event_time ? String(row.event_time).slice(0, 5) : "",
    title: row.title || "",
    note: row.special_notes || row.location || "",
  }));

  return {
    coupleNames:
      formatDisplayCoupleNames({
        brideName: wedding.bride_name,
        groomName: wedding.groom_name,
        coupleNames: wedding.couple_names,
      }) || wedding.couple_names,
    weddingDateLabel: formatFooterDate(wedding.wedding_date),
    title: (wedding.schedule_title || "WEDDING TIMELINE").toUpperCase(),
    venue: (
      wedding.schedule_venue ||
      inviteRows[0]?.hotel_name ||
      ""
    ).toUpperCase(),
    backgroundPath: resolveBackgroundPath(wedding.schedule_image_url),
    textStyle: mergeScheduleTextStyle(wedding.schedule_style_json),
    events,
  };
}

function drawPage(doc, context, pageEvents, fonts) {
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
  } = LAYOUT;

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

    // Only wipe text zones when the artwork still has baked-in sample copy
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

  // Header — couple names in Bonheur Royale; second line indented past first
  const nameLines = splitCoupleNameLines(context.coupleNames);
  doc.fillColor(colors.brown).font(fonts.script).fontSize(nameFontSize);

  nameLines.forEach((line, index) => {
    const x =
      index === 0 ? leftMargin : leftMargin + nameSecondLineIndent;
    doc.text(line, x, nameTop + index * nameLineHeight, {
      width: 220,
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
      width: 220,
      align: "left",
      characterSpacing: subtitleTracking,
      lineBreak: false,
    });

  // Even vertical rhythm across up to 13 events (reference spacing)
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
    const timeLabel = formatAmPm(event.startTime);
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
  });

  // Footer — date + venue, normal weight
  doc
    .fillColor(colors.dark)
    .font(fonts.footer)
    .fontSize(footerFontSize)
    .text(context.weddingDateLabel || "", footerLeft, footerY1, {
      width: 260,
      align: "left",
      lineBreak: false,
    });

  if (context.venue) {
    doc
      .fillColor(colors.dark)
      .font(fonts.footer)
      .fontSize(footerFontSize)
      .text(context.venue, footerLeft, footerY2, {
        width: 260,
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

  const pages = chunkEvents(context.events, EVENTS_PER_PAGE);

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

    pages.forEach((pageEvents) => {
      doc.addPage({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: 0 });
      drawPage(doc, context, pageEvents, fonts);
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
