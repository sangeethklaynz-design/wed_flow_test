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

  if (!(await columnExists("guests", "source"))) {
    await sequelize.query(`
      ALTER TABLE guests
      ADD COLUMN source ENUM('manual','public') NOT NULL DEFAULT 'manual' AFTER unique_token;
    `);
  }

  if (!(await columnExists("guests", "payment_due_at"))) {
    await sequelize.query(`
      ALTER TABLE guests
      ADD COLUMN payment_due_at DATETIME NULL DEFAULT NULL AFTER invite_shared_at;
    `);
  }

  if (!(await columnExists("guests", "organization_id"))) {
    await sequelize.query(`
      ALTER TABLE guests
      ADD COLUMN organization_id VARCHAR(36) NULL AFTER event_id,
      ADD INDEX idx_guests_organization (organization_id);
    `);
  }

  if (!(await columnExists("guests", "email"))) {
    await sequelize.query(`
      ALTER TABLE guests
      ADD COLUMN email VARCHAR(255) NULL AFTER whatsapp_number;
    `);
  }

  if (!(await columnExists("guests", "id_number"))) {
    await sequelize.query(`
      ALTER TABLE guests
      ADD COLUMN id_number VARCHAR(64) NULL AFTER email;
    `);
  }

  await ensureGuestRsvpStatusEnum();
}

/**
 * Expand guests.rsvp_status for ticketing lifecycle:
 * PENDING → REGISTERED → PAYMENT_PENDING → CONFIRMED (or DECLINED).
 */
async function ensureGuestRsvpStatusEnum() {
  if (!(await tableExists("guests")) || !(await columnExists("guests", "rsvp_status"))) {
    return;
  }

  const [rows] = await sequelize.query(
    `
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'guests'
      AND COLUMN_NAME = 'rsvp_status'
    LIMIT 1;
    `,
    { replacements: [env.DB_NAME] }
  );

  const columnType = String(rows[0]?.COLUMN_TYPE || "").toLowerCase();
  if (!columnType.startsWith("enum(")) return;

  const needed = ["registered", "payment_pending"];
  const missing = needed.filter((value) => !columnType.includes(`'${value}'`));
  if (!missing.length) return;

  await sequelize.query(`
    ALTER TABLE guests
    MODIFY COLUMN rsvp_status
      ENUM('PENDING','REGISTERED','PAYMENT_PENDING','CONFIRMED','DECLINED')
      NOT NULL DEFAULT 'PENDING';
  `);
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
        payment_link TEXT NULL,
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

  if (!(await columnExists("events", "payment_link"))) {
    await sequelize.query(`
      ALTER TABLE events
      ADD COLUMN payment_link TEXT NULL AFTER google_maps_link;
    `);
  }

  if (!(await columnExists("events", "ticketing_enabled"))) {
    await sequelize.query(`
      ALTER TABLE events
      ADD COLUMN ticketing_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER payment_link;
    `);
  }

  if (!(await columnExists("events", "is_ticketing_enabled"))) {
    await sequelize.query(`
      ALTER TABLE events
      ADD COLUMN is_ticketing_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER ticketing_enabled;
    `);
    // Bridge: copy existing ticketing_enabled into the UI/controller column
    await sequelize.query(`
      UPDATE events
      SET is_ticketing_enabled = ticketing_enabled
      WHERE is_ticketing_enabled = 0 AND ticketing_enabled = 1;
    `);
  }

  if (!(await columnExists("events", "total_ticket_limit"))) {
    await sequelize.query(`
      ALTER TABLE events
      ADD COLUMN total_ticket_limit INT NOT NULL DEFAULT 1000 AFTER is_ticketing_enabled;
    `);
  }

  if (!(await columnExists("events", "free_ticket_allocation"))) {
    await sequelize.query(`
      ALTER TABLE events
      ADD COLUMN free_ticket_allocation INT NOT NULL DEFAULT 50 AFTER total_ticket_limit;
    `);
  }

  if (!(await columnExists("events", "public_invite_enabled"))) {
    await sequelize.query(`
      ALTER TABLE events
      ADD COLUMN public_invite_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER free_ticket_allocation;
    `);
  }

  if (!(await columnExists("events", "public_invite_token"))) {
    await sequelize.query(`
      ALTER TABLE events
      ADD COLUMN public_invite_token VARCHAR(64) NULL AFTER public_invite_enabled,
      ADD UNIQUE INDEX uq_events_public_invite_token (public_invite_token);
    `);
  }
}

async function ensureTicketingTables() {
  if (!(await tableExists("ticket_types"))) {
    await sequelize.query(`
      CREATE TABLE ticket_types (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        description TEXT NULL,
        quantity INT NULL,
        display_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ticket_types_event (event_id),
        CONSTRAINT fk_ticket_types_event
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  }

  if (!(await tableExists("ticket_tiers"))) {
    await sequelize.query(`
      CREATE TABLE ticket_tiers (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'LKR',
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ticket_tiers_event (event_id),
        INDEX idx_ticket_tiers_event_active (event_id, is_active)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  }

  if (!(await tableExists("ticket_orders"))) {
    await sequelize.query(`
      CREATE TABLE ticket_orders (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        guest_id VARCHAR(36) NULL,
        buyer_name VARCHAR(255) NULL,
        buyer_contact VARCHAR(255) NULL,
        payment_provider VARCHAR(50) NOT NULL DEFAULT 'google_pay',
        payment_ref VARCHAR(255) NULL,
        payment_status ENUM('pending','paid','failed') NOT NULL DEFAULT 'pending',
        amount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
        currency VARCHAR(3) NOT NULL DEFAULT 'LKR',
        checkout_items JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ticket_orders_event (event_id),
        INDEX idx_ticket_orders_guest (guest_id),
        INDEX idx_ticket_orders_payment_ref (event_id, payment_ref)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  }

  if (
    (await tableExists("ticket_orders")) &&
    !(await columnExists("ticket_orders", "checkout_items"))
  ) {
    await sequelize.query(`
      ALTER TABLE ticket_orders
      ADD COLUMN checkout_items JSON NULL AFTER currency;
    `);
  }

  if (
    (await tableExists("ticket_orders")) &&
    !(await columnExists("ticket_orders", "stripe_checkout_session_id"))
  ) {
    await sequelize.query(`
      ALTER TABLE ticket_orders
      ADD COLUMN stripe_checkout_session_id VARCHAR(255) NULL AFTER checkout_items;
    `);
    await sequelize.query(`
      CREATE UNIQUE INDEX uq_ticket_orders_stripe_session
      ON ticket_orders (stripe_checkout_session_id);
    `);
  }

  if (
    (await tableExists("ticket_orders")) &&
    !(await columnExists("ticket_orders", "expires_at"))
  ) {
    await sequelize.query(`
      ALTER TABLE ticket_orders
      ADD COLUMN expires_at DATETIME NULL AFTER stripe_checkout_session_id,
      ADD INDEX idx_ticket_orders_expires (payment_status, expires_at);
    `);
  }

  // Expand payment_status to include expired holds (safe no-op if already present)
  if (await tableExists("ticket_orders")) {
    try {
      await sequelize.query(`
        ALTER TABLE ticket_orders
        MODIFY COLUMN payment_status
          ENUM('pending','paid','failed','expired') NOT NULL DEFAULT 'pending';
      `);
    } catch {
      // ignore if dialect/version already matches
    }
  }

  if (!(await tableExists("tickets"))) {
    await sequelize.query(`
      CREATE TABLE tickets (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        order_id VARCHAR(36) NOT NULL,
        tier_id VARCHAR(36) NOT NULL,
        guest_id VARCHAR(36) NULL,
        -- QR CODE
        ticket_code VARCHAR(64) NOT NULL,
        tier_name VARCHAR(255) NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'LKR',
        status ENUM('valid','invalid') NOT NULL DEFAULT 'valid',
        issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        invalidated_at TIMESTAMP NULL,
        invalidated_by VARCHAR(36) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_tickets_code (ticket_code),
        INDEX idx_tickets_event (event_id),
        INDEX idx_tickets_order (order_id),
        INDEX idx_tickets_event_status (event_id, status)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  }
}

async function ensureStripeConnectColumns() {
  if (!(await tableExists("users"))) return;

  if (!(await columnExists("users", "stripe_account_id"))) {
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN stripe_account_id VARCHAR(255) NULL AFTER role,
      ADD INDEX idx_users_stripe_account (stripe_account_id);
    `);
  }

  if (!(await columnExists("users", "stripe_charges_enabled"))) {
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN stripe_charges_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER stripe_account_id;
    `);
  }

  if (!(await columnExists("users", "stripe_details_submitted"))) {
    await sequelize.query(`
      ALTER TABLE users
      ADD COLUMN stripe_details_submitted TINYINT(1) NOT NULL DEFAULT 0 AFTER stripe_charges_enabled;
    `);
  }
}

async function ensureUsersRoleEnum() {
  if (!(await tableExists("users")) || !(await columnExists("users", "role"))) {
    return;
  }

  const [rows] = await sequelize.query(
    `
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'role'
    LIMIT 1;
    `,
    { replacements: [env.DB_NAME] }
  );

  const columnType = String(rows[0]?.COLUMN_TYPE || "").toLowerCase();
  if (!columnType.startsWith("enum(")) return;

  const needed = ["admin", "couple", "client", "staff"];
  const missing = needed.filter((value) => !columnType.includes(`'${value}'`));
  if (!missing.length) return;

  await sequelize.query(`
    ALTER TABLE users
    MODIFY COLUMN role ENUM('ADMIN','COUPLE','CLIENT','STAFF') NOT NULL DEFAULT 'COUPLE';
  `);
}

async function ensureOrgRbacSchema() {
  await ensureUsersRoleEnum();

  if (!(await tableExists("organizations"))) {
    await sequelize.query(`
      CREATE TABLE organizations (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type ENUM('vendor','standalone') NOT NULL DEFAULT 'standalone',
        owner_user_id VARCHAR(36) NULL,
        max_staff_accounts INT NOT NULL DEFAULT 5,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_organizations_type (type),
        INDEX idx_organizations_owner (owner_user_id)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  }

  if (!(await tableExists("role_permissions"))) {
    await sequelize.query(`
      CREATE TABLE role_permissions (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        organization_id VARCHAR(36) NOT NULL,
        \`key\` VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        locked TINYINT(1) NOT NULL DEFAULT 0,
        permissions JSON NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_role_permissions_org_key (organization_id, \`key\`),
        INDEX idx_role_permissions_org (organization_id)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  }

  if (await tableExists("users")) {
    if (!(await columnExists("users", "organization_id"))) {
      await sequelize.query(`
        ALTER TABLE users
        ADD COLUMN organization_id VARCHAR(36) NULL AFTER role,
        ADD INDEX idx_users_organization (organization_id);
      `);
    }
    if (!(await columnExists("users", "permission_role_id"))) {
      await sequelize.query(`
        ALTER TABLE users
        ADD COLUMN permission_role_id VARCHAR(36) NULL AFTER organization_id;
      `);
    }
    if (!(await columnExists("users", "is_org_owner"))) {
      await sequelize.query(`
        ALTER TABLE users
        ADD COLUMN is_org_owner TINYINT(1) NOT NULL DEFAULT 0 AFTER permission_role_id;
      `);
    }
    if (!(await columnExists("users", "login_username"))) {
      await sequelize.query(`
        ALTER TABLE users
        ADD COLUMN login_username VARCHAR(255) NULL AFTER email,
        ADD UNIQUE INDEX uq_users_login_username (login_username);
      `);
    }
    if (!(await columnExists("users", "is_active"))) {
      await sequelize.query(`
        ALTER TABLE users
        ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER is_org_owner;
      `);
    }
  }

  if (
    (await tableExists("events")) &&
    !(await columnExists("events", "organization_id"))
  ) {
    await sequelize.query(`
      ALTER TABLE events
      ADD COLUMN organization_id VARCHAR(36) NULL AFTER user_id,
      ADD INDEX idx_events_organization (organization_id);
    `);
  }

  await backfillOrganizationsFromEvents();
}

async function backfillOrganizationsFromEvents() {
  if (!(await tableExists("events")) || !(await tableExists("organizations"))) {
    return;
  }
  if (!(await columnExists("events", "organization_id"))) return;

  const { seedRolesForOrganization, getRoleByKey } = require("../services/orgRoles");
  const crypto = require("crypto");

  const [events] = await sequelize.query(`
    SELECT id, user_id, name, type
    FROM events
    WHERE organization_id IS NULL AND user_id IS NOT NULL
    ORDER BY created_at ASC;
  `);

  const userOrg = new Map();

  for (const event of events) {
    let orgId = userOrg.get(event.user_id);
    if (!orgId) {
      const [existing] = await sequelize.query(
        `
        SELECT id FROM organizations WHERE owner_user_id = ? LIMIT 1;
        `,
        { replacements: [event.user_id] }
      );
      if (existing[0]) {
        orgId = existing[0].id;
      } else {
        orgId = crypto.randomUUID();
        const orgType =
          String(event.type || "").toLowerCase() === "wedding"
            ? "standalone"
            : "vendor";
        await sequelize.query(
          `
          INSERT INTO organizations (id, name, type, owner_user_id, max_staff_accounts)
          VALUES (?, ?, ?, ?, 5);
          `,
          {
            replacements: [
              orgId,
              event.name || "Organization",
              orgType,
              event.user_id,
            ],
          }
        );
        await seedRolesForOrganization(orgId);
        const adminRole = await getRoleByKey(orgId, "admin");
        await sequelize.query(
          `
          UPDATE users
          SET organization_id = ?,
              is_org_owner = 1,
              permission_role_id = ?,
              role = 'CLIENT'
          WHERE id = ?;
          `,
          {
            replacements: [orgId, adminRole?.id || null, event.user_id],
          }
        );
      }
      userOrg.set(event.user_id, orgId);
    }

    await sequelize.query(
      `UPDATE events SET organization_id = ? WHERE id = ?;`,
      { replacements: [orgId, event.id] }
    );
  }

  // Migrate remaining COUPLE owners that somehow have org but old role
  await sequelize.query(`
    UPDATE users
    SET role = 'CLIENT'
    WHERE role = 'COUPLE' AND organization_id IS NOT NULL;
  `);
}

async function backfillGuestOrgAndEvent() {
  if (!(await tableExists("guests"))) return;

  // Link guests.event_id from wedding when missing
  if (await columnExists("guests", "event_id")) {
    await sequelize.query(`
      UPDATE guests g
      INNER JOIN weddings w ON w.id = g.wedding_id
      SET g.event_id = w.event_id
      WHERE g.event_id IS NULL AND w.event_id IS NOT NULL;
    `);
  }

  if (await columnExists("guests", "organization_id")) {
    await sequelize.query(`
      UPDATE guests g
      INNER JOIN events e ON e.id = g.event_id
      SET g.organization_id = e.organization_id
      WHERE g.organization_id IS NULL AND e.organization_id IS NOT NULL;
    `);
  }
}

async function ensureCoreSchema() {
  await ensureScheduleSchema();
  await ensureInvitationRelatedTables();
  await ensureWeddingScheduleTemplateColumns();
  await ensureInvitationTemplateColumns();
  await ensureRsvpChangeRequestsTable();
  await ensureGuestRsvpStatusEnum();
  await ensureNotificationsTable();
  await ensureEventsTable();
  await ensureTicketingTables();
  await ensureStripeConnectColumns();
  await ensureOrgRbacSchema();
  await backfillGuestOrgAndEvent();
}

module.exports = { ensureCoreSchema };
