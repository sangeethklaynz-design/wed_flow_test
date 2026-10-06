/**
 * Corporate template-1 layout metrics.
 * Pages are snap sections with min-height 844 that grow when lists expand.
 * Bottom décor stays in flow after content (never overlapped).
 */

export const CORPORATE_BASE_HEIGHT = 844;
export const CORPORATE_PAGE_WIDTH = 390;
export const PAGE_AFTER_DECOR_GAP = 24;

export const CORPORATE_PAGE_ORDER = [
  "rsvp",
  "landing",
  "eventDetails",
  "agenda",
  "location",
  "resources",
  "addToCalendar",
];

/** Agenda timeline */
export const AGENDA_HEADER_H = 90;
export const AGENDA_LIST_TOP_PAD = 20;
export const AGENDA_ITEM_H = 52;
export const AGENDA_ITEM_GAP = 25;
export const AGENDA_QUOTE_H = 56;
export const AGENDA_QUOTE_GAP = 24;
export const AGENDA_DECOR_H = 162;
export const AGENDA_BASE_ITEMS = 8;

/** Resources */
export const RESOURCES_HEADER_H = 200;
export const RESOURCES_CARD_H = 92;
export const RESOURCES_CARD_GAP = 21;
export const RESOURCES_DECOR_H = 162;
export const RESOURCES_DECOR_GAP = 28;
export const RESOURCES_BASE_ITEMS = 4;

/** RSVP */
export const RSVP_HEADER_H = 90;
export const RSVP_FORM_PAD_X = 37;
export const RSVP_LABEL_H = 16;
export const RSVP_LABEL_GAP = 6;
export const RSVP_INPUT_H = 40;
export const RSVP_TEXTAREA_H = 94;
export const RSVP_RADIO_ROW_H = 28;
export const RSVP_FIELD_GAP = 20;
export const RSVP_BUTTON_H = 40;
export const RSVP_BUTTON_GAP = 24;
export const RSVP_BOTTOM_PAD = 28;

const DEFAULT_RSVP_QUESTIONS = [
  { label: "Full name", inputType: "text", options: "" },
  { label: "Email", inputType: "text", options: "" },
  { label: "Phone Number", inputType: "text", options: "" },
  {
    label: "Will you attend?",
    inputType: "radio",
    options: "Yes, I'll attend, Sorry, I can't attend",
  },
  { label: "Number of Guests", inputType: "text", options: "" },
  {
    label: "Meal Preference",
    inputType: "dropdown",
    options: "Vegetarian, Non- Vegetarian",
  },
  {
    label: "Any Special Requirements (Optional)",
    inputType: "textarea",
    options: "",
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

export function estimateRsvpFieldHeight(question) {
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

export function computeAgendaHeight(agendaItems, isRsvpConfirmed = false) {
  const n = Array.isArray(agendaItems)
    ? agendaItems.length
    : AGENDA_BASE_ITEMS;
  const count = Math.max(0, n);
  const listH =
    count === 0
      ? 0
      : count * AGENDA_ITEM_H + Math.max(0, count - 1) * AGENDA_ITEM_GAP;
  const buttonH = isRsvpConfirmed ? 58 : 0;
  const content =
    AGENDA_HEADER_H +
    AGENDA_LIST_TOP_PAD +
    listH +
    buttonH +
    AGENDA_QUOTE_GAP +
    AGENDA_QUOTE_H +
    PAGE_AFTER_DECOR_GAP +
    AGENDA_DECOR_H;
  return Math.max(CORPORATE_BASE_HEIGHT, content);
}

export function computeResourcesHeight(resourcesList) {
  const n = Array.isArray(resourcesList)
    ? resourcesList.length
    : RESOURCES_BASE_ITEMS;
  const count = Math.max(0, n);
  const listH =
    count === 0
      ? 0
      : count * RESOURCES_CARD_H + Math.max(0, count - 1) * RESOURCES_CARD_GAP;
  const content =
    RESOURCES_HEADER_H +
    listH +
    RESOURCES_DECOR_GAP +
    RESOURCES_DECOR_H;
  return Math.max(CORPORATE_BASE_HEIGHT, content);
}

export function computeRsvpHeight(rsvpQuestions) {
  const formH = estimateRsvpFormHeight(rsvpQuestions);
  const content =
    RSVP_HEADER_H + formH + RSVP_BOTTOM_PAD;
  return Math.max(CORPORATE_BASE_HEIGHT, content);
}

export function computeCorporatePageHeight(pageId, fields = {}, isRsvpConfirmed = false) {
  switch (pageId) {
    case "agenda":
      return computeAgendaHeight(fields.agendaItems, isRsvpConfirmed);
    case "resources":
      return computeResourcesHeight(fields.resourcesList);
    case "rsvp":
      return computeRsvpHeight(fields.rsvpQuestions);
    default:
      return CORPORATE_BASE_HEIGHT;
  }
}

/**
 * @returns {{ enabledPages: string[], heights: Record<string, number> }}
 */
export function computeCorporateLayout(pagesCfg = {}, fields = {}) {
  const enabledPages = CORPORATE_PAGE_ORDER.filter(
    (id) => pagesCfg?.[id] !== false
  );
  const heights = {};
  for (const id of CORPORATE_PAGE_ORDER) {
    if (pagesCfg?.[id] === false) {
      heights[id] = 0;
    } else {
      heights[id] = computeCorporatePageHeight(id, fields);
    }
  }
  return { enabledPages, heights };
}

export { DEFAULT_RSVP_QUESTIONS };
