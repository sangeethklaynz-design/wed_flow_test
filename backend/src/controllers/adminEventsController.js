const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { sequelize } = require("../models");
const { hashPassword } = require("../utils/password");
const {
  clientSlugFromName,
  splitEventDisplayNames,
  generateClientPassword,
} = require("../utils/clientProvisioning");
const {
  EVENT_TYPES,
  listTemplates,
  listResourcePacks,
  templateExists,
  resourcePackExists,
  ensureResourcePack,
  loadTemplateManifest,
  listPackFiles,
  resourcePackDir,
  publicResourceUrl,
} = require("../utils/eventTemplates");
const { syncTemplateScheduleToDb, inferIcon } = require("../utils/scheduleSync");

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function toDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function deriveStatus(eventDate) {
  const date = toDateOnly(eventDate);
  const today = todayDateOnly();
  if (!date) return "past";
  if (date >= today) return "ongoing";
  return "past";
}

function parseTemplateConfig(raw) {
  if (raw == null) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return {};
  }
}

function mapEventRow(row) {
  const eventDate = toDateOnly(row.event_date);
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    templateKey: row.template_key,
    resourcePackId: row.resource_pack_id || row.id,
    templateConfig: parseTemplateConfig(row.template_config),
    eventDate,
    location: row.location || null,
    googleMapsLink: row.google_maps_link || null,
    status: deriveStatus(eventDate),
    userId: row.user_id || null,
    clientSlug: row.client_slug || null,
    clientEmail: row.client_email || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseBody(body = {}) {
  const name = String(body.name || "").trim();
  const type = String(body.type || "")
    .trim()
    .toLowerCase();
  const templateKey = String(body.templateKey || body.template_key || "").trim();
  const eventDate = String(body.eventDate || body.event_date || "").trim();
  const location = String(body.location || "").trim() || null;
  const googleMapsLink =
    String(body.googleMapsLink || body.google_maps_link || "").trim() || null;
  const resourcePackId = String(
    body.resourcePackId || body.resource_pack_id || ""
  ).trim();
  const clientEmail = String(body.clientEmail || body.client_email || "")
    .trim()
    .toLowerCase();

  return {
    name,
    type,
    templateKey,
    eventDate,
    location,
    googleMapsLink,
    resourcePackId,
    clientEmail,
  };
}

function validatePayload(payload, { requireAll = true, requireClientEmail = false } = {}) {
  if (requireAll || payload.name !== undefined) {
    if (!payload.name) return "name is required";
  }
  if (requireAll || payload.type !== undefined) {
    if (!EVENT_TYPES.includes(payload.type)) {
      return `type must be one of: ${EVENT_TYPES.join(", ")}`;
    }
  }
  if (requireAll || payload.templateKey !== undefined) {
    if (!payload.templateKey) return "templateKey is required";
  }
  if (requireAll || payload.eventDate !== undefined) {
    if (!payload.eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(payload.eventDate)) {
      return "eventDate must be YYYY-MM-DD";
    }
  }
  if ((requireAll && requireClientEmail) || requireClientEmail) {
    if (!payload.clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.clientEmail)) {
      return "clientEmail is required and must be a valid email";
    }
  }
  if (payload.type && payload.templateKey) {
    if (!templateExists(payload.type, payload.templateKey)) {
      return `template "${payload.templateKey}" not found for type "${payload.type}"`;
    }
  }
  return null;
}

function validateEventDateNotPast(eventDate, { existingEventDate } = {}) {
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return "eventDate must be YYYY-MM-DD";
  }
  const today = todayDateOnly();
  if (eventDate >= today) return null;
  const existing = toDateOnly(existingEventDate);
  if (existing && existing === eventDate) return null;
  return "eventDate must be today or a future date";
}

function validatePayloadWithDate(payload, options = {}) {
  const error = validatePayload(payload, options);
  if (error) return error;
  if (payload.eventDate !== undefined) {
    return validateEventDateNotPast(payload.eventDate, {
      existingEventDate: options.existingEventDate,
    });
  }
  return null;
}

async function syncEventStaticDetailsToClient(eventId, payload) {
  const names = splitEventDisplayNames(payload.name);
  await sequelize.query(
    `
    UPDATE weddings
    SET couple_names = ?, bride_name = ?, groom_name = ?, wedding_date = ?
    WHERE event_id = ?;
    `,
    {
      replacements: [
        names.coupleNames,
        names.brideName,
        names.groomName,
        payload.eventDate,
        eventId,
      ],
    }
  );

  await sequelize.query(
    `
    UPDATE invitations i
    INNER JOIN weddings w ON w.id = i.wedding_id
    SET i.hotel_name = ?, i.google_maps_link = ?
    WHERE w.event_id = ?;
    `,
    {
      replacements: [payload.location, payload.googleMapsLink, eventId],
    }
  );
}

async function uniqueClientSlug(type, baseSlug, excludeEventId = null) {
  let slug = baseSlug || `event${Date.now()}`;
  let attempt = 0;
  while (attempt < 50) {
    const candidate = attempt === 0 ? slug : `${slug}${attempt + 1}`;
    const [rows] = await sequelize.query(
      `
      SELECT id FROM events
      WHERE type = ? AND client_slug = ?
        ${excludeEventId ? "AND id <> ?" : ""}
      LIMIT 1;
      `,
      {
        replacements: excludeEventId
          ? [type, candidate, excludeEventId]
          : [type, candidate],
      }
    );
    if (!rows[0]) return candidate;
    attempt += 1;
  }
  return `${slug}${crypto.randomUUID().slice(0, 8)}`;
}

function defaultTemplateConfig(type, templateKey) {
  const manifest = loadTemplateManifest(type, templateKey);
  if (!manifest) return { pages: {}, fields: {} };

  const pages = {};
  for (const page of manifest.pages || []) {
    pages[page.id] = page.defaultEnabled !== false;
  }

  const fields = {};
  for (const field of manifest.dynamicFields || []) {
    if (field.defaultValue !== undefined) {
      fields[field.id] = field.defaultValue;
    }
  }

  return { pages, fields };
}

async function getDashboard(req, res) {
  try {
    const today = todayDateOnly();

    const [[totals]] = await sequelize.query(
      `
      SELECT
        COUNT(*) AS ongoing_total,
        SUM(CASE WHEN type = 'wedding' THEN 1 ELSE 0 END) AS weddings,
        SUM(CASE WHEN type = 'corporate' THEN 1 ELSE 0 END) AS corporate,
        SUM(CASE WHEN type = 'party' THEN 1 ELSE 0 END) AS parties
      FROM events
      WHERE event_date >= ?;
      `,
      { replacements: [today] }
    );

    const [recentRows] = await sequelize.query(
      `
      SELECT e.*, u.email AS client_email
      FROM events e
      LEFT JOIN users u ON u.id = e.user_id
      WHERE e.event_date >= ?
      ORDER BY e.event_date ASC, e.created_at ASC
      LIMIT 10;
      `,
      { replacements: [today] }
    );

    return res.status(200).json({
      stats: {
        ongoingTotal: Number(totals?.ongoing_total || 0),
        weddings: Number(totals?.weddings || 0),
        corporate: Number(totals?.corporate || 0),
        parties: Number(totals?.parties || 0),
      },
      recentEvents: recentRows.map(mapEventRow),
    });
  } catch (err) {
    console.error("admin getDashboard error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load admin dashboard",
    });
  }
}

async function listEvents(req, res) {
  try {
    const [rows] = await sequelize.query(
      `
      SELECT e.*, u.email AS client_email
      FROM events e
      LEFT JOIN users u ON u.id = e.user_id
      ORDER BY e.event_date DESC, e.created_at DESC;
      `
    );

    return res.status(200).json({
      events: rows.map(mapEventRow),
    });
  } catch (err) {
    console.error("admin listEvents error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to list events",
    });
  }
}

async function createEvent(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const payload = parseBody(req.body);
    const error = validatePayloadWithDate(payload, {
      requireAll: true,
      requireClientEmail: true,
    });
    if (error) {
      await transaction.rollback();
      return res.status(400).json({ error: "Bad Request", message: error });
    }

    const [existingUser] = await sequelize.query(
      `SELECT id FROM users WHERE email = ? LIMIT 1;`,
      { replacements: [payload.clientEmail], transaction }
    );
    if (existingUser[0]) {
      await transaction.rollback();
      return res.status(409).json({
        error: "Conflict",
        message: "A client account with this email already exists",
      });
    }

    const id = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const weddingId = crypto.randomUUID();
    const invitationId = crypto.randomUUID();
    const baseSlug = clientSlugFromName(payload.name);
    const clientSlug = await uniqueClientSlug(payload.type, baseSlug);
    const resourcePackId = payload.resourcePackId || clientSlug || id;
    ensureResourcePack(payload.type, resourcePackId);
    const templateConfig = defaultTemplateConfig(
      payload.type,
      payload.templateKey
    );
    const plainPassword = generateClientPassword();
    const passwordHash = await hashPassword(plainPassword);
    const names = splitEventDisplayNames(payload.name);

    await sequelize.query(
      `
      INSERT INTO users (id, email, password_hash, role)
      VALUES (?, ?, ?, 'COUPLE');
      `,
      {
        replacements: [userId, payload.clientEmail, passwordHash],
        transaction,
      }
    );

    await sequelize.query(
      `
      INSERT INTO events (
        id, user_id, name, client_slug, client_password, type, template_key, resource_pack_id,
        template_config, event_date, location, google_maps_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      {
        replacements: [
          id,
          userId,
          payload.name,
          clientSlug,
          plainPassword,
          payload.type,
          payload.templateKey,
          resourcePackId,
          JSON.stringify(templateConfig),
          payload.eventDate,
          payload.location,
          payload.googleMapsLink,
        ],
        transaction,
      }
    );

    // Every client gets a weddings+invitation stub so existing dashboard APIs work;
    // corporate still uses events.type/template_key for invite rendering.
    await sequelize.query(
      `
      INSERT INTO weddings (
        id, event_id, user_id, couple_names, bride_name, groom_name, wedding_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
      {
        replacements: [
          weddingId,
          id,
          userId,
          names.coupleNames,
          names.brideName,
          names.groomName,
          payload.eventDate,
        ],
        transaction,
      }
    );

    await sequelize.query(
      `
      INSERT INTO invitations (
        id, wedding_id, hotel_name, hotel_address, google_maps_link
      ) VALUES (?, ?, ?, ?, ?);
      `,
      {
        replacements: [
          invitationId,
          weddingId,
          payload.location,
          null,
          payload.googleMapsLink,
        ],
        transaction,
      }
    );

    await transaction.commit();

    const initialSchedule =
      templateConfig.fields?.agendaItems ||
      templateConfig.fields?.scheduleItems;
    if (Array.isArray(initialSchedule) && initialSchedule.length) {
      await syncTemplateScheduleToDb(id, weddingId, initialSchedule, payload.type);
    }

    const [rows] = await sequelize.query(
      `
      SELECT e.*, u.email AS client_email
      FROM events e
      LEFT JOIN users u ON u.id = e.user_id
      WHERE e.id = ?
      LIMIT 1;
      `,
      { replacements: [id] }
    );

    return res.status(201).json({
      event: mapEventRow(rows[0]),
      credentials: {
        email: payload.clientEmail,
        password: plainPassword,
      },
    });
  } catch (err) {
    try {
      await transaction.rollback();
    } catch {
      // ignore
    }
    console.error("admin createEvent error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create event",
    });
  }
}

async function updateEvent(req, res) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) {
      return res.status(400).json({ error: "Bad Request", message: "id is required" });
    }

    const [existingRows] = await sequelize.query(
      `SELECT * FROM events WHERE id = ? LIMIT 1;`,
      { replacements: [id] }
    );
    if (!existingRows[0]) {
      return res.status(404).json({ error: "Not Found", message: "Event not found" });
    }

    const existing = mapEventRow(existingRows[0]);
    const parsed = parseBody(req.body);
    const payload = {
      name: req.body?.name !== undefined ? parsed.name : existing.name,
      type: req.body?.type !== undefined ? parsed.type : existing.type,
      templateKey:
        req.body?.templateKey !== undefined || req.body?.template_key !== undefined
          ? parsed.templateKey
          : existing.templateKey,
      eventDate:
        req.body?.eventDate !== undefined || req.body?.event_date !== undefined
          ? parsed.eventDate
          : existing.eventDate,
      location:
        req.body?.location !== undefined ? parsed.location : existing.location,
      googleMapsLink:
        req.body?.googleMapsLink !== undefined ||
        req.body?.google_maps_link !== undefined
          ? parsed.googleMapsLink
          : existing.googleMapsLink,
      resourcePackId:
        req.body?.resourcePackId !== undefined ||
        req.body?.resource_pack_id !== undefined
          ? parsed.resourcePackId || existing.resourcePackId
          : existing.resourcePackId,
    };

    const error = validatePayloadWithDate(payload, {
      requireAll: true,
      existingEventDate: existing.eventDate,
    });
    if (error) {
      return res.status(400).json({ error: "Bad Request", message: error });
    }

    if (payload.resourcePackId) {
      ensureResourcePack(payload.type, payload.resourcePackId);
    }

    await sequelize.query(
      `
      UPDATE events
      SET name = ?, type = ?, template_key = ?, resource_pack_id = ?,
          event_date = ?, location = ?, google_maps_link = ?, updated_at = NOW()
      WHERE id = ?;
      `,
      {
        replacements: [
          payload.name,
          payload.type,
          payload.templateKey,
          payload.resourcePackId,
          payload.eventDate,
          payload.location,
          payload.googleMapsLink,
          id,
        ],
      }
    );

    await syncEventStaticDetailsToClient(id, payload);

    const [rows] = await sequelize.query(
      `SELECT * FROM events WHERE id = ? LIMIT 1;`,
      { replacements: [id] }
    );

    return res.status(200).json({ event: mapEventRow(rows[0]) });
  } catch (err) {
    console.error("admin updateEvent error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update event",
    });
  }
}

async function deleteEvent(req, res) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) {
      return res.status(400).json({ error: "Bad Request", message: "id is required" });
    }

    const [existing] = await sequelize.query(
      `SELECT id, user_id FROM events WHERE id = ? LIMIT 1;`,
      { replacements: [id] }
    );
    if (!existing[0]) {
      return res.status(404).json({ error: "Not Found", message: "Event not found" });
    }

    const userId = existing[0].user_id;
    await sequelize.query(`DELETE FROM events WHERE id = ?;`, {
      replacements: [id],
    });
    if (userId) {
      await sequelize.query(`DELETE FROM users WHERE id = ?;`, {
        replacements: [userId],
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("admin deleteEvent error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete event",
    });
  }
}

async function getEventCredentials(req, res) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) {
      return res.status(400).json({ error: "Bad Request", message: "id is required" });
    }

    const [rows] = await sequelize.query(
      `
      SELECT e.id, e.name, e.type, e.client_slug, e.client_password, u.email AS client_email
      FROM events e
      LEFT JOIN users u ON u.id = e.user_id
      WHERE e.id = ?
      LIMIT 1;
      `,
      { replacements: [id] }
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Not Found", message: "Event not found" });
    }

    const password = rows[0].client_password || null;
    return res.status(200).json({
      eventId: rows[0].id,
      eventName: rows[0].name,
      eventType: rows[0].type,
      clientSlug: rows[0].client_slug,
      email: rows[0].client_email || null,
      password,
      note: password
        ? "Current client login password for this event."
        : "No stored password for this event. Generate a new password to view one.",
    });
  } catch (err) {
    console.error("admin getEventCredentials error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load credentials",
    });
  }
}

async function regenerateEventPassword(req, res) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) {
      return res.status(400).json({ error: "Bad Request", message: "id is required" });
    }

    const [rows] = await sequelize.query(
      `
      SELECT e.id, e.name, e.type, e.client_slug, e.user_id, u.email AS client_email
      FROM events e
      LEFT JOIN users u ON u.id = e.user_id
      WHERE e.id = ?
      LIMIT 1;
      `,
      { replacements: [id] }
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Not Found", message: "Event not found" });
    }
    if (!rows[0].user_id) {
      return res.status(400).json({
        error: "Bad Request",
        message: "This event has no client account",
      });
    }

    const plainPassword = generateClientPassword();
    const passwordHash = await hashPassword(plainPassword);
    await sequelize.query(`UPDATE users SET password_hash = ? WHERE id = ?;`, {
      replacements: [passwordHash, rows[0].user_id],
    });
    await sequelize.query(`UPDATE events SET client_password = ? WHERE id = ?;`, {
      replacements: [plainPassword, rows[0].id],
    });

    return res.status(200).json({
      eventId: rows[0].id,
      eventName: rows[0].name,
      eventType: rows[0].type,
      clientSlug: rows[0].client_slug,
      email: rows[0].client_email,
      password: plainPassword,
      note: "New password generated. Copy it now if needed.",
    });
  } catch (err) {
    console.error("admin regenerateEventPassword error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to regenerate password",
    });
  }
}

async function getTemplates(req, res) {
  try {
    const type = String(req.query.type || "")
      .trim()
      .toLowerCase();
    if (!EVENT_TYPES.includes(type)) {
      return res.status(400).json({
        error: "Bad Request",
        message: `type query must be one of: ${EVENT_TYPES.join(", ")}`,
      });
    }

    const packs = listResourcePacks(type);
    const [eventRows] = await sequelize.query(
      `SELECT id, name, resource_pack_id FROM events WHERE type = ?;`,
      { replacements: [type] }
    );
    const labelByPack = new Map();
    for (const row of eventRows || []) {
      const packId = String(row.resource_pack_id || row.id || "").trim();
      if (!packId) continue;
      if (!labelByPack.has(packId)) {
        labelByPack.set(packId, String(row.name || packId));
      }
    }

    return res.status(200).json({
      type,
      templates: listTemplates(type),
      resourcePacks: packs.map((id) => ({
        id,
        label: labelByPack.get(id) || id,
      })),
    });
  } catch (err) {
    console.error("admin getTemplates error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to list templates",
    });
  }
}

async function getTemplateManifest(req, res) {
  try {
    const type = String(req.params.type || "")
      .trim()
      .toLowerCase();
    const templateKey = String(req.params.templateKey || "").trim();
    if (!EVENT_TYPES.includes(type)) {
      return res.status(400).json({
        error: "Bad Request",
        message: `type must be one of: ${EVENT_TYPES.join(", ")}`,
      });
    }
    if (!templateExists(type, templateKey)) {
      return res.status(404).json({
        error: "Not Found",
        message: "Template not found",
      });
    }

    const manifest = loadTemplateManifest(type, templateKey);
    if (!manifest) {
      return res.status(404).json({
        error: "Not Found",
        message: "Template manifest not found",
      });
    }

    return res.status(200).json({ manifest });
  } catch (err) {
    console.error("admin getTemplateManifest error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load template manifest",
    });
  }
}

async function updateTemplateConfig(req, res) {
  try {
    const id = String(req.params.id || "").trim();
    const [existingRows] = await sequelize.query(
      `SELECT * FROM events WHERE id = ? LIMIT 1;`,
      { replacements: [id] }
    );
    if (!existingRows[0]) {
      return res.status(404).json({ error: "Not Found", message: "Event not found" });
    }

    const existing = mapEventRow(existingRows[0]);
    const incoming = req.body?.templateConfig || req.body || {};
    const nextConfig = {
      pages: {
        ...(existing.templateConfig.pages || {}),
        ...(incoming.pages || {}),
      },
      fields: {
        ...(existing.templateConfig.fields || {}),
        ...(incoming.fields || {}),
      },
    };

    const isCorporate =
      String(existing.type || "").toLowerCase() === "corporate";
    const incomingSchedule = isCorporate
      ? incoming.fields?.agendaItems || incoming.fields?.scheduleItems
      : incoming.fields?.scheduleItems || incoming.fields?.agendaItems;
    if (Array.isArray(incomingSchedule)) {
      nextConfig.fields.agendaItems = incomingSchedule.map((it) => ({
        time: String(it.time || "09:00 AM").trim(),
        title: String(it.title || "").trim(),
        location: String(it.location || "").trim(),
      }));
      nextConfig.fields.scheduleItems = incomingSchedule.map((it) => ({
        time: String(it.time || "09:00 AM").trim(),
        title: String(it.title || "").trim(),
        location: String(it.location || "").trim(),
        icon: inferIcon(it.title, it.icon),
      }));
    }

    if (req.body?.resourcePackId) {
      const packId = String(req.body.resourcePackId).trim();
      if (packId) {
        ensureResourcePack(existing.type, packId);
        await sequelize.query(
          `UPDATE events SET resource_pack_id = ?, template_config = ?, updated_at = NOW() WHERE id = ?;`,
          { replacements: [packId, JSON.stringify(nextConfig), id] }
        );
      }
    } else {
      await sequelize.query(
        `UPDATE events SET template_config = ?, updated_at = NOW() WHERE id = ?;`,
        { replacements: [JSON.stringify(nextConfig), id] }
      );
    }

    if (Array.isArray(incomingSchedule)) {
      await syncTemplateScheduleToDb(id, null, incomingSchedule, existing.type);
    }

    const effectivePackId = req.body?.resourcePackId || existing.resourcePackId;
    const targetVideo =
      nextConfig.fields?.openingVideo || nextConfig.fields?.landingVideo;
    const openingVideoEnabled = nextConfig.pages?.openingVideo !== false;

    if (targetVideo && effectivePackId && openingVideoEnabled) {
      const videoUrl = publicResourceUrl(
        existing.type,
        effectivePackId,
        "video",
        targetVideo
      );
      if (videoUrl) {
        try {
          await sequelize.query(
            `
            UPDATE invitations i
            JOIN weddings w ON w.id = i.wedding_id
            SET i.opening_video_url = ?
            WHERE w.event_id = ?;
            `,
            { replacements: [videoUrl, id] }
          );
        } catch {
          // non-fatal
        }
      }
    } else if (!openingVideoEnabled || !targetVideo) {
      try {
        await sequelize.query(
          `
          UPDATE invitations i
          JOIN weddings w ON w.id = i.wedding_id
          SET i.opening_video_url = NULL
          WHERE w.event_id = ?;
          `,
          { replacements: [id] }
        );
      } catch {
        // non-fatal
      }
    }

    const [rows] = await sequelize.query(
      `SELECT * FROM events WHERE id = ? LIMIT 1;`,
      { replacements: [id] }
    );

    return res.status(200).json({ event: mapEventRow(rows[0]) });
  } catch (err) {
    console.error("admin updateTemplateConfig error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update template config",
    });
  }
}

async function listEventResources(req, res) {
  try {
    const id = String(req.params.id || "").trim();
    const [existingRows] = await sequelize.query(
      `SELECT * FROM events WHERE id = ? LIMIT 1;`,
      { replacements: [id] }
    );
    if (!existingRows[0]) {
      return res.status(404).json({ error: "Not Found", message: "Event not found" });
    }

    const event = mapEventRow(existingRows[0]);
    const packOverride = String(req.query.packId || "").trim();
    const packId = packOverride || event.resourcePackId;
    ensureResourcePack(event.type, packId);

    return res.status(200).json({
      resourcePackId: packId,
      video: listPackFiles(event.type, packId, "video"),
      music: listPackFiles(event.type, packId, "music"),
      images: listPackFiles(event.type, packId, "images"),
      background: listPackFiles(event.type, packId, "background"),
      documents: listPackFiles(event.type, packId, "documents"),
    });
  } catch (err) {
    console.error("admin listEventResources error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to list resources",
    });
  }
}

const ALLOWED_KINDS = new Set([
  "video",
  "music",
  "images",
  "background",
  "documents",
]);

function makeUploadMiddleware() {
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      (async () => {
        try {
          const id = String(req.params.id || "").trim();
          const kind = String(req.params.kind || "").trim();
          if (!ALLOWED_KINDS.has(kind)) {
            return cb(new Error("Invalid resource kind"));
          }
          const [existingRows] = await sequelize.query(
            `SELECT * FROM events WHERE id = ? LIMIT 1;`,
            { replacements: [id] }
          );
          if (!existingRows[0]) {
            return cb(new Error("Event not found"));
          }
          const event = mapEventRow(existingRows[0]);
          const packRoot = ensureResourcePack(event.type, event.resourcePackId);
          const dest = path.join(packRoot, kind);
          req._uploadEvent = event;
          req._uploadKind = kind;
          cb(null, dest);
        } catch (err) {
          cb(err);
        }
      })();
    },
    filename(req, file, cb) {
      const safe = String(file.originalname || "file")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}_${safe}`);
    },
  });

  return multer({ storage, limits: { fileSize: 80 * 1024 * 1024 } }).single(
    "file"
  );
}

const uploadResourceMiddleware = makeUploadMiddleware();

async function uploadEventResource(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Bad Request",
        message: "file is required",
      });
    }

    const event = req._uploadEvent;
    const kind = req._uploadKind;
    const files = listPackFiles(event.type, event.resourcePackId, kind);
    const uploaded = files.find((f) => f.filename === req.file.filename);

    return res.status(201).json({
      file: uploaded || {
        filename: req.file.filename,
        url: null,
        sizeBytes: req.file.size || null,
        sizeLabel: null,
      },
      resources: {
        video: listPackFiles(event.type, event.resourcePackId, "video"),
        music: listPackFiles(event.type, event.resourcePackId, "music"),
        images: listPackFiles(event.type, event.resourcePackId, "images"),
        background: listPackFiles(event.type, event.resourcePackId, "background"),
        documents: listPackFiles(event.type, event.resourcePackId, "documents"),
      },
    });
  } catch (err) {
    console.error("admin uploadEventResource error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to upload resource",
    });
  }
}

async function deleteEventResource(req, res) {
  try {
    const id = String(req.params.id || "").trim();
    const kind = String(req.params.kind || "").trim();
    const filename = String(req.params.filename || "").trim();
    if (!ALLOWED_KINDS.has(kind) || !filename) {
      return res.status(400).json({ error: "Bad Request", message: "Invalid path" });
    }

    const [existingRows] = await sequelize.query(
      `SELECT * FROM events WHERE id = ? LIMIT 1;`,
      { replacements: [id] }
    );
    if (!existingRows[0]) {
      return res.status(404).json({ error: "Not Found", message: "Event not found" });
    }

    const event = mapEventRow(existingRows[0]);
    const packRoot = resourcePackDir(event.type, event.resourcePackId);
    const full = path.join(packRoot, kind, filename);
    if (!full.startsWith(packRoot) || !fs.existsSync(full)) {
      return res.status(404).json({ error: "Not Found", message: "File not found" });
    }

    fs.unlinkSync(full);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("admin deleteEventResource error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete resource",
    });
  }
}

module.exports = {
  getDashboard,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventCredentials,
  regenerateEventPassword,
  getTemplates,
  getTemplateManifest,
  updateTemplateConfig,
  listEventResources,
  uploadResourceMiddleware,
  uploadEventResource,
  deleteEventResource,
};
