const crypto = require("crypto");
const { sequelize } = require("../models");
const { getWeddingForUser, toDateOnly } = require("../utils/wedding");
const { createNotification } = require("./notificationsController");
const {
  syncDbScheduleToTemplate,
  syncTemplateScheduleToDb,
  ensureScheduleSynced,
  inferIcon,
  formatStartEndToTemplateTime,
} = require("../utils/scheduleSync");

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

function mapEventRow(row, weddingDate, iconMap = {}) {
  const startTime = normalizeTime(row.event_time);
  const endTime = normalizeTime(row.end_time);
  const customIcon = iconMap[row.id] || iconMap[row.title];
  const icon = customIcon || inferIcon(row.title);
  const notes = row.special_notes || row.location || "";
  return {
    id: row.id,
    title: row.title,
    startTime,
    endTime,
    location: row.location || notes,
    specialNotes: notes,
    icon,
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
    ORDER BY display_order ASC, event_time ASC;
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
    location:
      body?.location === undefined
        ? undefined
        : String(body.location || "").trim(),
    icon:
      body?.icon === undefined
        ? undefined
        : String(body.icon || "").trim().toLowerCase(),
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

    await ensureScheduleSynced(wedding.id, wedding.event_id, wedding.event_type);

    let iconMap = {};
    if (wedding.event_id) {
      const [eRows] = await sequelize.query(
        `SELECT template_config FROM events WHERE id = ? LIMIT 1;`,
        { replacements: [wedding.event_id] }
      );
      try {
        const cfg = typeof eRows[0]?.template_config === "string"
          ? JSON.parse(eRows[0].template_config)
          : (eRows[0]?.template_config || {});
        const items = cfg?.fields?.scheduleItems || cfg?.fields?.agendaItems || [];
        for (const item of items) {
          if (item?.id && item?.icon) iconMap[item.id] = item.icon;
          if (item?.title && item?.icon) iconMap[item.title] = item.icon;
        }
      } catch {
        // ignore
      }
    }

    const rows = await fetchScheduleRows(wedding.id);
    return res.status(200).json({
      weddingDate: toDateOnly(wedding.wedding_date),
      events: rows.map((row) => mapEventRow(row, wedding.wedding_date, iconMap)),
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
    const eventId = crypto.randomUUID();
    const loc = payload.location || payload.specialNotes || null;
    const notes = payload.specialNotes || payload.location || null;

    await sequelize.query(
      `
      INSERT INTO schedule_events (
        id, wedding_id, event_id, event_time, end_time, title, location, special_notes,
        status, display_order, notification_enabled, notification_sent_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL);
      `,
      {
        replacements: [
          eventId,
          wedding.id,
          wedding.event_id || null,
          payload.startTime,
          payload.endTime,
          payload.title,
          loc,
          notes,
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
    const iconOverrides = payload.icon ? { [eventId]: payload.icon } : {};
    await syncDbScheduleToTemplate(wedding.id, wedding.event_id, iconOverrides);
    await createNotification(
      wedding.id,
      "schedule_added",
      "Event added",
      `"${payload.title}" has been added to the schedule.`,
      null
    );

    return res.status(201).json({
      event: mapEventRow(rows[0], wedding.wedding_date, iconOverrides),
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
      payload.specialNotes !== undefined
        ? payload.specialNotes
        : existing.special_notes || existing.location || null;
    const nextLocation =
      payload.location !== undefined
        ? payload.location
        : existing.location || nextNotes;
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

    await sequelize.query(
      `
      UPDATE schedule_events
      SET
        event_time = ?,
        end_time = ?,
        title = ?,
        location = ?,
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
          nextLocation,
          nextNotes,
          nextNotificationEnabled,
          eventId,
          wedding.id,
        ],
      }
    );

    const rows = await fetchScheduleRows(wedding.id, eventId);
    const iconOverrides = payload.icon ? { [eventId]: payload.icon } : {};
    await syncDbScheduleToTemplate(wedding.id, wedding.event_id, iconOverrides);
    await createNotification(
      wedding.id,
      "schedule_updated",
      "Event updated",
      `"${rows[0].title}" has been updated.`,
      null
    );

    return res.status(200).json({
      event: mapEventRow(rows[0], wedding.wedding_date, iconOverrides),
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

    await createNotification(
      wedding.id,
      "schedule_deleted",
      "Event removed",
      `"${deletedTitle}" has been removed from the schedule.`,
      null
    );
    await syncDbScheduleToTemplate(wedding.id, wedding.event_id);
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

/**
 * GET /api/couple/schedule/template
 * Returns the template schedule configuration (title, subtitle, notes, items)
 */
async function getScheduleTemplateConfig(req, res) {
  try {
    const { wedding, error } = await assertWedding(req);
    if (error) {
      return res.status(error.status).json({
        error: "Not Found",
        message: error.message,
      });
    }

    await ensureScheduleSynced(wedding.id, wedding.event_id, wedding.event_type);

    let templateConfig = {};
    let eventType = wedding.event_type || "wedding";
    if (wedding.event_id) {
      const [eRows] = await sequelize.query(
        `SELECT template_config, type FROM events WHERE id = ? LIMIT 1;`,
        { replacements: [wedding.event_id] }
      );
      if (eRows[0]) {
        eventType = eRows[0].type || eventType;
        try {
          templateConfig = typeof eRows[0].template_config === "string"
            ? JSON.parse(eRows[0].template_config)
            : (eRows[0].template_config || {});
        } catch {
          templateConfig = {};
        }
      }
    }

    const fields = templateConfig?.fields || {};
    const rows = await fetchScheduleRows(wedding.id);
    const isCorporate = String(eventType || "").toLowerCase() === "corporate";
    const defaultTitle = isCorporate ? "Event Agenda" : "Order of Events";
    const title =
      fields.scheduleTitle ||
      fields.agendaTitle ||
      wedding.schedule_title ||
      defaultTitle;
    const subtitle = fields.scheduleSubtitle || fields.agendaSubtitle || "";
    const notes = fields.scheduleNotes || fields.agendaNotes || "";

    const rawTemplateItems = fields.scheduleItems || fields.agendaItems || [];
    const items = rows.map((r, idx) => {
      const match =
        rawTemplateItems.find((it) => it.id === r.id || it.title === r.title) ||
        rawTemplateItems[idx];
      return {
        id: r.id,
        time: formatStartEndToTemplateTime(r.event_time, r.end_time),
        startTime: normalizeTime(r.event_time),
        endTime: normalizeTime(r.end_time),
        title: r.title,
        location: r.location || r.special_notes || "",
        icon: inferIcon(r.title, match?.icon),
      };
    });

    return res.status(200).json({
      scheduleTitle: title,
      scheduleSubtitle: subtitle,
      scheduleNotes: notes,
      items,
      eventType,
    });
  } catch (err) {
    console.error("getScheduleTemplateConfig error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load template schedule",
    });
  }
}

/**
 * PUT /api/couple/schedule/template
 * Updates the template schedule configuration (title, subtitle, notes, items)
 * and synchronizes across template_config and schedule_events
 */
async function updateScheduleTemplateConfig(req, res) {
  try {
    const { wedding, error } = await assertWedding(req);
    if (error) {
      return res.status(error.status).json({
        error: "Not Found",
        message: error.message,
      });
    }

    const { scheduleTitle, scheduleSubtitle, scheduleNotes, items } =
      req.body || {};

    if (wedding.id && scheduleTitle) {
      await sequelize.query(
        `UPDATE weddings SET schedule_title = ?, updated_at = NOW() WHERE id = ?;`,
        { replacements: [scheduleTitle, wedding.id] }
      );
    }

    if (wedding.event_id) {
      const [eRows] = await sequelize.query(
        `SELECT template_config, type FROM events WHERE id = ? LIMIT 1;`,
        { replacements: [wedding.event_id] }
      );
      let config = {};
      const eventType = eRows[0]?.type || wedding.event_type || "wedding";
      try {
        config =
          typeof eRows[0]?.template_config === "string"
            ? JSON.parse(eRows[0].template_config)
            : (eRows[0]?.template_config || {});
      } catch {
        config = {};
      }

      config.fields = { ...(config.fields || {}) };
      if (scheduleTitle !== undefined) {
        config.fields.scheduleTitle = scheduleTitle;
        config.fields.agendaTitle = scheduleTitle;
      }
      if (scheduleSubtitle !== undefined) {
        config.fields.scheduleSubtitle = scheduleSubtitle;
        config.fields.agendaSubtitle = scheduleSubtitle;
      }
      if (scheduleNotes !== undefined) {
        config.fields.scheduleNotes = scheduleNotes;
        config.fields.agendaNotes = scheduleNotes;
      }

      if (Array.isArray(items)) {
        config.fields.agendaItems = items.map((it) => ({
          time: String(it.time || "09:00 AM").trim(),
          title: String(it.title || "").trim(),
          location: String(it.location || "").trim(),
        }));
        config.fields.scheduleItems = items.map((it) => ({
          time: String(it.time || "09:00 AM").trim(),
          title: String(it.title || "").trim(),
          location: String(it.location || "").trim(),
          icon: inferIcon(it.title, it.icon),
        }));

        await sequelize.query(
          `UPDATE events SET template_config = ?, updated_at = NOW() WHERE id = ?;`,
          { replacements: [JSON.stringify(config), wedding.event_id] }
        );

        await syncTemplateScheduleToDb(
          wedding.event_id,
          wedding.id,
          items,
          eventType
        );
      } else {
        await sequelize.query(
          `UPDATE events SET template_config = ?, updated_at = NOW() WHERE id = ?;`,
          { replacements: [JSON.stringify(config), wedding.event_id] }
        );
      }
    }

    await createNotification(
      wedding.id,
      "schedule_updated",
      "Schedule customized",
      "The template schedule was customized.",
      null
    );

    const rows = await fetchScheduleRows(wedding.id);
    return res.status(200).json({
      message: "Template schedule updated successfully",
      events: rows.map((r) => mapEventRow(r, wedding.wedding_date)),
    });
  } catch (err) {
    console.error("updateScheduleTemplateConfig error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update template schedule",
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
  getScheduleTemplateConfig,
  updateScheduleTemplateConfig,
};
