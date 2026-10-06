/**
 * Shared invitation canvas layout metrics for template-1.
 *
 * Standard page rule (all template pages):
 * - Top bound = page title / top decoration
 * - Bottom bound = bottom resource decoration (hard border)
 * - Dynamic items expand in the space between; extra items push the
 *   bottom decoration down and grow the page / shift later pages
 * - Buttons and content stay ABOVE the bottom decoration (never overlap it)
 */

export const INVITE_CANVAS_HEIGHT = 7100;
/** Space removed when Our Story is disabled (title 3460 → Big Day 4390). */
export const OUR_STORY_PAGE_HEIGHT = 930;
export const DETAIL_NODE_STEP = 102;
export const JOURNEY_EXTRA_STEP = 170;
export const BASE_DETAIL_COUNT = 4;
export const BASE_JOURNEY_COUNT = 4;
export const BASE_STORY_COUNT = 4;
export const STORY_ITEM_STEP = 90;

/** Landing (couple names) — bottom flower ends at Y 875. */
export const LANDING_DECOR_BOTTOM = 875;
/** Opening invitation letter — card header → gold divider. */
export const OPENING_PAGE_TOP = 867;
export const OPENING_DECOR_BOTTOM = 1658; // gold divider 1625 + 33

/** Absolute anchors (template-1 design). */
export const OUR_STORY_TOP = 3460;
export const OUR_STORY_DECOR_BOTTOM = 4303;
export const OUR_STORY_FLORAL_TOP = 3861;
export const OUR_STORY_FLORAL_HEIGHT = 442;
export const OUR_STORY_ITEMS_TOP = 3810;
export const BIG_DAY_TOP = 4390;
export const OUR_STORY_BAND_HEIGHT = OUR_STORY_DECOR_BOTTOM - OUR_STORY_TOP;

/** RSVP */
export const RSVP_PAGE_TOP = 1719;
export const RSVP_FORM_TOP = 2010;
export const RSVP_DECOR_TOP = 2254;
export const RSVP_DECOR_HEIGHT = 287;
export const RSVP_DECOR_BOTTOM = RSVP_DECOR_TOP + RSVP_DECOR_HEIGHT; // 2541
export const RSVP_PAGE_END = 2609; // allDetails starts here
export const RSVP_BUTTON_H = 48;
export const RSVP_GAP_AFTER_FIELDS = 18;
export const RSVP_GAP_BEFORE_DECOR = 24;

/** @deprecated button is in-flow above decor; kept for callers */
export const RSVP_BUTTON_TOP = 2379;

/** All the details */
export const DETAILS_PAGE_TOP = RSVP_PAGE_END;
export const DETAILS_ITEMS_TOP = 2811;
export const DETAILS_CONTACT_H = 60;
export const DETAILS_GAP = 16;
export const DETAILS_DECOR_HEIGHT = 287;
export const DETAILS_ITEM_H = 60;

/** Big Day floral bottom (4691 + 523) */
export const BIG_DAY_DECOR_BOTTOM = 5214;
/** Journey floral base top / height */
export const JOURNEY_PAGE_TOP = 5280;
export const JOURNEY_DECOR_TOP = 5913;
export const JOURNEY_DECOR_HEIGHT = 287;
export const JOURNEY_DECOR_BOTTOM = JOURNEY_DECOR_TOP + JOURNEY_DECOR_HEIGHT; // 6200
export const CLOSING_PAGE_TOP = 6220;
export const CLOSING_DECOR_BOTTOM = 7020;
export const FOOTER_HEIGHT = 80;

/**
 * Standard space between a page's closing decoration and the next page title.
 * Keeps strict page boundaries when earlier pages grow.
 */
export const PAGE_AFTER_DECOR_GAP = 80;

/** Design Y of each page start (template-1 absolute layout). */
export const PAGE_DESIGN_TOP = {
  starting: 0,
  opening: OPENING_PAGE_TOP,
  rsvp: RSVP_PAGE_TOP,
  allDetails: DETAILS_PAGE_TOP,
  ourStory: OUR_STORY_TOP,
  bigDay: BIG_DAY_TOP,
  journey: JOURNEY_PAGE_TOP,
  closing: CLOSING_PAGE_TOP,
};

export const PAGE_ORDER = [
  "rsvp",
  "starting",
  "opening",
  "allDetails",
  "ourStory",
  "bigDay",
  "journey",
  "closing",
];

const RSVP_LABEL_H = 24;
const RSVP_INPUT_H = 36;
const RSVP_TEXTAREA_H = 126;
const RSVP_FIELD_GAP = 18;

export function isRsvpTextContainerField(question) {
  const inputType = String(question?.inputType || "text").toLowerCase();
  return (
    inputType === "textarea" ||
    inputType === "text_container" ||
    inputType === "textcontainer"
  );
}

/** @deprecated Use isRsvpTextContainerField */
export function isRsvpWishesField(question, qIndex, total) {
  void qIndex;
  void total;
  return isRsvpTextContainerField(question);
}

/** Height of RSVP question fields only (no button). */
export function estimateRsvpFieldsHeight(questions) {
  const list = Array.isArray(questions) ? questions : [];
  if (!list.length) return 0;
  let total = 0;
  list.forEach((question) => {
    const controlH = isRsvpTextContainerField(question)
      ? RSVP_TEXTAREA_H
      : RSVP_INPUT_H;
    total += RSVP_LABEL_H + controlH + RSVP_FIELD_GAP;
  });
  return total;
}

/** @deprecated alias */
export function estimateRsvpFormHeight(questions) {
  return estimateRsvpFieldsHeight(questions);
}

/**
 * Content stack above RSVP bottom floral: fields + Send button.
 */
export function estimateRsvpContentHeight(questions, { includeButton = true } = {}) {
  const fieldsH = estimateRsvpFieldsHeight(questions);
  if (!includeButton) return fieldsH;
  return fieldsH + RSVP_GAP_AFTER_FIELDS + RSVP_BUTTON_H;
}

/**
 * All-details: items stack from DETAILS_ITEMS_TOP; floral is hard bottom border.
 * Contact is a normal list item when present (no extra reserved row).
 * @returns {{ contactTop: number, floralTop: number, floralBottom: number, contentBottom: number }}
 */
export function computeDetailsLayout(detailCount) {
  const n = Math.max(0, Number(detailCount) || 0);
  const lastItemTop =
    n > 0 ? DETAILS_ITEMS_TOP + (n - 1) * DETAIL_NODE_STEP : DETAILS_ITEMS_TOP;
  const contentBottom =
    n > 0 ? lastItemTop + DETAILS_ITEM_H : DETAILS_ITEMS_TOP;
  const floralTop = contentBottom + DETAILS_GAP;
  const floralBottom = floralTop + DETAILS_DECOR_HEIGHT;
  return {
    contactTop: lastItemTop,
    floralTop,
    floralBottom,
    contentBottom,
  };
}

/**
 * Base vertical span until the next page (before dynamic growth).
 * Grown pages use content bottom + PAGE_AFTER_DECOR_GAP so the next
 * title never sits against the previous closing decoration.
 */
export const PAGE_BASE_SPAN = {
  starting: LANDING_DECOR_BOTTOM - 0,
  opening: OPENING_DECOR_BOTTOM - OPENING_PAGE_TOP,
  rsvp: DETAILS_PAGE_TOP - RSVP_PAGE_TOP,
  allDetails:
    computeDetailsLayout(BASE_DETAIL_COUNT).floralBottom +
    PAGE_AFTER_DECOR_GAP -
    DETAILS_PAGE_TOP,
  ourStory: BIG_DAY_TOP - OUR_STORY_TOP,
  bigDay: JOURNEY_PAGE_TOP - BIG_DAY_TOP,
  journey: CLOSING_PAGE_TOP - JOURNEY_PAGE_TOP,
  closing: INVITE_CANVAS_HEIGHT - CLOSING_PAGE_TOP,
};

/**
 * Page span must cover the hard bottom decoration + standard title gap.
 */
function spanCoveringBottom(designTop, contentBottom, minSpan) {
  return Math.max(
    minSpan,
    contentBottom + PAGE_AFTER_DECOR_GAP - designTop
  );
}

export function computeInviteLayoutMetrics(opts = {}) {
  const pages = opts.pages || {};
  const fields = opts.fields || {};
  const showStarting = pages.starting !== false;
  const showOpening = pages.opening !== false;
  const showRsvp = pages.rsvp !== false;
  const showOurStory = pages.ourStory !== false;
  const showAllDetails = pages.allDetails !== false;
  const showBigDay = pages.bigDay !== false;
  const showJourney = pages.journey !== false;
  const showClosing = pages.closing !== false;

  const rsvpQuestions = Array.isArray(opts.rsvpQuestions)
    ? opts.rsvpQuestions
    : Array.isArray(fields.rsvpQuestions)
      ? fields.rsvpQuestions
      : [];
  const detailNodes = Array.isArray(opts.detailNodes)
    ? opts.detailNodes
    : Array.isArray(fields.detailNodes)
      ? fields.detailNodes
      : [];
  const storyMilestones = Array.isArray(opts.storyMilestones)
    ? opts.storyMilestones
    : Array.isArray(fields.storyMilestones)
      ? fields.storyMilestones
      : [];
  const journeyCount = (() => {
    if (Array.isArray(opts.journeyImages)) return opts.journeyImages.length;
    if (Array.isArray(fields.journeyImages)) return fields.journeyImages.length;
    return Math.max(
      1,
      Number(
        opts.journeyImageCount !== undefined
          ? opts.journeyImageCount
          : fields.journeyImageCount
      ) || BASE_JOURNEY_COUNT
    );
  })();

  const fieldsHeight = showRsvp ? estimateRsvpFieldsHeight(rsvpQuestions) : 0;
  const contentHeight = showRsvp
    ? estimateRsvpContentHeight(rsvpQuestions, { includeButton: true })
    : 0;
  const decorTop = showRsvp
    ? Math.max(
        RSVP_DECOR_TOP,
        RSVP_FORM_TOP + contentHeight + RSVP_GAP_BEFORE_DECOR
      )
    : RSVP_DECOR_TOP;
  const rsvpGrowth = showRsvp ? decorTop - RSVP_DECOR_TOP : 0;
  const buttonTop = decorTop - RSVP_GAP_BEFORE_DECOR - RSVP_BUTTON_H;

  const detailCount = showAllDetails ? detailNodes.length : BASE_DETAIL_COUNT;
  const detailsLayout = computeDetailsLayout(
    showAllDetails ? detailCount : BASE_DETAIL_COUNT
  );
  const baseDetailsLayout = computeDetailsLayout(BASE_DETAIL_COUNT);
  const detailsGrowth = showAllDetails
    ? Math.max(0, detailsLayout.floralBottom - baseDetailsLayout.floralBottom)
    : 0;

  const storyCount = showOurStory ? storyMilestones.length : 0;
  const storyGrowth = showOurStory
    ? Math.max(0, storyCount - BASE_STORY_COUNT) * STORY_ITEM_STEP
    : 0;
  const journeyGrowth = showJourney
    ? Math.max(0, journeyCount - BASE_JOURNEY_COUNT) * JOURNEY_EXTRA_STEP
    : 0;

  const rsvpBottom = decorTop + RSVP_DECOR_HEIGHT;
  const storyBottom =
    OUR_STORY_FLORAL_TOP + storyGrowth + OUR_STORY_FLORAL_HEIGHT;
  const journeyBottom =
    JOURNEY_DECOR_TOP + journeyGrowth + JOURNEY_DECOR_HEIGHT;

  // Spans cover actual grown content bottoms so later pages pack below
  // decorations instead of sitting under overflowing items.
  const spans = {
    starting: showStarting ? PAGE_BASE_SPAN.starting : 0,
    opening: showOpening ? PAGE_BASE_SPAN.opening : 0,
    rsvp: showRsvp
      ? spanCoveringBottom(RSVP_PAGE_TOP, rsvpBottom, PAGE_BASE_SPAN.rsvp)
      : 0,
    allDetails: showAllDetails
      ? spanCoveringBottom(
          DETAILS_PAGE_TOP,
          detailsLayout.floralBottom,
          PAGE_BASE_SPAN.allDetails
        )
      : 0,
    ourStory: showOurStory
      ? spanCoveringBottom(OUR_STORY_TOP, storyBottom, PAGE_BASE_SPAN.ourStory)
      : 0,
    bigDay: showBigDay ? PAGE_BASE_SPAN.bigDay : 0,
    journey: showJourney
      ? spanCoveringBottom(
          JOURNEY_PAGE_TOP,
          journeyBottom,
          PAGE_BASE_SPAN.journey
        )
      : 0,
    closing: showClosing ? PAGE_BASE_SPAN.closing : 0,
  };

  const targetTop = {};
  let y = 0;
  for (const id of PAGE_ORDER) {
    targetTop[id] = y;
    y += spans[id];
  }

  const pageShift = {};
  for (const id of PAGE_ORDER) {
    pageShift[id] = targetTop[id] - PAGE_DESIGN_TOP[id];
  }

  // Legacy aliases used by older shift wrappers / resolvePageBand.
  const storyShift = showOurStory ? 0 : PAGE_BASE_SPAN.ourStory;
  const afterDetailsShift = detailsGrowth;
  const laterPagesShift = detailsGrowth + storyGrowth - storyShift;

  const canvasHeight = Math.max(
    showClosing ? y : y + FOOTER_HEIGHT,
    FOOTER_HEIGHT
  );

  return {
    formHeight: fieldsHeight,
    contentHeight,
    decorTop,
    buttonTop,
    rsvpGrowth,
    detailsGrowth,
    detailsLayout,
    storyGrowth,
    storyCount,
    journeyGrowth,
    storyShift,
    afterDetailsShift,
    laterPagesShift,
    journeyCount,
    spans,
    targetTop,
    pageShift,
    canvasHeight,
    show: {
      starting: showStarting,
      opening: showOpening,
      rsvp: showRsvp,
      allDetails: showAllDetails,
      ourStory: showOurStory,
      bigDay: showBigDay,
      journey: showJourney,
      closing: showClosing,
    },
  };
}

/** Base page bands — bottom edge flush with decoration bottom (before growth). */
export const PAGE_BANDS = {
  starting: { top: 0, height: LANDING_DECOR_BOTTOM },
  opening: {
    top: OPENING_PAGE_TOP,
    height: OPENING_DECOR_BOTTOM - OPENING_PAGE_TOP,
  },
  rsvp: {
    top: RSVP_PAGE_TOP,
    height: RSVP_DECOR_BOTTOM - RSVP_PAGE_TOP,
  },
  allDetails: {
    top: DETAILS_PAGE_TOP,
    height: computeDetailsLayout(BASE_DETAIL_COUNT).floralBottom - DETAILS_PAGE_TOP,
  },
  ourStory: { top: OUR_STORY_TOP, height: OUR_STORY_BAND_HEIGHT },
  bigDay: {
    top: BIG_DAY_TOP,
    height: BIG_DAY_DECOR_BOTTOM - BIG_DAY_TOP,
  },
  journey: {
    top: JOURNEY_PAGE_TOP,
    height: JOURNEY_DECOR_BOTTOM - JOURNEY_PAGE_TOP,
  },
  closing: {
    top: CLOSING_PAGE_TOP,
    height: CLOSING_DECOR_BOTTOM - CLOSING_PAGE_TOP,
  },
};

export function resolvePageBand(pageId, config) {
  const base = PAGE_BANDS[pageId] || PAGE_BANDS.starting;
  const m = computeInviteLayoutMetrics({
    pages: config?.pages,
    fields: config?.fields,
  });

  const shift = m.pageShift?.[pageId] || 0;
  const span = m.spans?.[pageId];

  if (span === 0) {
    return { top: PAGE_DESIGN_TOP[pageId] ?? base.top, height: 0 };
  }

  if (pageId === "starting") {
    return { top: shift, height: span || base.height };
  }
  if (pageId === "opening") {
    return {
      top: PAGE_DESIGN_TOP.opening + shift,
      height: span || base.height,
    };
  }
  if (pageId === "rsvp") {
    return {
      top: PAGE_DESIGN_TOP.rsvp + shift,
      height: span || base.height + m.rsvpGrowth,
    };
  }
  if (pageId === "allDetails") {
    return {
      top: PAGE_DESIGN_TOP.allDetails + shift,
      height: span || base.height + m.detailsGrowth,
    };
  }
  if (pageId === "ourStory") {
    return {
      top: PAGE_DESIGN_TOP.ourStory + shift,
      height: span || base.height + m.storyGrowth,
    };
  }
  if (pageId === "bigDay") {
    return {
      top: PAGE_DESIGN_TOP.bigDay + shift,
      height: span || base.height,
    };
  }
  if (pageId === "journey") {
    return {
      top: PAGE_DESIGN_TOP.journey + shift,
      height: span || base.height + m.journeyGrowth,
    };
  }
  if (pageId === "closing") {
    return {
      top: PAGE_DESIGN_TOP.closing + shift,
      height: span || base.height,
    };
  }
  return { ...base };
}
