/**
 * Normalizes invitation-template API payloads for InvitationPage.
 *
 * Connected APIs:
 * - GET /api/couple/invitation-template        (couple preview — static only)
 * - GET /api/public/invite/:token/invitation-template (guest — static + guest)
 */

const DEFAULTS = {
  groomName: "Groom",
  brideName: "Bride",
  coupleNames: "Bride & Groom",
  formattedDate: "22 . 07 . 2026",
  weekday: "WEDNESDAY",
  longDate: "22 JULY 2026",
  invitationNoteLine1: "You & Your Family",
  invitationNoteLine2: "Invited",
  specialText:
    "With joyful hearts,\nwe warmly invite you and your family\nto witness the beginning of our forever\nand celebrate this unforgettable day\nsurrounded by love, laughter,\nand those who mean the most.",
  poruwaTime: "8.20 AM",
  hotelName: "GRANBELL HOTEL",
  googleMapsLink: null,
  weatherNote: "Outdoor ceremony",
  parkingNote: "Complimentary valet available",
  thankYouNote: null,
  tableNumber: "Table 12",
  ceremonySetting: "Outdoor ceremony",
  maxGuests: 1,
  contacts: [
    { name: "Bride", phone: "000 000 0000" },
    { name: "Groom", phone: "000 000 0000" },
  ],
  images: [],
};

function formatPoruwaDisplay(time24) {
  if (!time24) return DEFAULTS.poruwaTime;
  const [hStr, mStr] = String(time24).slice(0, 5).split(":");
  let hours = Number(hStr);
  const minutes = mStr || "00";
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}.${minutes} ${period}`;
}

function formatLongDateParts(weddingDate) {
  if (!weddingDate) {
    return { weekday: DEFAULTS.weekday, longDate: DEFAULTS.longDate };
  }
  const d = new Date(`${weddingDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) {
    return { weekday: DEFAULTS.weekday, longDate: DEFAULTS.longDate };
  }
  const weekday = d
    .toLocaleDateString("en-GB", { weekday: "long" })
    .toUpperCase();
  const longDate = d
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
  return { weekday, longDate };
}

/** Accept `{ static, guest }` or legacy flat invite payload */
export function normalizeInvitationTemplate(raw) {
  if (!raw) return { ...DEFAULTS, hasGuest: false, rsvp: null };

  const staticBlock = raw.static || raw;
  const guest = raw.guest || null;
  const wedding = staticBlock.wedding || {};
  const invitation = staticBlock.invitation || raw.invitation || null;
  const contacts = staticBlock.contacts || raw.contacts || [];
  const images = (staticBlock.images || raw.images || []).map((img) => ({
    id: img.id,
    url: img.url,
    caption: img.caption || null,
    displayOrder: img.displayOrder,
    fileName: img.fileName || null,
  }));

  const groomName =
    wedding.groomName ||
    wedding.coupleNames?.split("&")[0]?.trim() ||
    DEFAULTS.groomName;
  const brideName =
    wedding.brideName ||
    wedding.coupleNames?.split("&")[1]?.trim() ||
    DEFAULTS.brideName;

  const { weekday, longDate } = formatLongDateParts(wedding.weddingDate);

  // Per-guest invitation note (e.g. "You & Your Family") + "Invited".
  // Couple template preview has no guest — show dotted placeholders instead.
  let invitationNoteLine1;
  let invitationNoteLine2;
  if (guest) {
    invitationNoteLine1 =
      guest.invitationNote?.trim() || DEFAULTS.invitationNoteLine1;
    invitationNoteLine2 = DEFAULTS.invitationNoteLine2;
  } else {
    invitationNoteLine1 = "........";
    invitationNoteLine2 = "........";
  }

  // Invitation display order: bride first, then groom
  const displayCoupleNames =
    brideName && groomName
      ? `${brideName} & ${groomName}`
      : wedding.coupleNames || `${groomName} & ${brideName}`;

  const weatherNote = invitation?.weatherNote || DEFAULTS.weatherNote;
  const weatherLower = String(weatherNote).toLowerCase();
  let ceremonySetting = DEFAULTS.ceremonySetting;
  if (/\bindoor\b/.test(weatherLower)) {
    ceremonySetting = "Indoor ceremony";
  } else if (/\boutdoor\b/.test(weatherLower)) {
    ceremonySetting = "Outdoor ceremony";
  }

  return {
    groomName,
    brideName,
    coupleNames: displayCoupleNames,
    formattedDate: wedding.formattedDate || DEFAULTS.formattedDate,
    weekday,
    longDate,
    invitationNoteLine1,
    invitationNoteLine2,
    specialText: invitation?.specialText || DEFAULTS.specialText,
    poruwaTime: formatPoruwaDisplay(invitation?.poruwaTime),
    hotelName: (invitation?.hotelName || DEFAULTS.hotelName).toUpperCase(),
    hotelAddress: invitation?.hotelAddress || null,
    googleMapsLink: invitation?.googleMapsLink || null,
    weatherNote,
    parkingNote: invitation?.parkingNote || DEFAULTS.parkingNote,
    thankYouNote: invitation?.thankYouNote || null,
    tableNumber: guest?.tableNumber
      ? `Table ${guest.tableNumber}`
      : DEFAULTS.tableNumber,
    ceremonySetting,
    maxGuests: guest?.maxGuests || 1,
    contacts: contacts.length
      ? contacts.map((c) => ({ name: c.name, phone: c.phone }))
      : DEFAULTS.contacts,
    hasGuest: Boolean(guest),
    rsvp: guest?.rsvp || null,
    video: staticBlock.video || raw.video || null,
    background: staticBlock.background || raw.background || null,
    /** Our Journey photos from assets/couple_images (via API) */
    images,
  };
}

export function splitSpecialText(text) {
  return String(text || "")
    .replace(/\\n/g, "\n")
    .split(/\n|<br\s*\/?>/i)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Prefer stored Maps URL; otherwise search by hotel name (+ address when available). */
export function buildGoogleMapsUrl({ googleMapsLink, hotelName, hotelAddress } = {}) {
  const stored = String(googleMapsLink || "").trim();
  if (stored) return stored;

  const query = [hotelName, hotelAddress]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");

  if (!query) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Slot from Image_1 / image-2 / img3 style names (1-based).
 * Returns null when the name has no explicit slot.
 */
export function imageSlotFromFileName(fileName) {
  if (!fileName) return null;
  let base = String(fileName).split(/[\\/]/).pop() || "";
  try {
    base = decodeURIComponent(base);
  } catch {
    // keep raw
  }
  base = base.replace(/\.[^.]+$/, "");
  const match = base.match(/^(?:image|img)[_\s-]*(\d+)$/i);
  if (!match) return null;
  const slot = Number(match[1]);
  return Number.isInteger(slot) && slot >= 1 ? slot : null;
}

/**
 * Build Our Journey URLs for N fixed containers.
 * Filename wins: Image_1 → container 1, Image_2 → container 2, etc.
 * displayOrder is only a fallback when the filename has no slot number.
 */
export function mapJourneyImagesBySlot(images, fallbacks = []) {
  const slotCount = fallbacks.length;
  const slots = fallbacks.slice();
  const list = Array.isArray(images) ? images : [];
  const claimed = new Set();

  const resolveSlot = (img) => {
    const fromName =
      imageSlotFromFileName(img?.fileName) ||
      imageSlotFromFileName(String(img?.url || "").split("?")[0]);
    if (fromName != null) return fromName;
    const fromOrder = Number(img?.displayOrder);
    if (Number.isInteger(fromOrder) && fromOrder >= 1) return fromOrder;
    return null;
  };

  // Pass 1: explicit Image_N / displayOrder → fixed containers
  for (const img of list) {
    const slot = resolveSlot(img);
    if (slot == null || slot < 1 || slot > slotCount) continue;
    if (claimed.has(slot)) continue;
    const url = img?.url;
    if (!url) continue;
    slots[slot - 1] = url;
    claimed.add(slot);
  }

  // Pass 2: unnumbered leftovers fill remaining containers in API order
  let next = 1;
  for (const img of list) {
    if (resolveSlot(img) != null) continue;
    const url = img?.url;
    if (!url) continue;
    while (next <= slotCount && claimed.has(next)) next += 1;
    if (next > slotCount) break;
    slots[next - 1] = url;
    claimed.add(next);
    next += 1;
  }

  return slots;
}
