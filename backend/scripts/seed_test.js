const crypto = require("crypto");
const { sequelize } = require("../src/models");

async function run() {
  const userId = crypto.randomUUID();
  const weddingId = crypto.randomUUID();
  const invitationId = crypto.randomUUID();
  const eventId = crypto.randomUUID();
  const guestId = crypto.randomUUID();
  const rsvpId = crypto.randomUUID();
  const guestToken = `token_${crypto.randomUUID().replace(/-/g, "")}`;

  const email = `test.couple.${Date.now()}@example.com`;
  const guestName = `Test Guest ${Date.now()}`;

  // Insert in dependency order: users -> weddings -> invitations -> schedule_events -> guests -> rsvps
  await sequelize.query(
    `
    INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
    VALUES (?, ?, ?, 'COUPLE', NOW(), NOW());
  `,
    {
      replacements: [userId, email, "test_password_hash"],
    }
  );

  await sequelize.query(
    `
    INSERT INTO weddings (id, user_id, couple_names, wedding_date, schedule_image_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, NULL, NOW(), NOW());
  `,
    {
      replacements: [weddingId, userId, "Seed Couple", "2026-11-14 00:00:00"],
    }
  );

  await sequelize.query(
    `
    INSERT INTO invitations (
      id, wedding_id, opening_video_url, special_text, poruwa_time, hotel_name,
      google_maps_link, weather_note, parking_note, thank_you_note
    )
    VALUES (?, ?, NULL, ?, ?, 'Seed Venue', NULL, NULL, NULL, NULL);
  `,
    {
      replacements: [
        invitationId,
        weddingId,
        "You are warmly invited! (seed)",
        "16:00:00",
      ],
    }
  );

  await sequelize.query(
    `
    INSERT INTO schedule_events (
      id, wedding_id, event_time, title, location, status, display_order
    )
    VALUES (?, ?, '09:00:00', ?, ?, 'UPCOMING', 1);
  `,
    {
      replacements: [eventId, weddingId, "Seed Event", "Seed Location"],
    }
  );

  await sequelize.query(
    `
    INSERT INTO guests (
      id, wedding_id, full_name, whatsapp_number, invited_count,
      invitation_note, table_number, unique_token, rsvp_status
    )
    VALUES (?, ?, ?, '+94770000000', 2, 'Seed invitation note', 'A1', ?, 'PENDING');
  `,
    {
      replacements: [guestId, weddingId, guestName, guestToken],
    }
  );

  // Option B: always keep a row in rsvps and represent pending via attending_status='PENDING' + submitted_at=NULL
  await sequelize.query(
    `
    INSERT INTO rsvps (id, guest_id, attending_status, attending_count, wishes, submitted_at)
    VALUES (?, ?, 'PENDING', 0, NULL, NULL);
  `,
    {
      replacements: [rsvpId, guestId],
    }
  );

  return { userId, weddingId, invitationId, eventId, guestId, rsvpId, guestToken, email, guestName };
}

run()
  .then((res) => {
    console.log("Seed OK:", {
      email: res.email,
      guestName: res.guestName,
      guestToken: res.guestToken,
      userId: res.userId,
      weddingId: res.weddingId,
      invitationId: res.invitationId,
      eventId: res.eventId,
      guestId: res.guestId,
      rsvpId: res.rsvpId,
    });
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed FAILED:", err?.message || err);
    process.exit(1);
  });

