const crypto = require("crypto");
const { sequelize } = require("../models");
const {
  loadStaticInvitationBundle,
  loadGuestByToken,
  mapGuestTemplateBlock,
} = require("../utils/invitationTemplate");

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

    const staticBundle = await loadStaticInvitationBundle(row.wedding_id);
    if (!staticBundle) {
      return res.status(404).json({
        error: "Not Found",
        message: "Wedding not found",
      });
    }

    return res.status(200).json({
      wedding: staticBundle.wedding,
      video: staticBundle.video,
      invitation: staticBundle.invitation,
      images: staticBundle.images,
      milestones: staticBundle.milestones,
      contacts: staticBundle.contacts,
      guest: mapGuestTemplateBlock(row),
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
    if (
      rawStatus === "ATTENDING" ||
      rawStatus === "CONFIRMED" ||
      req.body?.attending === true
    ) {
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
          message:
            "attendingCount must be an integer of at least 1 when attending",
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
      guest: mapGuestTemplateBlock(updated),
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

async function downloadPublicSchedule(req, res) {
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

    const { buildSchedulePdfBuffer } = require("../utils/schedulePdf");
    const pdfBuffer = await buildSchedulePdfBuffer(row.wedding_id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="wedding-schedule.pdf"`
    );
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error("downloadPublicSchedule error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to download schedule",
    });
  }
}

module.exports = { getPublicInvite, submitPublicRsvp, downloadPublicSchedule };
