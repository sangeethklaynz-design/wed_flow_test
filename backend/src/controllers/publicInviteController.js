const crypto = require("crypto");
const { sequelize } = require("../models");
const {
  toDateOnly,
  buildInitials,
  formatTime,
} = require("../utils/wedding");

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
      r.submitted_at,
      w.couple_names,
      w.wedding_date
    FROM guests g
    JOIN weddings w ON w.id = g.wedding_id
    LEFT JOIN rsvps r ON r.guest_id = g.id
    WHERE g.unique_token = ?
    LIMIT 1;
    `,
    { replacements: [token] }
  );
  return rows[0] || null;
}

async function loadInvitationBundle(weddingId) {
  const [[invitationRows], [imageRows]] = await Promise.all([
    sequelize.query(
      `
      SELECT
        id,
        opening_video_url,
        special_text,
        poruwa_time,
        hotel_name,
        google_maps_link,
        weather_note,
        parking_note,
        thank_you_note
      FROM invitations
      WHERE wedding_id = ?
      LIMIT 1;
      `,
      { replacements: [weddingId] }
    ),
    sequelize.query(
      `
      SELECT id, image_url, caption, display_order
      FROM couple_images
      WHERE wedding_id = ?
      ORDER BY display_order ASC, created_at ASC;
      `,
      { replacements: [weddingId] }
    ),
  ]);

  const invitation = invitationRows[0] || null;
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

  return {
    invitation,
    images: imageRows.map((img) => ({
      id: img.id,
      url: img.image_url,
      caption: img.caption,
      displayOrder: img.display_order,
    })),
    milestones,
    contacts,
  };
}

function mapGuestPayload(row) {
  const hasSubmitted = Boolean(row.submitted_at);
  const attendingStatus = row.attending_status
    ? String(row.attending_status).toUpperCase()
    : "PENDING";

  return {
    id: row.guest_id,
    fullName: row.full_name,
    invitationNote: row.invitation_note || "",
    maxGuests: Number(row.invited_count) || 1,
    tableNumber: row.table_number,
    rsvpStatus: String(row.rsvp_status || "PENDING").toLowerCase(),
    rsvp: {
      hasSubmitted,
      attendingStatus: attendingStatus.toLowerCase(),
      attendingCount: Number(row.attending_count) || 0,
      wishes: row.wishes || "",
      submittedAt: row.submitted_at,
    },
  };
}

async function getPublicInvite(req, res) {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Invitation token is required",
      });
    }

    const row = await loadGuestByToken(token);
    if (!row) {
      return res.status(404).json({
        error: "Not Found",
        message: "Invitation not found",
      });
    }

    const bundle = await loadInvitationBundle(row.wedding_id);
    const openingVideoUrl = bundle.invitation?.opening_video_url || null;

    return res.status(200).json({
      wedding: {
        id: row.wedding_id,
        coupleNames: row.couple_names,
        initials: buildInitials(row.couple_names),
        weddingDate: toDateOnly(row.wedding_date),
      },
      video: {
        url: openingVideoUrl,
        hasVideo: Boolean(openingVideoUrl),
      },
      invitation: bundle.invitation
        ? {
            id: bundle.invitation.id,
            specialText: bundle.invitation.special_text,
            poruwaTime: formatTime(bundle.invitation.poruwa_time),
            hotelName: bundle.invitation.hotel_name,
            googleMapsLink: bundle.invitation.google_maps_link,
            weatherNote: bundle.invitation.weather_note,
            parkingNote: bundle.invitation.parking_note,
            thankYouNote: bundle.invitation.thank_you_note,
          }
        : null,
      images: bundle.images,
      milestones: bundle.milestones,
      contacts: bundle.contacts,
      guest: mapGuestPayload(row),
    });
  } catch (err) {
    console.error("public invite error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load invitation",
    });
  }
}

async function submitPublicRsvp(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Bad Request",
        message: "Invitation token is required",
      });
    }

    const row = await loadGuestByToken(token);
    if (!row) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Not Found",
        message: "Invitation not found",
      });
    }

    const rawStatus = String(
      req.body?.status || req.body?.attendingStatus || ""
    )
      .trim()
      .toUpperCase();

    let attendingStatus;
    if (rawStatus === "ATTENDING" || rawStatus === "CONFIRMED" || req.body?.attending === true) {
      attendingStatus = "ATTENDING";
    } else if (rawStatus === "DECLINED" || req.body?.attending === false) {
      attendingStatus = "DECLINED";
    } else {
      await transaction.rollback();
      return res.status(400).json({
        error: "Bad Request",
        message: 'status must be "ATTENDING" or "DECLINED"',
      });
    }

    const maxGuests = Number(row.invited_count) || 1;
    let attendingCount = Number(req.body?.attendingCount);

    if (attendingStatus === "DECLINED") {
      attendingCount = 0;
    } else {
      if (!Number.isInteger(attendingCount) || attendingCount < 1) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Bad Request",
          message: "attendingCount must be an integer of at least 1 when attending",
        });
      }
      if (attendingCount > maxGuests) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Bad Request",
          message: `attendingCount cannot exceed maxGuests (${maxGuests})`,
        });
      }
    }

    const wishes =
      req.body?.wishes === undefined || req.body?.wishes === null
        ? null
        : String(req.body.wishes).trim() || null;

    const guestRsvpStatus =
      attendingStatus === "ATTENDING" ? "CONFIRMED" : "DECLINED";

    await sequelize.query(
      `
      UPDATE guests
      SET rsvp_status = ?
      WHERE id = ?;
      `,
      {
        replacements: [guestRsvpStatus, row.guest_id],
        transaction,
      }
    );

    if (row.rsvp_id) {
      await sequelize.query(
        `
        UPDATE rsvps
        SET
          attending_status = ?,
          attending_count = ?,
          wishes = ?,
          submitted_at = NOW()
        WHERE id = ?;
        `,
        {
          replacements: [
            attendingStatus,
            attendingCount,
            wishes,
            row.rsvp_id,
          ],
          transaction,
        }
      );
    } else {
      const rsvpId = crypto.randomUUID();
      await sequelize.query(
        `
        INSERT INTO rsvps (
          id, guest_id, attending_status, attending_count, wishes, submitted_at
        )
        VALUES (?, ?, ?, ?, ?, NOW());
        `,
        {
          replacements: [
            rsvpId,
            row.guest_id,
            attendingStatus,
            attendingCount,
            wishes,
          ],
          transaction,
        }
      );
    }

    await transaction.commit();

    const updated = await loadGuestByToken(token);

    return res.status(200).json({
      message: "RSVP saved",
      guest: mapGuestPayload(updated),
    });
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (_) {
      // ignore
    }
    console.error("public rsvp error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to save RSVP",
    });
  }
}

module.exports = { getPublicInvite, submitPublicRsvp };
