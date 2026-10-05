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

async function ensureEventsTable() {
  if (!(await tableExists("events"))) {
    await sequelize.query(`
      CREATE TABLE events (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        template_key VARCHAR(255) NOT NULL,
        resource_pack_id VARCHAR(36) NOT NULL,
        template_config JSON NULL,
        event_date DATE NOT NULL,
        location VARCHAR(255) NULL,
        google_maps_link TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_events_date (event_date),
        INDEX idx_events_type (type)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  }

  try {
    await sequelize.query(`
      ALTER TABLE events CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  } catch {
    // Ignore if not supported or already matching
  }

  if (!(await columnExists("events", "resource_pack_id"))) {
    await sequelize.query(`
      ALTER TABLE events
      ADD COLUMN resource_pack_id VARCHAR(36) NULL AFTER template_key;
    `);
    await sequelize.query(`
      UPDATE events
      SET resource_pack_id = id
      WHERE resource_pack_id IS NULL OR resource_pack_id = '';
    `);
  }

  if (!(await columnExists("events", "template_config"))) {
    await sequelize.query(`
      ALTER TABLE events
      ADD COLUMN template_config JSON NULL AFTER resource_pack_id;
    `);
  }

  if (!(await columnExists("events", "user_id"))) {
    await sequelize.query(`
      ALTER TABLE events
      ADD COLUMN user_id VARCHAR(36) NULL AFTER id,
      ADD INDEX idx_events_user (user_id);
    `);
  }

  if (!(await columnExists("events", "client_slug"))) {
    await sequelize.query(`
      ALTER TABLE events
      ADD COLUMN client_slug VARCHAR(255) NULL AFTER name,
      ADD INDEX idx_events_slug (client_slug);
    `);
  }

  if (!(await columnExists("events", "client_password"))) {
    await sequelize.query(`
      ALTER TABLE events
      ADD COLUMN client_password VARCHAR(255) NULL AFTER client_slug;
    `);
  }

  if (!(await columnExists("weddings", "event_id"))) {
    await sequelize.query(`
      ALTER TABLE weddings
      ADD COLUMN event_id VARCHAR(36) NULL AFTER id,
      ADD INDEX idx_weddings_event (event_id);
    `);
  }

  if (!(await columnExists("guests", "event_id"))) {
    await sequelize.query(`
      ALTER TABLE guests
      ADD COLUMN event_id VARCHAR(36) NULL AFTER wedding_id,
      ADD INDEX idx_guests_event (event_id);
    `);
  }

  if (!(await columnExists("schedule_events", "event_id"))) {
    await sequelize.query(`
      ALTER TABLE schedule_events
      ADD COLUMN event_id VARCHAR(36) NULL AFTER wedding_id,
      ADD INDEX idx_schedule_events_event (event_id);
    `);
  }

  if (!(await columnExists("notifications", "event_id"))) {
    await sequelize.query(`
      ALTER TABLE notifications
      ADD COLUMN event_id VARCHAR(36) NULL AFTER wedding_id,
      ADD INDEX idx_notifications_event (event_id);
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
  await ensureEventsTable();
}

module.exports = { ensureCoreSchema };
