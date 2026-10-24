const crypto = require("crypto");
const { sequelize } = require("../models");
const {
  loadStaticInvitationBundle,
  mapGuestTemplateBlock,
  buildTemplateResponse,
  loadGuestByToken,
} = require("../utils/invitationTemplate");
const { createNotification } = require("./notificationsController");
const { isEventTicketingEnabled } = require("../utils/ticketing");

const PAYMENT_WINDOW_HOURS = 1;

async function loadEventByPublicToken(token) {
  const [rows] = await sequelize.query(
    `
    SELECT e.*, w.id AS wedding_id
    FROM events e
    INNER JOIN weddings w ON w.event_id = e.id
    WHERE e.public_invite_token = ?
      AND e.public_invite_enabled = 1
    LIMIT 1;
    `,
    { replacements: [token] }
  );
  return rows[0] || null;
}

function assertPublicEventAllowed(event) {
  if (!event) {
    return { status: 404, message: "Public invitation not found" };
  }
  const type = String(event.type || "").toLowerCase();
  if (type === "wedding") {
    return { status: 400, message: "Public invitations are not available for weddings" };
  }
  if (type !== "corporate" && type !== "party") {
    return { status: 400, message: "Public invitations are only for party or corporate events" };
  }
  if (!Boolean(Number(event.public_invite_enabled))) {
    return { status: 404, message: "Public invitation is not enabled" };
  }
  return null;
}

async function getPublicEventInvite(req, res) {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Public invite token is required",
      });
    }

    const event = await loadEventByPublicToken(token);
    const err = assertPublicEventAllowed(event);
    if (err) {
      return res.status(err.status).json({ error: "Not Found", message: err.message });
    }

    const staticBundle = await loadStaticInvitationBundle(event.wedding_id);
    if (!staticBundle) {
      return res.status(404).json({
        error: "Not Found",
        message: "Event invitation not found",
      });
    }

    const response = buildTemplateResponse(staticBundle, null);
    response.publicInvite = {
      token,
      mode: "public",
      paymentWindowHours: PAYMENT_WINDOW_HOURS,
    };
    // Placeholder guest so RSVP form can collect name/phone
    response.guest = {
      id: null,
      fullName: "",
      phone: "",
      invitationNote: "you",
      maxGuests: 10,
      tableNumber: null,
      uniqueToken: null,
      rsvpStatus: "pending",
      rsvp: {
        hasSubmitted: false,
        attendingStatus: "pending",
        attendingCount: 0,
        wishes: "",
        submittedAt: null,
      },
      isPublicRegistration: true,
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error("getPublicEventInvite error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load public invitation",
    });
  }
}

async function submitPublicEventRsvp(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Bad Request",
        message: "Public invite token is required",
      });
    }

    const event = await loadEventByPublicToken(token);
    const err = assertPublicEventAllowed(event);
    if (err) {
      await transaction.rollback();
      return res.status(err.status).json({
        error: err.status === 404 ? "Not Found" : "Bad Request",
        message: err.message,
      });
    }

    const fullName = String(req.body?.fullName || req.body?.name || "").trim();
    const phone = String(
      req.body?.whatsappNumber || req.body?.phone || ""
    ).trim();
    const email = String(
      req.body?.email || req.body?.emailAddress || ""
    ).trim() || null;
    const idNumber = String(
      req.body?.nic ||
        req.body?.nicNumber ||
        req.body?.idNumber ||
        req.body?.id_number ||
        ""
    ).trim() || null;

    if (!fullName || !phone) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Bad Request",
        message: "fullName and whatsappNumber are required",
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
      if (attendingCount > 20) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Bad Request",
          message: "attendingCount cannot exceed 20",
        });
      }
    }

    const wishes =
      req.body?.wishes === undefined || req.body?.wishes === null
        ? null
        : String(req.body.wishes).trim() || null;

    const ticketingOn = isEventTicketingEnabled(event);
    const setPaymentDue =
      ticketingOn && attendingStatus === "ATTENDING";

    const guestId = crypto.randomUUID();
    const rsvpId = crypto.randomUUID();
    const uniqueToken = `token_${crypto.randomUUID().replace(/-/g, "")}`;
    const guestRsvpStatus =
      attendingStatus === "ATTENDING" ? "CONFIRMED" : "DECLINED";

    await sequelize.query(
      `
      INSERT INTO guests (
        id, wedding_id, event_id, organization_id,
        full_name, whatsapp_number, email, id_number, invited_count, invitation_note,
        unique_token, source, rsvp_status, payment_due_at, invite_shared_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, 'you',
        ?, 'public', ?,
        ${setPaymentDue ? "DATE_ADD(NOW(), INTERVAL 1 HOUR)" : "NULL"},
        NOW()
      );
      `,
      {
        replacements: [
          guestId,
          event.wedding_id,
          event.id,
          event.organization_id || null,
          fullName,
          phone,
          email,
          idNumber,
          Math.max(attendingCount, 1),
          uniqueToken,
          guestRsvpStatus,
        ],
        transaction,
      }
    );

    await sequelize.query(
      `
      INSERT INTO rsvps (
        id, guest_id, attending_status, attending_count, wishes, submitted_at
      ) VALUES (?, ?, ?, ?, ?, NOW());
      `,
      {
        replacements: [
          rsvpId,
          guestId,
          attendingStatus,
          attendingCount,
          wishes,
        ],
        transaction,
      }
    );

    await transaction.commit();

    const guestRow = await loadGuestByToken(uniqueToken);
    const rsvpLabel =
      attendingStatus === "ATTENDING" ? "confirmed attendance" : "declined";
    await createNotification(
      event.wedding_id,
      "rsvp_submitted",
      "New RSVP received",
      `${fullName} has ${rsvpLabel} via public link.`,
      guestId
    );

    const staticBundle = await loadStaticInvitationBundle(event.wedding_id);
    const response = buildTemplateResponse(staticBundle, guestRow);
    response.publicInvite = {
      token,
      mode: "public",
      paymentWindowHours: PAYMENT_WINDOW_HOURS,
      registered: true,
    };
    response.guestToken = uniqueToken;
    response.message = "RSVP saved";
    response.guest = {
      ...mapGuestTemplateBlock(guestRow),
      paymentDueAt: guestRow?.payment_due_at || null,
      isPublicRegistration: true,
    };

    return res.status(201).json(response);
  } catch (err) {
    try {
      await transaction.rollback();
    } catch {
      // ignore
    }
    console.error("submitPublicEventRsvp error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to register via public invitation",
    });
  }
}

module.exports = {
  getPublicEventInvite,
  submitPublicEventRsvp,
  PAYMENT_WINDOW_HOURS,
};
