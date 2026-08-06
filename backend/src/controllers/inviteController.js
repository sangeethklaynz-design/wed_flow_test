const { sequelize } = require("../models");
const {
  getWeddingForUser,
  toDateOnly,
  buildInitials,
  formatTime,
} = require("../utils/wedding");

async function getInvite(req, res) {
  try {
    const wedding = await getWeddingForUser(req.user.id, req.user.weddingId);

    if (!wedding) {
      return res.status(404).json({
        error: "Not Found",
        message: "No wedding found for this account",
      });
    }

    const weddingId = wedding.id;

    const [[invitationRows], [imageRows]] = await Promise.all([
      sequelize.query(
        `
        SELECT
          id,
          wedding_id,
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

    const images = imageRows.map((img) => ({
      id: img.id,
      url: img.image_url,
      caption: img.caption,
      displayOrder: img.display_order,
    }));

    const openingVideoUrl = invitation?.opening_video_url || null;

    return res.status(200).json({
      wedding: {
        id: wedding.id,
        coupleNames: wedding.couple_names,
        initials: buildInitials(wedding.couple_names),
        weddingDate: toDateOnly(wedding.wedding_date),
      },
      // Intro video for Invite tab phase 1
      video: {
        url: openingVideoUrl,
        hasVideo: Boolean(openingVideoUrl),
      },
      // Template payload for Invite tab phase 2
      invitation: invitation
        ? {
            id: invitation.id,
            specialText: invitation.special_text,
            poruwaTime: formatTime(invitation.poruwa_time),
            hotelName: invitation.hotel_name,
            googleMapsLink: invitation.google_maps_link,
            weatherNote: invitation.weather_note,
            parkingNote: invitation.parking_note,
            thankYouNote: invitation.thank_you_note,
          }
        : null,
      images,
      milestones,
      contacts,
    });
  } catch (err) {
    console.error("invite error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load invitation",
    });
  }
}

module.exports = { getInvite };
