const crypto = require("crypto");
const { sequelize } = require("../models");
const { getWeddingForUser } = require("../utils/wedding");

async function createNotification(weddingId, type, title, message, guestId = null) {
  const id = crypto.randomUUID();
  await sequelize.query(
    `INSERT INTO notifications (id, wedding_id, guest_id, type, title, message) VALUES (?, ?, ?, ?, ?, ?);`,
    { replacements: [id, weddingId, guestId, type, title, message || null] }
  );
  return id;
}

async function listNotifications(req, res) {
  try {
    const wedding = await getWeddingForUser(req.user.id, req.user.weddingId);
    if (!wedding) {
      return res.status(404).json({ error: "Not Found", message: "No wedding found" });
    }

    const [notificationRows] = await sequelize.query(
      `SELECT id, type, title, message, is_read, created_at, guest_id
       FROM notifications
       WHERE wedding_id = ?
       ORDER BY created_at DESC
       LIMIT 100;`,
      { replacements: [wedding.id] }
    );

    const guestIds = [
      ...new Set(notificationRows.map((row) => row.guest_id).filter(Boolean)),
    ];
    let guestsById = new Map();

    if (guestIds.length > 0) {
      const [guestRows] = await sequelize.query(
        `SELECT id, full_name, whatsapp_number, rsvp_status, has_change_request
         FROM guests
         WHERE wedding_id = :weddingId AND id IN (:guestIds);`,
        {
          replacements: {
            weddingId: wedding.id,
            guestIds,
          },
        }
      );
      guestsById = new Map(guestRows.map((guest) => [guest.id, guest]));
    }

    const notifications = notificationRows.map((r) => {
      const guest = r.guest_id ? guestsById.get(r.guest_id) : null;
      return {
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message || "",
      isRead: Boolean(Number(r.is_read)),
      createdAt: r.created_at,
      guest: guest ? {
        id: guest.id,
        name: guest.full_name,
        phone: guest.whatsapp_number,
        status: String(guest.rsvp_status || "PENDING").toLowerCase(),
        requestForChange: Boolean(Number(guest.has_change_request))
      } : null
    };
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    console.error("listNotifications error:", err);
    return res.status(500).json({ error: "Internal Server Error", message: "Failed to load notifications" });
  }
}

async function markAllRead(req, res) {
  try {
    const wedding = await getWeddingForUser(req.user.id, req.user.weddingId);
    if (!wedding) {
      return res.status(404).json({ error: "Not Found", message: "No wedding found" });
    }

    await sequelize.query(
      `UPDATE notifications SET is_read = 1 WHERE wedding_id = ? AND is_read = 0;`,
      { replacements: [wedding.id] }
    );

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("markAllRead error:", err);
    return res.status(500).json({ error: "Internal Server Error", message: "Failed to mark notifications" });
  }
}

async function markOneRead(req, res) {
  try {
    const { id } = req.params;
    const wedding = await getWeddingForUser(req.user.id, req.user.weddingId);
    if (!wedding) {
      return res.status(404).json({ error: "Not Found", message: "No wedding found" });
    }

    await sequelize.query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND wedding_id = ?;`,
      { replacements: [id, wedding.id] }
    );

    return res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("markOneRead error:", err);
    return res.status(500).json({ error: "Internal Server Error", message: "Failed to mark notification" });
  }
}

async function updateNotification(req, res) {
  try {
    const { id } = req.params;
    const { title, message } = req.body;
    const wedding = await getWeddingForUser(req.user.id, req.user.weddingId);
    if (!wedding) {
      return res.status(404).json({ error: "Not Found", message: "No wedding found" });
    }

    await sequelize.query(
      `UPDATE notifications SET title = ?, message = ? WHERE id = ? AND wedding_id = ?;`,
      { replacements: [title, message, id, wedding.id] }
    );

    return res.status(200).json({ message: "Notification updated" });
  } catch (err) {
    console.error("updateNotification error:", err);
    return res.status(500).json({ error: "Internal Server Error", message: "Failed to update notification" });
  }
}

async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const wedding = await getWeddingForUser(req.user.id, req.user.weddingId);
    if (!wedding) {
      return res.status(404).json({ error: "Not Found", message: "No wedding found" });
    }

    await sequelize.query(
      `DELETE FROM notifications WHERE id = ? AND wedding_id = ?;`,
      { replacements: [id, wedding.id] }
    );

    return res.status(200).json({ message: "Notification deleted" });
  } catch (err) {
    console.error("deleteNotification error:", err);
    return res.status(500).json({ error: "Internal Server Error", message: "Failed to delete notification" });
  }
}

module.exports = { createNotification, listNotifications, markAllRead, markOneRead, updateNotification, deleteNotification };
