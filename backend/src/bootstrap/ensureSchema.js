const { sequelize } = require("../models");
const { env } = require("../config/env");

async function columnExists(tableName, columnName) {
  const [rows] = await sequelize.query(
    `
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    LIMIT 1;
    `,
    {
      replacements: [env.DB_NAME, tableName, columnName],
    }
  );

  return rows.length > 0;
}

async function tableExists(tableName) {
  const [rows] = await sequelize.query(
    `
    SELECT 1
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
    LIMIT 1;
    `,
    {
      replacements: [env.DB_NAME, tableName],
    }
  );
  return rows.length > 0;
}

async function ensureScheduleSchema() {
  if (!(await columnExists("schedule_events", "end_time"))) {
    await sequelize.query(`
      ALTER TABLE schedule_events
      ADD COLUMN end_time TIME NULL AFTER event_time;
    `);
  }

  if (!(await columnExists("schedule_events", "special_notes"))) {
    await sequelize.query(`
      ALTER TABLE schedule_events
      ADD COLUMN special_notes VARCHAR(255) NULL AFTER location;
    `);
  }

  if (!(await columnExists("schedule_events", "notification_enabled"))) {
    await sequelize.query(`
      ALTER TABLE schedule_events
      ADD COLUMN notification_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER special_notes;
    `);
  }

  if (!(await columnExists("schedule_events", "notification_sent_at"))) {
    await sequelize.query(`
      ALTER TABLE schedule_events
      ADD COLUMN notification_sent_at TIMESTAMP NULL AFTER notification_enabled;
    `);
  }
}

async function ensureInvitationRelatedTables() {
  if (!(await tableExists("contacts"))) {
    await sequelize.query(`
      CREATE TABLE contacts (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        wedding_id VARCHAR(36) NOT NULL,
        contact_name VARCHAR(100) NOT NULL,
        contact_phone VARCHAR(20) NOT NULL,
        relation_type VARCHAR(50) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_contacts_wedding
          FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
      );
    `);
  }

  if (!(await tableExists("invitation_contacts"))) {
    await sequelize.query(`
      CREATE TABLE invitation_contacts (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        invitation_id VARCHAR(36) NOT NULL,
        contact_id VARCHAR(36) NOT NULL,
        display_order INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_invitation_contacts_invitation
          FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE,
        CONSTRAINT fk_invitation_contacts_contact
          FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
      );
    `);
  }

  if (!(await tableExists("couple_images"))) {
    await sequelize.query(`
      CREATE TABLE couple_images (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        wedding_id VARCHAR(36) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        caption VARCHAR(255) NULL,
        display_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_couple_images_wedding
          FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
      );
    `);
  }

  if (!(await tableExists("milestones"))) {
    await sequelize.query(`
      CREATE TABLE milestones (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        invitation_id VARCHAR(36) NOT NULL,
        year_or_date VARCHAR(50) NOT NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT NULL,
        display_order INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_milestones_invitation
          FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
      );
    `);
  }
}

async function ensureWeddingScheduleTemplateColumns() {
  if (!(await columnExists("weddings", "schedule_title"))) {
    await sequelize.query(`
      ALTER TABLE weddings
      ADD COLUMN schedule_title VARCHAR(150) NULL AFTER schedule_image_url;
    `);
  }

  if (!(await columnExists("weddings", "schedule_venue"))) {
    await sequelize.query(`
      ALTER TABLE weddings
      ADD COLUMN schedule_venue VARCHAR(255) NULL AFTER schedule_title;
    `);
  }

  if (!(await columnExists("weddings", "schedule_style_json"))) {
    await sequelize.query(`
      ALTER TABLE weddings
      ADD COLUMN schedule_style_json TEXT NULL AFTER schedule_venue;
    `);
  }

  if (!(await columnExists("weddings", "bride_name"))) {
    await sequelize.query(`
      ALTER TABLE weddings
      ADD COLUMN bride_name VARCHAR(100) NULL AFTER couple_names;
    `);
  }

  if (!(await columnExists("weddings", "groom_name"))) {
    await sequelize.query(`
      ALTER TABLE weddings
      ADD COLUMN groom_name VARCHAR(100) NULL AFTER bride_name;
    `);
  }
}

async function ensureInvitationTemplateColumns() {
  if (!(await columnExists("invitations", "hotel_address"))) {
    await sequelize.query(`
      ALTER TABLE invitations
      ADD COLUMN hotel_address VARCHAR(255) NULL AFTER hotel_name;
    `);
  }
}

async function ensureRsvpChangeRequestsTable() {
  if (!(await tableExists("rsvp_change_requests"))) {
    await sequelize.query(`
      CREATE TABLE rsvp_change_requests (
        id VARCHAR(36) PRIMARY KEY,
        guest_id VARCHAR(36) NOT NULL,
        wedding_id VARCHAR(36) NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rcr_guest (guest_id),
        INDEX idx_rcr_wedding (wedding_id)
      );
    `);
  }

  if (!(await columnExists("guests", "has_change_request"))) {
    await sequelize.query(`
      ALTER TABLE guests
      ADD COLUMN has_change_request TINYINT(1) NOT NULL DEFAULT 0;
    `);
  }

  if (!(await columnExists("guests", "invite_shared_at"))) {
    await sequelize.query(`
      ALTER TABLE guests
      ADD COLUMN invite_shared_at TIMESTAMP NULL DEFAULT NULL;
    `);
  }

  if (!(await columnExists("guests", "is_pinned"))) {
    await sequelize.query(`
      ALTER TABLE guests
      ADD COLUMN is_pinned TINYINT(1) NOT NULL DEFAULT 0;
    `);
  }
}

async function ensureNotificationsTable() {
  if (!(await tableExists("notifications"))) {
    await sequelize.query(`
      CREATE TABLE notifications (
        id VARCHAR(36) PRIMARY KEY,
        wedding_id VARCHAR(36) NOT NULL,
        guest_id VARCHAR(36) NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notif_wedding (wedding_id),
        INDEX idx_notif_guest (guest_id),
        INDEX idx_notif_read (wedding_id, is_read)
      );
    `);
  }

  if (!(await columnExists("notifications", "guest_id"))) {
    await sequelize.query(`
      ALTER TABLE notifications
      ADD COLUMN guest_id VARCHAR(36) NULL AFTER wedding_id,
      ADD INDEX idx_notif_guest (guest_id);
    `);
  }
}

async function ensureCoreSchema() {
  await ensureScheduleSchema();
  await ensureInvitationRelatedTables();
  await ensureWeddingScheduleTemplateColumns();
  await ensureInvitationTemplateColumns();
  await ensureRsvpChangeRequestsTable();
  await ensureNotificationsTable();
}

module.exports = { ensureCoreSchema };
