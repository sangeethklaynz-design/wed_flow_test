const crypto = require("crypto");
const { sequelize } = require("../models");

function parse12or24TimeToMinutes(raw) {
  if (!raw) return null;
  const str = String(raw).trim().toLowerCase();
  // Match e.g. "09:30 am", "9.30am", "9:30", "14:00", "9 am", "12:00am"
  const m = str.match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let hours = parseInt(m[1], 10);
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = m[3] ? m[3].toLowerCase() : null;

  if (ampm === "pm" && hours < 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function minutesTo24(minutes) {
  if (minutes == null) return null;
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

function minutesTo12(minutes) {
  if (minutes == null) return "";
  let h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function normalizeTimeString(val) {
  if (!val) return null;
  const str = String(val).trim();
  return str.length >= 5 ? str.slice(0, 5) : str;
}

/**
 * Parses e.g. "09:00 AM - 10:00 AM", "09:00 AM", "06:00 PM Onwards", "14:00 - 15:30"
 * Returns { startTime: "HH:mm:00", endTime: "HH:mm:00" }
 */
function parseTimeRangeToStartEnd(timeStr, nextTimeStr = null, defaultDurationMinutes = 60) {
  if (!timeStr) {
    return { startTime: "09:00:00", endTime: "10:00:00" };
  }

  const clean = String(timeStr).replace(/onwards/i, "").trim();
  const parts = clean.split(/\s*(?:-|–|—|to)\s*/i);

  const startMin = parse12or24TimeToMinutes(parts[0]);
  if (startMin == null) {
    return { startTime: "09:00:00", endTime: "10:00:00" };
  }

  let endMin = parts[1] ? parse12or24TimeToMinutes(parts[1]) : null;
  if (endMin == null) {
    if (nextTimeStr) {
      const nextClean = String(nextTimeStr).replace(/onwards/i, "").trim();
      const nextParts = nextClean.split(/\s*(?:-|–|—|to)\s*/i);
      const nextStartMin = parse12or24TimeToMinutes(nextParts[0]);
      if (nextStartMin != null && nextStartMin > startMin) {
        endMin = nextStartMin;
      }
    }
  }

  if (endMin == null || endMin <= startMin) {
    endMin = Math.min(startMin + defaultDurationMinutes, 23 * 60 + 59);
  }

  return {
    startTime: minutesTo24(startMin),
    endTime: minutesTo24(endMin),
  };
}

/**
 * Formats "09:00:00", "10:00:00" -> "09:00 AM - 10:00 AM" or "09:00 AM"
 */
function formatStartEndToTemplateTime(eventTime, endTime) {
  const normStart = normalizeTimeString(eventTime);
  const startMin = parse12or24TimeToMinutes(normStart);
  if (startMin == null) return "09:00 AM";
  const startStr = minutesTo12(startMin);

  const normEnd = normalizeTimeString(endTime);
  if (!normEnd) return startStr;
  const endMin = parse12or24TimeToMinutes(normEnd);
  if (endMin == null || endMin === startMin) return startStr;
  const endStr = minutesTo12(endMin);
  return `${startStr} - ${endStr}`;
}

const ICON_KEYWORDS = [
  { icon: "drink", words: ["drink", "cocktail", "arrival", "welcome drink", "beverage", "bar", "cheers"] },
  { icon: "mic", words: ["speech", "remark", "welcome", "keynote", "announcement", "closing", "host", "presentation", "session"] },
  { icon: "food", words: ["food", "dinner", "lunch", "tea", "buffet", "breakfast", "meal", "cake", "snack", "dining", "feast"] },
  { icon: "music", words: ["music", "band", "song", "orchestra", "acoustic", "singing", "live", "performance", "concert"] },
  { icon: "dj", words: ["dj", "dance", "party", "floor", "disco", "rave", "after party"] },
  { icon: "celebrate", words: ["celebrate", "game", "activity", "award", "toast", "photo", "gift", "ceremony"] },
];

function inferIcon(title, existingIcon = null) {
  if (existingIcon && ["drink", "mic", "food", "music", "celebrate", "dj"].includes(existingIcon)) {
    return existingIcon;
  }
  const lower = String(title || "").toLowerCase();
  for (const { icon, words } of ICON_KEYWORDS) {
    if (words.some((w) => lower.includes(w))) {
      return icon;
    }
  }
  return "celebrate";
}

/**
 * Maps DB schedule_events rows to template items
 */
function dbRowsToTemplateItems(rows) {
  return (rows || []).map((row, idx) => {
    const time = formatStartEndToTemplateTime(row.event_time, row.end_time);
    const location = row.location || row.special_notes || "";
    const icon = inferIcon(row.title);
    return {
      id: row.id || `item-${idx + 1}`,
      time,
      title: row.title || `Event ${idx + 1}`,
      location,
      icon,
    };
  });
}

/**
 * Synchronizes DB schedule_events mutations into events.template_config
 */
async function syncDbScheduleToTemplate(weddingId, eventId = null, iconOverrides = {}) {
  try {
    if (!weddingId && !eventId) return;

    // Resolve eventId and weddingId if only one is provided
    let resolvedWeddingId = weddingId;
    let resolvedEventId = eventId;

    if (!resolvedEventId && resolvedWeddingId) {
      const [wRows] = await sequelize.query(
        `SELECT event_id FROM weddings WHERE id = ? LIMIT 1;`,
        { replacements: [resolvedWeddingId] }
      );
      resolvedEventId = wRows[0]?.event_id || null;
    }

    if (!resolvedWeddingId && resolvedEventId) {
      const [wRows] = await sequelize.query(
        `SELECT id FROM weddings WHERE event_id = ? LIMIT 1;`,
        { replacements: [resolvedEventId] }
      );
      resolvedWeddingId = wRows[0]?.id || null;
    }

    if (!resolvedWeddingId) return;

    // Fetch existing config items to preserve custom icons
    let existingItems = [];
    let config = {};
    if (resolvedEventId) {
      const [evRows] = await sequelize.query(
        `SELECT template_config FROM events WHERE id = ? LIMIT 1;`,
        { replacements: [resolvedEventId] }
      );
      try {
        config = typeof evRows[0]?.template_config === "string"
          ? JSON.parse(evRows[0].template_config)
          : (evRows[0]?.template_config || {});
        existingItems = Array.isArray(config?.fields?.scheduleItems)
          ? config.fields.scheduleItems
          : Array.isArray(config?.fields?.agendaItems)
            ? config.fields.agendaItems
            : [];
      } catch {
        config = {};
        existingItems = [];
      }
    }

    // Fetch current schedule rows from DB
    const [rows] = await sequelize.query(
      `
      SELECT id, event_time, end_time, title, location, special_notes, display_order
      FROM schedule_events
      WHERE wedding_id = ?
      ORDER BY display_order ASC, event_time ASC;
      `,
      { replacements: [resolvedWeddingId] }
    );

    const agendaItems = rows.map((r) => ({
      time: formatStartEndToTemplateTime(r.event_time, r.end_time),
      title: r.title,
      location: r.location || r.special_notes || "",
    }));

    const scheduleItems = rows.map((r, idx) => {
      const match =
        existingItems.find((it) => it.id === r.id || it.title === r.title) ||
        existingItems[idx];
      const customIcon =
        (iconOverrides && (iconOverrides[r.id] || iconOverrides[r.title])) ||
        match?.icon;
      return {
        id: r.id,
        time: formatStartEndToTemplateTime(r.event_time, r.end_time),
        title: r.title,
        location: r.location || r.special_notes || "",
        icon: inferIcon(r.title, customIcon),
      };
    });

    if (resolvedEventId) {
      config.fields = {
        ...(config.fields || {}),
        agendaItems,
        scheduleItems,
      };

      await sequelize.query(
        `UPDATE events SET template_config = ?, updated_at = NOW() WHERE id = ?;`,
        { replacements: [JSON.stringify(config), resolvedEventId] }
      );
    }
  } catch (err) {
    console.error("syncDbScheduleToTemplate error:", err);
  }
}

/**
 * Synchronizes template items (from Admin panel or defaults) into DB schedule_events
 */
async function syncTemplateScheduleToDb(eventId, weddingId, rawItems, eventType = null) {
  try {
    let resolvedWeddingId = weddingId;
    let resolvedEventId = eventId;

    if (!resolvedWeddingId && resolvedEventId) {
      const [wRows] = await sequelize.query(
        `SELECT id FROM weddings WHERE event_id = ? LIMIT 1;`,
        { replacements: [resolvedEventId] }
      );
      resolvedWeddingId = wRows[0]?.id || null;
    }

    if (!resolvedEventId && resolvedWeddingId) {
      const [wRows] = await sequelize.query(
        `SELECT event_id FROM weddings WHERE id = ? LIMIT 1;`,
        { replacements: [resolvedWeddingId] }
      );
      resolvedEventId = wRows[0]?.event_id || null;
    }

    if (!resolvedWeddingId) return;

    const items = Array.isArray(rawItems) ? rawItems : [];
    if (!items.length) {
      // If template cleared all items, clear DB schedule
      await sequelize.query(
        `DELETE FROM schedule_events WHERE wedding_id = ?;`,
        { replacements: [resolvedWeddingId] }
      );
      return;
    }

    // Replace all schedule rows for this wedding with parsed items
    await sequelize.query(
      `DELETE FROM schedule_events WHERE wedding_id = ?;`,
      { replacements: [resolvedWeddingId] }
    );

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const title = String(item.title || `Session ${i + 1}`).trim();
      const location = String(item.location || "").trim() || null;
      const nextItem = items[i + 1];
      const { startTime, endTime } = parseTimeRangeToStartEnd(
        item.time,
        nextItem ? nextItem.time : null
      );
      const rowId = crypto.randomUUID();

      await sequelize.query(
        `
        INSERT INTO schedule_events (
          id, wedding_id, event_id, event_time, end_time, title, location, special_notes,
          status, display_order, notification_enabled, notification_sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UPCOMING', ?, 1, NULL);
        `,
        {
          replacements: [
            rowId,
            resolvedWeddingId,
            resolvedEventId,
            startTime,
            endTime,
            title,
            location,
            location,
            i + 1,
          ],
        }
      );
    }

    // Also ensure both agendaItems and scheduleItems are synchronized in events.template_config
    if (resolvedEventId) {
      const [evRows] = await sequelize.query(
        `SELECT template_config FROM events WHERE id = ? LIMIT 1;`,
        { replacements: [resolvedEventId] }
      );

      let config = {};
      try {
        config = typeof evRows[0]?.template_config === "string"
          ? JSON.parse(evRows[0].template_config)
          : (evRows[0]?.template_config || {});
      } catch {
        config = {};
      }

      const agendaItems = items.map((it) => ({
        time: String(it.time || "09:00 AM").trim(),
        title: String(it.title || "").trim(),
        location: String(it.location || "").trim(),
      }));

      const scheduleItems = items.map((it) => ({
        time: String(it.time || "09:00 AM").trim(),
        title: String(it.title || "").trim(),
        location: String(it.location || "").trim(),
        icon: inferIcon(it.title, it.icon),
      }));

      config.fields = {
        ...(config.fields || {}),
        agendaItems,
        scheduleItems,
      };

      await sequelize.query(
        `UPDATE events SET template_config = ?, updated_at = NOW() WHERE id = ?;`,
        { replacements: [JSON.stringify(config), resolvedEventId] }
      );
    }
  } catch (err) {
    console.error("syncTemplateScheduleToDb error:", err);
  }
}

const DEFAULT_SCHEDULE_BY_TYPE = {
  corporate: [
    { time: "09:00 AM", title: "Registration & Welcome Tea", location: "Ocean View Lobby" },
    { time: "09:30 AM", title: "Opening Remarks", location: "Grand Ballroom" },
    { time: "10:00 AM", title: "Keynote Session", location: "The Future of Business" },
    { time: "11:30 AM", title: "Panel Discussion", location: "Industry Trends" },
    { time: "01:00 PM", title: "Networking Lunch", location: "Sapphire Lawn" },
    { time: "02:30 PM", title: "Breakout Sessions", location: "Multiple Rooms" },
    { time: "04:00 PM", title: "Closing Ceremony", location: "Main Ballroom" },
    { time: "05:00 PM", title: "Cocktail & Networking", location: "Garden View" },
  ],
  party: [
    { time: "06:00 PM", title: "Guest Arrival & Welcome Drinks", icon: "drink" },
    { time: "06:30 PM", title: "Opening & Welcome", icon: "mic" },
    { time: "07:00 PM", title: "Dinner Service", icon: "food" },
    { time: "08:30 PM", title: "Live Music & Entertainment", icon: "music" },
    { time: "09:30 PM", title: "Games & Activities", icon: "celebrate" },
    { time: "10:30 PM", title: "DJ Night & Dance", icon: "dj" },
  ],
  wedding: [
    { time: "04:00 PM - 05:00 PM", title: "Ceremony", location: "Venue Lawn" },
    { time: "06:00 PM - 10:00 PM", title: "Reception", location: "Grand Ballroom" },
  ],
};

/**
 * Checks and ensures schedule is synchronized between DB and template_config.
 * If DB is empty but template has items -> seeds DB from template.
 * If DB has rows -> ensures template_config matches DB.
 */
async function ensureScheduleSynced(weddingId, eventId = null, eventType = null) {
  try {
    let resolvedWeddingId = weddingId;
    let resolvedEventId = eventId;

    if (!resolvedEventId && resolvedWeddingId) {
      const [wRows] = await sequelize.query(
        `SELECT event_id, user_id FROM weddings WHERE id = ? LIMIT 1;`,
        { replacements: [resolvedWeddingId] }
      );
      resolvedEventId = wRows[0]?.event_id || null;
      if (!resolvedEventId && wRows[0]?.user_id) {
        const [evUser] = await sequelize.query(
          `SELECT id, type FROM events WHERE user_id = ? LIMIT 1;`,
          { replacements: [wRows[0].user_id] }
        );
        if (evUser[0]?.id) {
          resolvedEventId = evUser[0].id;
          if (!eventType) eventType = evUser[0].type;
          await sequelize.query(
            `UPDATE weddings SET event_id = ? WHERE id = ?;`,
            { replacements: [resolvedEventId, resolvedWeddingId] }
          );
        }
      }
    }

    if (!resolvedWeddingId && resolvedEventId) {
      const [wRows] = await sequelize.query(
        `SELECT id FROM weddings WHERE event_id = ? LIMIT 1;`,
        { replacements: [resolvedEventId] }
      );
      resolvedWeddingId = wRows[0]?.id || null;
    }

    if (!resolvedWeddingId) return;

    // Check DB rows
    const [dbRows] = await sequelize.query(
      `
      SELECT id, event_time, end_time, title, location, special_notes, display_order
      FROM schedule_events
      WHERE wedding_id = ?
      ORDER BY display_order ASC, event_time ASC;
      `,
      { replacements: [resolvedWeddingId] }
    );

    // Check template_config
    let templateItems = null;
    let config = null;
    if (resolvedEventId) {
      const [evRows] = await sequelize.query(
        `SELECT type, template_config FROM events WHERE id = ? LIMIT 1;`,
        { replacements: [resolvedEventId] }
      );
      if (evRows[0]) {
        if (!eventType) eventType = evRows[0].type;
        try {
          config = typeof evRows[0].template_config === "string"
            ? JSON.parse(evRows[0].template_config)
            : evRows[0].template_config;
        } catch {
          config = null;
        }
        if (config?.fields) {
          templateItems =
            (Array.isArray(config.fields.agendaItems) && config.fields.agendaItems.length ? config.fields.agendaItems : null) ||
            (Array.isArray(config.fields.scheduleItems) && config.fields.scheduleItems.length ? config.fields.scheduleItems : null);
        }
      }
    }

    if (dbRows.length === 0 && templateItems && templateItems.length > 0) {
      // Seed DB from template
      await syncTemplateScheduleToDb(resolvedEventId, resolvedWeddingId, templateItems, eventType);
    } else if (dbRows.length === 0 && (!templateItems || templateItems.length === 0)) {
      // Seed both from default manifest items
      const fallback = DEFAULT_SCHEDULE_BY_TYPE[String(eventType || "wedding").toLowerCase()] || DEFAULT_SCHEDULE_BY_TYPE.wedding;
      await syncTemplateScheduleToDb(resolvedEventId, resolvedWeddingId, fallback, eventType);
    } else if (dbRows.length > 0) {
      // Ensure template_config has DB items
      await syncDbScheduleToTemplate(resolvedWeddingId, resolvedEventId);
    }
  } catch (err) {
    console.error("ensureScheduleSynced error:", err);
  }
}

module.exports = {
  parse12or24TimeToMinutes,
  minutesTo24,
  minutesTo12,
  parseTimeRangeToStartEnd,
  formatStartEndToTemplateTime,
  inferIcon,
  dbRowsToTemplateItems,
  syncDbScheduleToTemplate,
  syncTemplateScheduleToDb,
  ensureScheduleSynced,
};
