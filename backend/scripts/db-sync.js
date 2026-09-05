const path = require("path");
const dotenv = require("dotenv");
const { sequelize } = require("../src/models");
const { ensureCoreSchema } = require("../src/bootstrap/ensureSchema");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function ensureBaseTables() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'COUPLE',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS weddings (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      couple_names VARCHAR(255) NOT NULL,
      bride_name VARCHAR(100) NULL,
      groom_name VARCHAR(100) NULL,
      wedding_date DATETIME NULL,
      schedule_image_url VARCHAR(500) NULL,
      schedule_title VARCHAR(150) NULL,
      schedule_venue VARCHAR(255) NULL,
      schedule_style_json TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_weddings_user_id (user_id),
      CONSTRAINT fk_weddings_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS invitations (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      wedding_id VARCHAR(36) NOT NULL,
      opening_video_url VARCHAR(500) NULL,
      special_text TEXT NULL,
      poruwa_time TIME NULL,
      hotel_name VARCHAR(255) NULL,
      hotel_address VARCHAR(255) NULL,
      google_maps_link VARCHAR(500) NULL,
      weather_note TEXT NULL,
      parking_note TEXT NULL,
      thank_you_note TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_invitations_wedding_id (wedding_id),
      CONSTRAINT fk_invitations_wedding
        FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
    );
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS schedule_events (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      wedding_id VARCHAR(36) NOT NULL,
      event_time TIME NOT NULL,
      end_time TIME NULL,
      title VARCHAR(150) NOT NULL,
      location VARCHAR(255) NULL,
      special_notes VARCHAR(255) NULL,
      status ENUM('UPCOMING','LIVE_NOW','DONE') NOT NULL DEFAULT 'UPCOMING',
      display_order INT NOT NULL DEFAULT 1,
      notification_enabled TINYINT(1) NOT NULL DEFAULT 1,
      notification_sent_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_schedule_events_wedding_id (wedding_id),
      CONSTRAINT fk_schedule_events_wedding
        FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
    );
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS guests (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      wedding_id VARCHAR(36) NOT NULL,
      full_name VARCHAR(150) NOT NULL,
      whatsapp_number VARCHAR(30) NOT NULL,
      invited_count INT NOT NULL DEFAULT 1,
      invitation_note TEXT NULL,
      table_number VARCHAR(50) NULL,
      unique_token VARCHAR(100) NOT NULL UNIQUE,
      rsvp_status ENUM('PENDING','CONFIRMED','DECLINED') NOT NULL DEFAULT 'PENDING',
      has_change_request TINYINT(1) NOT NULL DEFAULT 0,
      invite_shared_at TIMESTAMP NULL DEFAULT NULL,
      is_pinned TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_guests_wedding_id (wedding_id),
      INDEX idx_guests_unique_token (unique_token),
      CONSTRAINT fk_guests_wedding
        FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
    );
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS rsvps (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      guest_id VARCHAR(36) NOT NULL,
      attending_status ENUM('PENDING','ATTENDING','DECLINED') NOT NULL DEFAULT 'PENDING',
      attending_count INT NOT NULL DEFAULT 0,
      wishes TEXT NULL,
      submitted_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_rsvps_guest_id (guest_id),
      CONSTRAINT fk_rsvps_guest
        FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE
    );
  `);
}

async function main() {
  try {
    await sequelize.authenticate();
    await ensureBaseTables();
    await ensureCoreSchema();
    console.log("WedFlow MySQL schema synced successfully.");
    process.exit(0);
  } catch (error) {
    console.error("WedFlow MySQL sync failed.");
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close().catch(() => {});
  }
}

main();
