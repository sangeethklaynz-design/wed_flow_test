/**
 * Party template-1 layout metrics.
 * Pages are snap sections with min-height 844 that grow when lists expand.
 * Bottom décor stays in flow after content (never overlapped).
 */

export const PARTY_BASE_HEIGHT = 844;
export const PARTY_PAGE_WIDTH = 390;
export const PAGE_AFTER_DECOR_GAP = 96;

export const PARTY_PAGE_ORDER = [
  "landing",
  "about",
  "rsvp",
  "schedule",
  "location",
  "details",
  "saveTheDate",
];

/** Schedule timeline */
export const SCHEDULE_HEADER_H = 184;
export const SCHEDULE_ITEM_H = 52;
export const SCHEDULE_ITEM_GAP = 18;
export const SCHEDULE_DECOR_H = 320;
export const SCHEDULE_BASE_ITEMS = 6;

/** Important details */
export const DETAILS_HEADER_H = 198;
export const DETAILS_ROW_H = 52;
export const DETAILS_ROW_GAP = 27;
export const DETAILS_DECOR_H = 220;
export const DETAILS_BASE_ITEMS = 6;

/** About features */
export const ABOUT_HEADER_H = 360;
export const ABOUT_FEATURE_H = 70;
export const ABOUT_FEATURE_GAP = 28;
export const ABOUT_DECOR_H = 220;
export const ABOUT_BASE_FEATURES = 3;

/** Save the date */
export const SAVE_DATE_HEADER_H = 320;
export const SAVE_DATE_BTN_H = 58;
export const SAVE_DATE_BTN_GAP = 13;
export const SAVE_DATE_DECOR_H = 320;
export const SAVE_DATE_BASE_LINKS = 3;

/** RSVP */
export const RSVP_HEADER_H = 200;
export const RSVP_LABEL_H = 14;
export const RSVP_LABEL_GAP = 6;
export const RSVP_INPUT_H = 34;
export const RSVP_TEXTAREA_H = 64;
export const RSVP_RADIO_ROW_H = 28;
export const RSVP_FIELD_GAP = 16;
export const RSVP_BUTTON_H = 42;
export const RSVP_BUTTON_GAP = 20;
export const RSVP_BOTTOM_PAD = 28;

const DEFAULT_RSVP_QUESTIONS = [
  { label: "Full name", inputType: "text", options: "" },
  { label: "Email", inputType: "text", options: "" },
  { label: "Phone Number", inputType: "text", options: "" },
  {
    label: "Will you attend?",
    inputType: "radio",
    options: "Yes I'll attend, Sorry I can't attend",
  },
  { label: "Number of Guests", inputType: "text", options: "" },
  {
    label: "Meal Preference",
    inputType: "dropdown",
    options: "Vegetarian, Non-Vegetarian",
  },
  {
    label: "Any Special Requirements (Optional)",
    inputType: "textarea",
    options: "",
  },
];

const DEFAULT_SCHEDULE_ITEMS = [
  { time: "06:00 PM", title: "Guest Arrival & Welcome Drinks", icon: "drink" },
  { time: "06:30 PM", title: "Opening & Welcome", icon: "mic" },
  { time: "07:00 PM", title: "Dinner Service", icon: "food" },
  { time: "08:30 PM", title: "Live Music & Entertainment", icon: "music" },
  { time: "09:30 PM", title: "Games & Activities", icon: "celebrate" },
  { time: "10:30 PM", title: "DJ Night & Dance", icon: "dj" },
];

const DEFAULT_DETAIL_ITEMS = [
  { title: "Parking", body: "Available at venue", kind: "text", icon: "parking" },
  { title: "Dress Code", body: "Smart Casual", kind: "text", icon: "dress" },
  { title: "Table Number", body: "No 05", kind: "text", icon: "table" },
  {
    title: "Photos",
    body: "Professional photography\nwill be taken",
    kind: "text",
    icon: "cam",
  },
  {
    title: "Contact",
    body: "+94 77 123 4567\n+94 71 789 4512",
    kind: "phone",
    icon: "contact",
  },
  {
    title: "For Any Questions",
    body: "Get in touch with us\n(galanight@gmail.com)",
    kind: "email",
    icon: "info",
  },
];

const DEFAULT_CALENDAR_LINKS = [
  { provider: "google", label: "Google Calendar", url: "" },
  { provider: "apple", label: "Apple Calendar", url: "" },
  { provider: "outlook", label: "Outlook", url: "" },
];

const DEFAULT_ABOUT_FEATURES = [
  {
    title: "Network",
    description: "Meet & connect with great people",
    icon: "group",
  },
  {
    title: "Celebrate",
    description: "Enjoy food, music and entertainment",
    icon: "celebrate",
  },
  {
    title: "Create Memories",
    description: "Be part of a special evening together",
    icon: "cam",
  },
];

export function parseOptionList(raw) {
  if (Array.isArray(raw)) {
    return raw.map((o) => String(o ?? "").trim()).filter(Boolean);
  }
  if (raw == null || raw === "") return [];
  return String(raw)
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function estimateRsvpFieldHeight(question) {
  const type = String(question?.inputType || "text").toLowerCase();
  if (type === "textarea" || type === "text_container" || type === "textcontainer") {
    return RSVP_LABEL_H + RSVP_LABEL_GAP + RSVP_TEXTAREA_H;
  }
  if (type === "radio") {
    const opts = parseOptionList(question?.options);
    const rows = Math.max(1, opts.length || 2);
    return RSVP_LABEL_H + RSVP_LABEL_GAP + rows * RSVP_RADIO_ROW_H + 8;
  }
  return RSVP_LABEL_H + RSVP_LABEL_GAP + RSVP_INPUT_H;
}

export function estimateRsvpFormHeight(questions) {
  const list =
    Array.isArray(questions) && questions.length
      ? questions
      : DEFAULT_RSVP_QUESTIONS;
  let total = 0;
  list.forEach((q, i) => {
    total += estimateRsvpFieldHeight(q);
    if (i < list.length - 1) total += RSVP_FIELD_GAP;
  });
  return total + RSVP_BUTTON_GAP + RSVP_BUTTON_H;
}

export function computeScheduleHeight(scheduleItems) {
  const items =
    Array.isArray(scheduleItems) && scheduleItems.length
      ? scheduleItems
      : DEFAULT_SCHEDULE_ITEMS;
  const count = items.length;
  const listH =
    count === 0
      ? 0
      : count * SCHEDULE_ITEM_H + Math.max(0, count - 1) * SCHEDULE_ITEM_GAP;
  const content =
    SCHEDULE_HEADER_H +
    listH +
    64 +
    PAGE_AFTER_DECOR_GAP +
    SCHEDULE_DECOR_H;
  return Math.max(PARTY_BASE_HEIGHT, content);
}

export function computeDetailsHeight(detailItems) {
  const items =
    Array.isArray(detailItems) && detailItems.length
      ? detailItems
      : DEFAULT_DETAIL_ITEMS;
  const count = items.length;
  const listH =
    count === 0
      ? 0
      : count * DETAILS_ROW_H + Math.max(0, count - 1) * DETAILS_ROW_GAP;
  const content =
    DETAILS_HEADER_H + listH + PAGE_AFTER_DECOR_GAP + DETAILS_DECOR_H;
  return Math.max(PARTY_BASE_HEIGHT, content);
}

export function computeAboutHeight(aboutFeatures) {
  const items =
    Array.isArray(aboutFeatures) && aboutFeatures.length
      ? aboutFeatures
      : DEFAULT_ABOUT_FEATURES;
  const count = items.length;
  const listH =
    count === 0
      ? 0
      : count * ABOUT_FEATURE_H + Math.max(0, count - 1) * ABOUT_FEATURE_GAP;
  const content =
    ABOUT_HEADER_H + listH + PAGE_AFTER_DECOR_GAP + ABOUT_DECOR_H;
  return Math.max(PARTY_BASE_HEIGHT, content);
}

export function computeSaveTheDateHeight(calendarLinks) {
  const items =
    Array.isArray(calendarLinks) && calendarLinks.length
      ? calendarLinks
      : DEFAULT_CALENDAR_LINKS;
  const count = items.length;
  const listH =
    count === 0
      ? 0
      : count * SAVE_DATE_BTN_H + Math.max(0, count - 1) * SAVE_DATE_BTN_GAP;
  const content =
    SAVE_DATE_HEADER_H + listH + PAGE_AFTER_DECOR_GAP + SAVE_DATE_DECOR_H;
  return Math.max(PARTY_BASE_HEIGHT, content);
}

export function computeRsvpHeight(rsvpQuestions) {
  const formH = estimateRsvpFormHeight(rsvpQuestions);
  return Math.max(PARTY_BASE_HEIGHT, RSVP_HEADER_H + formH + RSVP_BOTTOM_PAD);
}

export function computePartyPageHeight(pageId, fields = {}) {
  switch (pageId) {
    case "schedule":
      return computeScheduleHeight(fields.scheduleItems);
    case "details":
      return computeDetailsHeight(fields.detailItems);
    case "about":
      return computeAboutHeight(fields.aboutFeatures);
    case "rsvp":
      return computeRsvpHeight(fields.rsvpQuestions);
    case "saveTheDate":
      return computeSaveTheDateHeight(fields.calendarLinks);
    default:
      return PARTY_BASE_HEIGHT;
  }
}

export function computePartyLayout(pagesCfg = {}, fields = {}) {
  const enabledPages = PARTY_PAGE_ORDER.filter(
    (id) => pagesCfg?.[id] !== false
  );
  const heights = {};
  for (const id of PARTY_PAGE_ORDER) {
    heights[id] =
      pagesCfg?.[id] === false ? 0 : computePartyPageHeight(id, fields);
  }
  return { enabledPages, heights };
}

export {
  DEFAULT_RSVP_QUESTIONS,
  DEFAULT_SCHEDULE_ITEMS,
  DEFAULT_DETAIL_ITEMS,
  DEFAULT_ABOUT_FEATURES,
  DEFAULT_CALENDAR_LINKS,
};
