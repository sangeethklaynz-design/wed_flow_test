const crypto = require("crypto");
const { sequelize } = require("../models");
const {
  toDateOnly,
  buildInitials,
  formatTime,
} = require("./wedding");
const {
  resolveInvitationVideoFromDisk,
  resolveCoupleImagesFromDisk,
} = require("./invitationMedia");

function splitCoupleNames(coupleNames) {
  const raw = String(coupleNames || "").trim();
  if (!raw) {
    return { groomName: "", brideName: "", coupleNames: "" };
  }
  if (raw.includes("&")) {
    const [left, ...rest] = raw.split("&").map((p) => p.trim());
    return {
      groomName: left,
      brideName: rest.join(" & ").trim(),
      coupleNames: raw,
    };
  }
  return { groomName: raw, brideName: "", coupleNames: raw };
}

function formatTemplateDate(dateValue) {
  const dateOnly = toDateOnly(dateValue);
  if (!dateOnly) return null;
  const d = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day} . ${month} . ${year}`;
}

async function loadWeddingRow(weddingId) {
  const [rows] = await sequelize.query(
    `
    SELECT
      id,
      couple_names,
      bride_name,
      groom_name,
      wedding_date
    FROM weddings
    WHERE id = ?
    LIMIT 1;
    `,
    { replacements: [weddingId] }
  );
  return rows[0] || null;
}

async function syncInvitationMediaToDb(weddingId, invitationId, diskVideo, diskImages) {
  if (!diskVideo && !diskImages.length) return;

  if (diskVideo && invitationId) {
    const [rows] = await sequelize.query(
      `SELECT opening_video_url FROM invitations WHERE id = ? LIMIT 1;`,
      { replacements: [invitationId] }
    );
    const current = rows[0]?.opening_video_url || null;
    if (current !== diskVideo.url) {
      await sequelize.query(
        `
        UPDATE invitations
        SET opening_video_url = ?
        WHERE id = ?;
        `,
        { replacements: [diskVideo.url, invitationId] }
      );
    }
  }

  if (!diskImages.length) return;

  const [existing] = await sequelize.query(
    `
    SELECT image_url, display_order
    FROM couple_images
    WHERE wedding_id = ?
    ORDER BY display_order ASC, created_at ASC;
    `,
    { replacements: [weddingId] }
  );

  const existingKey = existing.map((r) => `${r.display_order}:${r.image_url}`).join("|");
  const nextKey = diskImages
    .map((img) => `${img.displayOrder}:${img.url}`)
    .join("|");

  if (existingKey === nextKey) return;

  await sequelize.query(
    `DELETE FROM couple_images WHERE wedding_id = ?;`,
    { replacements: [weddingId] }
  );

  for (const img of diskImages) {
    await sequelize.query(
      `
      INSERT INTO couple_images (
        id, wedding_id, image_url, caption, display_order, created_at
      )
      VALUES (?, ?, ?, ?, ?, NOW());
      `,
      {
        replacements: [
          crypto.randomUUID(),
          weddingId,
          img.url,
          img.caption,
          img.displayOrder,
        ],
      }
    );
  }
}

async function loadStaticInvitationBundle(weddingId) {
  const wedding = await loadWeddingRow(weddingId);
  if (!wedding) return null;

  const [invitationRows] = await sequelize.query(
    `
    SELECT
      id,
      opening_video_url,
      special_text,
      poruwa_time,
      hotel_name,
      hotel_address,
      google_maps_link,
      weather_note,
      parking_note,
      thank_you_note
    FROM invitations
    WHERE wedding_id = ?
    LIMIT 1;
    `,
    { replacements: [weddingId] }
  );

  let invitation = invitationRows[0] || null;

  // Prefer disk assets: assets/invitation_video/<slug>/ + assets/couple_images/<slug>/
  // Sync URLs into DB so invitation media stays linked.
  const diskVideo = resolveInvitationVideoFromDisk(wedding.couple_names);
  const diskImages = resolveCoupleImagesFromDisk(wedding.couple_names);
  await syncInvitationMediaToDb(
    wedding.id,
    invitation?.id || null,
    diskVideo,
    diskImages
  );

  if (diskVideo || diskImages.length) {
    const [freshInvitationRows] = await sequelize.query(
      `
      SELECT
        id,
        opening_video_url,
        special_text,
        poruwa_time,
        hotel_name,
        hotel_address,
        google_maps_link,
        weather_note,
        parking_note,
        thank_you_note
      FROM invitations
      WHERE wedding_id = ?
      LIMIT 1;
      `,
      { replacements: [weddingId] }
    );
    invitation = freshInvitationRows[0] || invitation;
  }

  const [imageRows] = await sequelize.query(
    `
    SELECT id, image_url, caption, display_order
    FROM couple_images
    WHERE wedding_id = ?
    ORDER BY display_order ASC, created_at ASC;
    `,
    { replacements: [weddingId] }
  );

  const resolvedImages =
    imageRows.length > 0
      ? imageRows
      : diskImages.map((img, i) => ({
          id: `disk-${i}`,
          image_url: img.url,
          caption: img.caption,
          display_order: img.displayOrder,
        }));

  let milestones = [];
  let contacts = [];

  if (invitation) {
    const [[milestoneRows], [contactRows]] = await Promise.all([
      sequelize.query(
        `
        SELECT id, year_or_date, title, description, display_order
        FROM milestones
        WHERE invitation_id = ?
        ORDER BY display_order ASC;
        `,
        { replacements: [invitation.id] }
      ),
      sequelize.query(
        `
        SELECT
          c.id,
          c.contact_name,
          c.contact_phone,
          c.relation_type,
          ic.display_order
        FROM invitation_contacts ic
        JOIN contacts c ON c.id = ic.contact_id
        WHERE ic.invitation_id = ?
        ORDER BY ic.display_order ASC;
        `,
        { replacements: [invitation.id] }
      ),
    ]);

    milestones = milestoneRows.map((m) => ({
      id: m.id,
      yearOrDate: m.year_or_date,
      title: m.title,
      description: m.description,
      displayOrder: m.display_order,
    }));

    contacts = contactRows.map((c) => ({
      id: c.id,
      name: c.contact_name,
      phone: c.contact_phone,
      relationType: c.relation_type,
      displayOrder: c.display_order,
    }));
  }

  const parsed =
    wedding.groom_name && wedding.bride_name
      ? {
          groomName: wedding.groom_name,
          brideName: wedding.bride_name,
          coupleNames: wedding.couple_names,
        }
      : splitCoupleNames(wedding.couple_names);

  const weddingDate = toDateOnly(wedding.wedding_date);
  const openingVideoUrl =
    (diskVideo && diskVideo.url) ||
    invitation?.opening_video_url ||
    null;

  return {
    wedding: {
      id: wedding.id,
      coupleNames: parsed.coupleNames,
      groomName: parsed.groomName,
      brideName: parsed.brideName,
      initials: buildInitials(wedding.couple_names),
      weddingDate,
      formattedDate: formatTemplateDate(wedding.wedding_date),
    },
    video: {
      url: openingVideoUrl,
      hasVideo: Boolean(openingVideoUrl),
    },
    invitation: invitation
      ? {
          id: invitation.id,
          specialText: invitation.special_text,
          poruwaTime: formatTime(invitation.poruwa_time),
          hotelName: invitation.hotel_name,
          hotelAddress: invitation.hotel_address,
          googleMapsLink: invitation.google_maps_link,
          weatherNote: invitation.weather_note,
          parkingNote: invitation.parking_note,
          thankYouNote: invitation.thank_you_note,
        }
      : null,
    images: resolvedImages.map((img) => ({
      id: img.id,
      url: img.image_url,
      caption: img.caption,
      displayOrder: img.display_order,
    })),
    milestones,
    contacts,
  };
}

async function loadGuestByToken(token) {
  const [rows] = await sequelize.query(
    `
    SELECT
      g.id AS guest_id,
      g.wedding_id,
      g.full_name,
      g.whatsapp_number,
      g.invited_count,
      g.invitation_note,
      g.table_number,
      g.unique_token,
      g.rsvp_status,
      r.id AS rsvp_id,
      r.attending_status,
      r.attending_count,
      r.wishes,
      r.submitted_at
    FROM guests g
    LEFT JOIN rsvps r ON r.guest_id = g.id
    WHERE g.unique_token = ?
    LIMIT 1;
    `,
    { replacements: [token] }
  );
  return rows[0] || null;
}

function mapGuestTemplateBlock(row) {
  if (!row) return null;

  const attendingStatus = row.attending_status
    ? String(row.attending_status).toUpperCase()
    : "PENDING";

  return {
    id: row.guest_id,
    fullName: row.full_name,
    phone: row.whatsapp_number,
    /** Per-guest salutation e.g. "you and your wife", "you and your family" */
    invitationNote: row.invitation_note || "",
    maxGuests: Number(row.invited_count) || 1,
    tableNumber: row.table_number,
    uniqueToken: row.unique_token,
    rsvpStatus: String(row.rsvp_status || "PENDING").toLowerCase(),
    rsvp: {
      hasSubmitted: Boolean(row.submitted_at),
      attendingStatus: attendingStatus.toLowerCase(),
      attendingCount: Number(row.attending_count) || 0,
      wishes: row.wishes || "",
      submittedAt: row.submitted_at,
    },
  };
}

function buildTemplateResponse(staticBundle, guestRow = null) {
  return {
    static: {
      wedding: staticBundle.wedding,
      video: staticBundle.video,
      invitation: staticBundle.invitation,
      images: staticBundle.images,
      milestones: staticBundle.milestones,
      contacts: staticBundle.contacts,
    },
    guest: guestRow ? mapGuestTemplateBlock(guestRow) : null,
  };
}

module.exports = {
  splitCoupleNames,
  formatTemplateDate,
  loadStaticInvitationBundle,
  loadGuestByToken,
  mapGuestTemplateBlock,
  buildTemplateResponse,
};
