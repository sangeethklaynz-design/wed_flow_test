const crypto = require("crypto");
const { sequelize } = require("../models");
const { getWeddingForUser, toDateOnly } = require("../utils/wedding");
const { createNotification } = require("./notificationsController");

function timeToMinutes(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(String(value))) return null;
  const [hours, minutes] = String(value).split(":").map(Number);
  return hours * 60 + minutes;
}

function normalizeTime(value) {
  if (!value) return null;
  const str = String(value);
  return str.length >= 5 ? str.slice(0, 5) : str;
}

function dbStatusToUi(value) {
  switch (String(value || "").toUpperCase()) {
    case "DONE":
      return "done";
    case "LIVE_NOW":
      return "live";
    default:
      return "upcoming";
  }
}

function uiStatusToDb(value) {
  switch (String(value || "").toLowerCase()) {
    case "done":
      return "DONE";
    case "live":
      return "LIVE_NOW";
    default:
      return "UPCOMING";
  }
}

function computeStatus(weddingDateValue, startTime, endTime, fallbackStatus) {
  const weddingDate = toDateOnly(weddingDateValue);
  if (!weddingDate) return dbStatusToUi(fallbackStatus);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (today < weddingDate) return "upcoming";
  if (today > weddingDate) return "done";

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime) ?? startMinutes;

  if (startMinutes === null) return dbStatusToUi(fallbackStatus);
  if (endMinutes !== null && nowMinutes > endMinutes) return "done";
  if (nowMinutes >= startMinutes && nowMinutes <= endMinutes) return "live";
  return "upcoming";
}

function mapEventRow(row, weddingDate) {
  const startTime = normalizeTime(row.event_time);
  const endTime = normalizeTime(row.end_time);
  return {
    id: row.id,
    title: row.title,
    startTime,
    endTime,
    specialNotes: row.special_notes || row.location || "",
    status: computeStatus(weddingDate, startTime, endTime, row.status),
    notificationEnabled:
      row.notification_enabled === undefined
        ? true
        : Boolean(Number(row.notification_enabled)),
    notificationSentAt: row.notification_sent_at || null,
    displayOrder: Number(row.display_order) || 1,
  };
}

async function assertWedding(req) {
  const wedding = await getWeddingForUser(req.user.id, req.user.weddingId);
  if (!wedding) {
    return { error: { status: 404, message: "No wedding found for this account" } };
  }
  return { wedding };
}

async function fetchScheduleRows(weddingId, eventId = null) {
  const replacements = eventId ? [weddingId, eventId] : [weddingId];
  const whereEvent = eventId ? "AND id = ?" : "";
  const [rows] = await sequelize.query(
    `
    SELECT
      id,
      wedding_id,
      event_time,
      end_time,
      title,
      location,
      special_notes,
      status,
      display_order,
      notification_enabled,
      notification_sent_at
    FROM schedule_events
    WHERE wedding_id = ?
    ${whereEvent}
    ORDER BY event_time ASC, display_order ASC;
    `,
    { replacements }
  );
  return rows;
}

function parseScheduleBody(body) {
  return {
    title: String(body?.title || "").trim(),
    startTime: String(body?.startTime || body?.eventTime || "").trim(),
    endTime: String(body?.endTime || "").trim(),
    specialNotes:
      body?.specialNotes === undefined
        ? undefined
        : String(body.specialNotes || "").trim(),
    notificationEnabled:
      body?.notificationEnabled === undefined
        ? undefined
        : Boolean(body.notificationEnabled),
  };
}

function validateScheduleInput({ title, startTime, endTime }) {
  if (!title || !startTime || !endTime) {
    return "title, startTime, and endTime are required";
  }
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    return "startTime and endTime must be in HH:mm format";
  }
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  if (endMinutes <= startMinutes) {
    return "endTime must be after startTime";
  }
  return null;
}

function hasOverlap(startTime, endTime, rows, excludeId = null) {
  const nextStart = timeToMinutes(startTime);
  const nextEnd = timeToMinutes(endTime);

  return rows.some((row) => {
    if (excludeId && row.id === excludeId) return false;
    const existingStart = timeToMinutes(normalizeTime(row.event_time));
    const existingEnd =
      timeToMinutes(normalizeTime(row.end_time)) ?? existingStart;
    if (existingStart === null || existingEnd === null) return false;
    return nextStart < existingEnd && nextEnd > existingStart;
  });
}

function nextDisplayOrder(rows) {
  return rows.reduce((max, row) => Math.max(max, Number(row.display_order) || 0), 0) + 1;
}

async function listSchedule(req, res) {
  try {
    const { wedding, error } = await assertWedding(req);
    if (error) {
      return res.status(error.status).json({
        error: "Not Found",
        message: error.message,
      });
    }

    const rows = await fetchScheduleRows(wedding.id);
    return res.status(200).json({
      weddingDate: toDateOnly(wedding.wedding_date),
      events: rows.map((row) => mapEventRow(row, wedding.wedding_date)),
    });
  } catch (err) {
    console.error("listSchedule error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load schedule",
    });
  }
}

async function getScheduleEvent(req, res) {
  try {
    const { wedding, error } = await assertWedding(req);
    if (error) {
      return res.status(error.status).json({
        error: "Not Found",
        message: error.message,
      });
    }

    const eventId = String(req.params.id || "").trim();
    const rows = await fetchScheduleRows(wedding.id, eventId);
    if (!rows.length) {
      return res.status(404).json({
        error: "Not Found",
        message: "Schedule event not found",
      });
    }

    return res.status(200).json({
      event: mapEventRow(rows[0], wedding.wedding_date),
    });
  } catch (err) {
    console.error("getScheduleEvent error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load schedule event",
    });
  }
}

async function createScheduleEvent(req, res) {
  try {
    const { wedding, error } = await assertWedding(req);
    if (error) {
      return res.status(error.status).json({
        error: "Not Found",
        message: error.message,
      });
    }

    const payload = parseScheduleBody(req.body);
    const validationError = validateScheduleInput(payload);
    if (validationError) {
      return res.status(400).json({
        error: "Bad Request",
        message: validationError,
      });
    }

    const existingRows = await fetchScheduleRows(wedding.id);
    if (hasOverlap(payload.startTime, payload.endTime, existingRows)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "This event overlaps an existing schedule item",
      });
    }

    const eventId = crypto.randomUUID();
    await sequelize.query(
      `
      INSERT INTO schedule_events (
        id, wedding_id, event_time, end_time, title, location, special_notes,
        status, display_order, notification_enabled, notification_sent_at
      )
      VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, NULL);
      `,
      {
        replacements: [
          eventId,
          wedding.id,
          payload.startTime,
          payload.endTime,
          payload.title,
          payload.specialNotes || null,
          uiStatusToDb("upcoming"),
          nextDisplayOrder(existingRows),
          payload.notificationEnabled === undefined
            ? 1
            : payload.notificationEnabled
              ? 1
              : 0,
        ],
      }
    );

    const rows = await fetchScheduleRows(wedding.id, eventId);
    await createNotification(wedding.id, "schedule_added", "Event added", `"${payload.title}" has been added to the schedule.`);
    return res.status(201).json({
      event: mapEventRow(rows[0], wedding.wedding_date),
    });
  } catch (err) {
    console.error("createScheduleEvent error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create schedule event",
    });
  }
}

async function updateScheduleEvent(req, res) {
  try {
    const { wedding, error } = await assertWedding(req);
    if (error) {
      return res.status(error.status).json({
        error: "Not Found",
        message: error.message,
      });
    }

    const eventId = String(req.params.id || "").trim();
    const existingRows = await fetchScheduleRows(wedding.id);
    const existing = existingRows.find((row) => row.id === eventId);

    if (!existing) {
      return res.status(404).json({
        error: "Not Found",
        message: "Schedule event not found",
      });
    }

    const payload = parseScheduleBody(req.body);
    const nextStartTime = payload.startTime || normalizeTime(existing.event_time);
    const nextEndTime = payload.endTime || normalizeTime(existing.end_time);
    const nextTitle = payload.title || existing.title;
    const nextNotes =
      payload.specialNotes === undefined
        ? existing.special_notes || existing.location || null
        : payload.specialNotes || null;
    const nextNotificationEnabled =
      payload.notificationEnabled === undefined
        ? Number(existing.notification_enabled ?? 1)
        : payload.notificationEnabled
          ? 1
          : 0;

    const validationError = validateScheduleInput({
      title: nextTitle,
      startTime: nextStartTime,
      endTime: nextEndTime,
    });
    if (validationError) {
      return res.status(400).json({
        error: "Bad Request",
        message: validationError,
      });
    }

    if (hasOverlap(nextStartTime, nextEndTime, existingRows, eventId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "This event overlaps an existing schedule item",
      });
    }

    await sequelize.query(
      `
      UPDATE schedule_events
      SET
        event_time = ?,
        end_time = ?,
        title = ?,
        special_notes = ?,
        notification_enabled = ?,
        notification_sent_at = NULL
      WHERE id = ? AND wedding_id = ?;
      `,
      {
        replacements: [
          nextStartTime,
          nextEndTime,
          nextTitle,
          nextNotes,
          nextNotificationEnabled,
          eventId,
          wedding.id,
        ],
      }
    );

    const rows = await fetchScheduleRows(wedding.id, eventId);
    await createNotification(wedding.id, "schedule_updated", "Event updated", `"${rows[0].title}" has been updated.`);
    return res.status(200).json({
      event: mapEventRow(rows[0], wedding.wedding_date),
    });
  } catch (err) {
    console.error("updateScheduleEvent error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update schedule event",
    });
  }
}

async function deleteScheduleEvent(req, res) {
  try {
    const { wedding, error } = await assertWedding(req);
    if (error) {
      return res.status(error.status).json({
        error: "Not Found",
        message: error.message,
      });
    }

    const eventId = String(req.params.id || "").trim();
    const rows = await fetchScheduleRows(wedding.id, eventId);
    if (!rows.length) {
      return res.status(404).json({
        error: "Not Found",
        message: "Schedule event not found",
      });
    }

    const deletedTitle = rows[0].title;
    await sequelize.query(
      `DELETE FROM schedule_events WHERE id = ? AND wedding_id = ?;`,
      {
        replacements: [eventId, wedding.id],
      }
    );

    await createNotification(wedding.id, "schedule_deleted", "Event removed", `"${deletedTitle}" has been removed from the schedule.`);
    return res.status(200).json({
      message: "Schedule event deleted",
      id: eventId,
    });
  } catch (err) {
    console.error("deleteScheduleEvent error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete schedule event",
    });
  }
}

async function downloadSchedule(req, res) {
  try {
    const { wedding, error } = await assertWedding(req);
    if (error) {
      return res.status(error.status).json({
        error: "Not Found",
        message: error.message,
      });
    }

    const { buildSchedulePdfBuffer } = require("../utils/schedulePdf");
    const pdfBuffer = await buildSchedulePdfBuffer(wedding.id);
    const safeName = String(wedding.couple_names || "wedding")
      .replace(/[^\w\-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .toLowerCase();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName || "wedding"}-schedule.pdf"`
    );
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error("downloadSchedule error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to download schedule",
    });
  }
}

module.exports = {
  listSchedule,
  getScheduleEvent,
  createScheduleEvent,
  updateScheduleEvent,
  deleteScheduleEvent,
  downloadSchedule,
};
