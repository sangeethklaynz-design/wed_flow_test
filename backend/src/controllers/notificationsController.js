const crypto = require("crypto");
const { sequelize } = require("../models");
const { getWeddingForUser } = require("../utils/wedding");

async function createNotification(weddingId, type, title, message) {
  const id = crypto.randomUUID();
  await sequelize.query(
    `INSERT INTO notifications (id, wedding_id, type, title, message) VALUES (?, ?, ?, ?, ?);`,
    { replacements: [id, weddingId, type, title, message || null] }
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
      `SELECT id, type, title, message, is_read, created_at
       FROM notifications
       WHERE wedding_id = ?
       ORDER BY created_at DESC
       LIMIT 50;`,
      { replacements: [wedding.id] }
    );

    const notifications = rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message || "",
      isRead: Boolean(Number(r.is_read)),
      createdAt: r.created_at,
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

module.exports = { createNotification, listNotifications, markAllRead };
