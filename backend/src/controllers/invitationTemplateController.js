const crypto = require("crypto");
const { sequelize } = require("../models");
const { getWeddingForUser, toDateOnly } = require("../utils/wedding");
const {
  loadStaticInvitationBundle,
  loadGuestByToken,
  buildTemplateResponse,
  splitCoupleNames,
} = require("../utils/invitationTemplate");

async function getCoupleInvitationTemplate(req, res) {
  try {
    const wedding = await getWeddingForUser(req.user.id, req.user.weddingId);
    if (!wedding) {
      return res.status(404).json({
        error: "Not Found",
        message: "No wedding found for this account",
      });
    }

    const staticBundle = await loadStaticInvitationBundle(wedding.id);
    if (!staticBundle) {
      return res.status(404).json({
        error: "Not Found",
        message: "Wedding not found",
      });
    }

    return res.status(200).json(buildTemplateResponse(staticBundle));
  } catch (err) {
    console.error("getCoupleInvitationTemplate error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load invitation template",
    });
  }
}

function parseStaticUpdateBody(body) {
  return {
    groomName:
      body?.groomName !== undefined
        ? String(body.groomName || "").trim()
        : undefined,
    brideName:
      body?.brideName !== undefined
        ? String(body.brideName || "").trim()
        : undefined,
    weddingDate:
      body?.weddingDate !== undefined
        ? String(body.weddingDate || "").trim()
        : undefined,
    specialText:
      body?.specialText !== undefined
        ? String(body.specialText || "").trim()
        : undefined,
    poruwaTime:
      body?.poruwaTime !== undefined
        ? String(body.poruwaTime || "").trim()
        : undefined,
    hotelName:
      body?.hotelName !== undefined
        ? String(body.hotelName || "").trim()
        : undefined,
    hotelAddress:
      body?.hotelAddress !== undefined
        ? String(body.hotelAddress || "").trim()
        : undefined,
    googleMapsLink:
      body?.googleMapsLink !== undefined
        ? String(body.googleMapsLink || "").trim()
        : undefined,
    weatherNote:
      body?.weatherNote !== undefined
        ? String(body.weatherNote || "").trim()
        : undefined,
    parkingNote:
      body?.parkingNote !== undefined
        ? String(body.parkingNote || "").trim()
        : undefined,
    thankYouNote:
      body?.thankYouNote !== undefined
        ? String(body.thankYouNote || "").trim()
        : undefined,
    openingVideoUrl:
      body?.openingVideoUrl !== undefined
        ? String(body.openingVideoUrl || "").trim()
        : undefined,
  };
}

function normalizePoruwaTime(value) {
  if (!value) return null;
  if (/^\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value;
  throw new Error('poruwaTime must be HH:mm (e.g. "16:30")');
}

async function updateCoupleInvitationTemplate(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const wedding = await getWeddingForUser(req.user.id, req.user.weddingId);
    if (!wedding) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Not Found",
        message: "No wedding found for this account",
      });
    }

    const payload = parseStaticUpdateBody(req.body || {});
    const weddingUpdates = [];
    const weddingReplacements = [];

    if (payload.groomName !== undefined) {
      weddingUpdates.push("groom_name = ?");
      weddingReplacements.push(payload.groomName || null);
    }
    if (payload.brideName !== undefined) {
      weddingUpdates.push("bride_name = ?");
      weddingReplacements.push(payload.brideName || null);
    }
    if (payload.weddingDate !== undefined) {
      if (payload.weddingDate && !/^\d{4}-\d{2}-\d{2}$/.test(payload.weddingDate)) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Bad Request",
          message: "weddingDate must be YYYY-MM-DD",
        });
      }
      weddingUpdates.push("wedding_date = ?");
      weddingReplacements.push(
        payload.weddingDate ? `${payload.weddingDate} 00:00:00` : null
      );
    }

    const nextGroom =
      payload.groomName !== undefined
        ? payload.groomName
        : wedding.groom_name || splitCoupleNames(wedding.couple_names).groomName;
    const nextBride =
      payload.brideName !== undefined
        ? payload.brideName
        : wedding.bride_name || splitCoupleNames(wedding.couple_names).brideName;

    if (
      payload.groomName !== undefined ||
      payload.brideName !== undefined
    ) {
      weddingUpdates.push("couple_names = ?");
      weddingReplacements.push(
        nextGroom && nextBride ? `${nextGroom} & ${nextBride}` : wedding.couple_names
      );
    }

    if (weddingUpdates.length) {
      weddingUpdates.push("updated_at = NOW()");
      weddingReplacements.push(wedding.id);
      await sequelize.query(
        `
        UPDATE weddings
        SET ${weddingUpdates.join(", ")}
        WHERE id = ?;
        `,
        { replacements: weddingReplacements, transaction }
      );
    }

    const invitationFields = {
      special_text: payload.specialText,
      poruwa_time:
        payload.poruwaTime !== undefined
          ? normalizePoruwaTime(payload.poruwaTime)
          : undefined,
      hotel_name: payload.hotelName,
      hotel_address: payload.hotelAddress,
      google_maps_link: payload.googleMapsLink,
      weather_note: payload.weatherNote,
      parking_note: payload.parkingNote,
      thank_you_note: payload.thankYouNote,
      opening_video_url: payload.openingVideoUrl,
    };

    const invitationUpdates = [];
    const invitationReplacements = [];
    for (const [column, value] of Object.entries(invitationFields)) {
      if (value !== undefined) {
        invitationUpdates.push(`${column} = ?`);
        invitationReplacements.push(value || null);
      }
    }

    if (invitationUpdates.length) {
      const [existing] = await sequelize.query(
        `SELECT id FROM invitations WHERE wedding_id = ? LIMIT 1;`,
        { replacements: [wedding.id], transaction }
      );

      if (existing.length) {
        invitationReplacements.push(existing[0].id);
        await sequelize.query(
          `
          UPDATE invitations
          SET ${invitationUpdates.join(", ")}
          WHERE id = ?;
          `,
          { replacements: invitationReplacements, transaction }
        );
      } else {
        const invitationId = crypto.randomUUID();
        await sequelize.query(
          `
          INSERT INTO invitations (
            id, wedding_id, opening_video_url, special_text, poruwa_time,
            hotel_name, hotel_address, google_maps_link, weather_note,
            parking_note, thank_you_note
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
          `,
          {
            replacements: [
              invitationId,
              wedding.id,
              payload.openingVideoUrl || null,
              payload.specialText || null,
              payload.poruwaTime
                ? normalizePoruwaTime(payload.poruwaTime)
                : null,
              payload.hotelName || null,
              payload.hotelAddress || null,
              payload.googleMapsLink || null,
              payload.weatherNote || null,
              payload.parkingNote || null,
              payload.thankYouNote || null,
            ],
            transaction,
          }
        );
      }
    }

    await transaction.commit();

    const staticBundle = await loadStaticInvitationBundle(wedding.id);
    return res.status(200).json({
      message: "Invitation template updated",
      ...buildTemplateResponse(staticBundle),
    });
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (_) {
      // ignore
    }
    if (err.message?.includes("poruwaTime")) {
      return res.status(400).json({
        error: "Bad Request",
        message: err.message,
      });
    }
    console.error("updateCoupleInvitationTemplate error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update invitation template",
    });
  }
}

async function getGuestInvitationTemplate(req, res) {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Invitation token is required",
      });
    }

    const guestRow = await loadGuestByToken(token);
    if (!guestRow) {
      return res.status(404).json({
        error: "Not Found",
        message: "Invitation not found",
      });
    }

    const staticBundle = await loadStaticInvitationBundle(guestRow.wedding_id);
    if (!staticBundle) {
      return res.status(404).json({
        error: "Not Found",
        message: "Wedding not found",
      });
    }

    return res.status(200).json(
      buildTemplateResponse(staticBundle, guestRow)
    );
  } catch (err) {
    console.error("getGuestInvitationTemplate error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load guest invitation template",
    });
  }
}

module.exports = {
  getCoupleInvitationTemplate,
  updateCoupleInvitationTemplate,
  getGuestInvitationTemplate,
};
