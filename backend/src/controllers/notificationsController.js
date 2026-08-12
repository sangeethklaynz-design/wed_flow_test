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

    const [rows] = await sequelize.query(
      `SELECT n.id, n.type, n.title, n.message, n.is_read, n.created_at,
              g.id as guest_id, g.full_name as guest_name, g.whatsapp_number as guest_phone, g.rsvp_status as guest_status, g.has_change_request as guest_request_for_change
       FROM notifications n
       LEFT JOIN guests g ON n.guest_id = g.id
       WHERE n.wedding_id = ?
       ORDER BY n.created_at DESC
       LIMIT 100;`,
      { replacements: [wedding.id] }
    );

    const notifications = rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message || "",
      isRead: Boolean(Number(r.is_read)),
      createdAt: r.created_at,
      guest: r.guest_id ? {
        id: r.guest_id,
        name: r.guest_name,
        phone: r.guest_phone,
        status: r.guest_status,
        requestForChange: Boolean(Number(r.guest_request_for_change))
      } : null
    }));

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
