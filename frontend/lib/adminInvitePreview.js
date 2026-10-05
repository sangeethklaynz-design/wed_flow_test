/**
 * Build an invitation-template shaped payload from admin event + draft template config.
 * Used by the Template modal live preview and admin guest-preview tab.
 */

function formatWeddingDateParts(eventDate) {
  if (!eventDate) {
    return {
      formattedDate: "22 . 07 . 2026",
      weekday: "WEDNESDAY",
      longDate: "22 JULY 2026",
    };
  }
  const d = new Date(`${String(eventDate).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) {
    return {
      formattedDate: String(eventDate),
      weekday: "",
      longDate: String(eventDate),
    };
  }
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return {
    formattedDate: `${day} . ${month} . ${year}`,
    weekday: d
      .toLocaleDateString("en-GB", { weekday: "long" })
      .toUpperCase(),
    longDate: d
      .toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      .toUpperCase(),
  };
}

function splitCoupleNames(eventName) {
  const raw = String(eventName || "").trim();
  if (!raw) return { brideName: "Bride", groomName: "Groom", coupleNames: "Bride & Groom" };
  const parts = raw.split(/\s*&\s*|\s+and\s+/i).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      brideName: parts[0],
      groomName: parts[1],
      coupleNames: `${parts[0]} & ${parts[1]}`,
    };
  }
  return { brideName: raw, groomName: "Partner", coupleNames: raw };
}

function findFile(list, filename) {
  if (!Array.isArray(list) || !list.length) return null;
  if (!filename) return list[0];
  return list.find((f) => f.filename === filename) || list[0];
}

/** Default schedule when the event has no schedule events configured. */
export function buildAdminPreviewScheduleEvents(event) {
  const location = event?.location || "Venue";
  if (Array.isArray(event?.scheduleEvents) && event.scheduleEvents.length) {
    return event.scheduleEvents;
  }
  return [
    {
      id: "preview-ceremony",
      title: "Ceremony",
      startTime: "16:00",
      endTime: "17:00",
      location,
    },
    {
      id: "preview-reception",
      title: "Reception",
      startTime: "18:00",
      endTime: "22:00",
      location,
    },
  ];
}

/** Dummy guest so salutation / RSVP match a real invite (no DB). */
export function buildAdminDummyGuest(event = {}) {
  const { brideName } = splitCoupleNames(event?.name);
  return {
    id: "admin-preview-guest",
    fullName: "Alex Guest",
    invitationNote: "you and your family",
    maxGuests: 2,
    rsvp: {
      hasSubmitted: false,
      attendingStatus: null,
      attendingCount: null,
      wishes: null,
    },
    coupleFirstName: brideName,
  };
}

/**
 * @param {object} event - admin event row
 * @param {{ pages?: object, fields?: object }} config - draft template_config
 * @param {object|null} resources - { video, music, images, background } file lists
 */
export function buildAdminInvitePreviewData(event, config = {}, resources = null) {
  const fields = config.fields || {};
  const pages = config.pages || {};
  const { brideName, groomName, coupleNames } = splitCoupleNames(event?.name);
  const dateParts = formatWeddingDateParts(event?.eventDate);

  const videoFile = findFile(resources?.video, fields.openingVideo);
  const musicFile = findFile(resources?.music, fields.backgroundMusic);
  const backgroundFile = findFile(resources?.background, fields.landingBackground);
  const imageFiles = Array.isArray(resources?.images) ? resources.images : [];

  const detailNodes = Array.isArray(fields.detailNodes) ? fields.detailNodes : [];
  const infoNodes = detailNodes.filter(
    (node) => String(node?.kind || "").toLowerCase() !== "contact"
  );
  const contactNode = detailNodes.find(
    (node) => String(node?.kind || "").toLowerCase() === "contact"
  );
  const ceremony = infoNodes[0] || {};
  const weather = infoNodes[1] || {};
  const parking = infoNodes[2] || {};

  const ceremonyValue = String(ceremony.value || ceremony.label || "").trim();
  const weatherValue = String(weather.value || weather.label || "").trim();
  const parkingValue = String(parking.value || parking.label || "").trim();

  const templateContacts = (
    Array.isArray(contactNode?.phones) ? contactNode.phones : []
  )
    .map((row) => ({
      name: String(row?.name || "").trim(),
      phone: String(row?.phone || "").trim(),
    }))
    .filter((row) => row.name || row.phone)
    .slice(0, 2);

  const scheduleEvents = buildAdminPreviewScheduleEvents(event);

  return {
    static: {
      event: {
        id: event?.id || null,
        type: event?.type || "wedding",
        templateKey: event?.templateKey || "template-1",
        name: event?.name || null,
        eventDate: event?.eventDate || null,
        location: event?.location || null,
        locationAddress: event?.locationAddress || null,
        googleMapsLink: event?.googleMapsLink || null,
      },
      wedding: {
        groomName,
        brideName,
        coupleNames,
        weddingDate: event?.eventDate || null,
        formattedDate: dateParts.formattedDate,
        weekday: dateParts.weekday,
        longDate: dateParts.longDate,
      },
      invitation: {
        specialText: undefined,
        hotelName: event?.location || "VENUE",
        hotelAddress: null,
        googleMapsLink: event?.googleMapsLink || null,
        weatherNote: weatherValue || undefined,
        parkingNote: parkingValue || undefined,
        ceremonySetting: ceremonyValue || undefined,
      },
      contacts: templateContacts.length
        ? templateContacts
        : [
            { name: brideName, phone: "000 000 0000" },
            { name: groomName, phone: "000 000 0000" },
          ],
      scheduleEvents,
      video: {
        hasVideo: Boolean(videoFile?.url),
        url: videoFile?.url || null,
        fileName: videoFile?.filename || null,
      },
      music: {
        hasMusic: Boolean(musicFile?.url),
        url: musicFile?.url || null,
        fileName: musicFile?.filename || null,
      },
      background: {
        hasBackground: Boolean(backgroundFile?.url),
        url: backgroundFile?.url || null,
        fileName: backgroundFile?.filename || null,
      },
      images: imageFiles.map((file, index) => ({
        id: file.filename || `img-${index + 1}`,
        url: file.url,
        fileName: file.filename,
        displayOrder: index + 1,
        caption: null,
      })),
      documents: Array.isArray(resources?.documents)
        ? resources.documents
        : [],
      templateConfig: {
        pages,
        fields,
      },
      chromeBaseUrl: `/assets/events/${
        event?.type === "corporate"
          ? "corporate-events"
          : event?.type === "party"
            ? "parties"
            : "weddings"
      }/templates/${event?.templateKey || "template-1"}/chrome`,
    },
    eventType: event?.type || "wedding",
    templateKey: event?.templateKey || "template-1",
    chromeBaseUrl: `/assets/events/${
      event?.type === "corporate"
        ? "corporate-events"
        : event?.type === "party"
          ? "parties"
          : "weddings"
    }/templates/${event?.templateKey || "template-1"}/chrome`,
    guest: null,
    templateConfig: {
      pages,
      fields: {
        ...fields,
        detailNodes,
        storyMilestones: Array.isArray(fields.storyMilestones)
          ? fields.storyMilestones
          : [],
        rsvpQuestions: Array.isArray(fields.rsvpQuestions)
          ? fields.rsvpQuestions
          : [],
        journeyImages: Array.isArray(fields.journeyImages)
          ? fields.journeyImages
          : undefined,
        journeyImageCount: Array.isArray(fields.journeyImages)
          ? fields.journeyImages.length
          : Number(fields.journeyImageCount) || 4,
      },
    },
  };
}

/**
 * Full guest-experience preview for admins (dummy guest, no DB writes).
 * Uses saved templateConfig from the event by default.
 */
export function buildAdminGuestPreviewData(event, resources = null, config = null) {
  const resolvedConfig = config || event?.templateConfig || { pages: {}, fields: {} };
  const base = buildAdminInvitePreviewData(event, resolvedConfig, resources);
  return {
    ...base,
    guest: buildAdminDummyGuest(event),
    static: {
      ...base.static,
      scheduleEvents: buildAdminPreviewScheduleEvents(event),
    },
  };
}
