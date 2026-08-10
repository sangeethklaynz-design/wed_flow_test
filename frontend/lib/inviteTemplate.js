/**
 * Normalizes invitation-template API payloads for InvitationPage.
 *
 * Connected APIs:
 * - GET /api/couple/invitation-template        (couple preview — static only)
 * - GET /api/public/invite/:token/invitation-template (guest — static + guest)
 */

const DEFAULTS = {
  groomName: "Kasun",
  brideName: "Hiruni",
  coupleNames: "Kasun & Hiruni",
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
  maxGuests: 1,
  contacts: [
    { name: "Hiruni", phone: "077 123 4567" },
    { name: "Kasun", phone: "071 987 4561" },
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

  return {
    groomName,
    brideName,
    coupleNames: wedding.coupleNames || `${groomName} & ${brideName}`,
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
    weatherNote: invitation?.weatherNote || DEFAULTS.weatherNote,
    parkingNote: invitation?.parkingNote || DEFAULTS.parkingNote,
    thankYouNote: invitation?.thankYouNote || null,
    tableNumber: guest?.tableNumber
      ? `Table ${guest.tableNumber}`
      : DEFAULTS.tableNumber,
    maxGuests: guest?.maxGuests || 1,
    contacts: contacts.length
      ? contacts.map((c) => ({ name: c.name, phone: c.phone }))
      : DEFAULTS.contacts,
    hasGuest: Boolean(guest),
    rsvp: guest?.rsvp || null,
    video: staticBlock.video || raw.video || null,
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
