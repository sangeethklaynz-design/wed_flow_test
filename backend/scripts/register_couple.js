/**
 * Admin script: register or update a couple from a text file.
 *
 * Usage (from wedflow/backend):
 *   node scripts/register_couple.js couple-registrations/example.txt
 *   npm run register-couple -- couple-registrations/example.txt
 *
 * Required fields (for new registration):
 *   bride_name, groom_name, email, wedding_date
 *
 * Optional:
 *   password, hotel_name, hotel_address, google_maps_link, poruwa_time,
 *   weather_note, parking_note, special_text, thank_you_note,
 *   contact1_name, contact1_phone, contact1_relation,
 *   contact2_name, contact2_phone, contact2_relation,
 *   milestone1_year, milestone1_title, milestone1_description,
 *   milestone2_year, milestone2_title, milestone2_description,
 *   milestone3_year, milestone3_title, milestone3_description,
 *   milestone4_year, milestone4_title, milestone4_description
 *
 * If the email already exists, the script will UPDATE the existing records.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sequelize } = require("../src/models");
const { env } = require("../src/config/env");

const REQUIRED_FIELDS = ["bride_name", "groom_name", "email", "wedding_date", "password"];

function printUsage() {
  console.log(`
Usage:
  node scripts/register_couple.js <path-to-text-file>

Example:
  node scripts/register_couple.js couple-registrations/example.txt

Text file format (key=value, one per line):
  bride_name=Hiruni
  groom_name=Kasun
  email=kasun.hiruni@example.com
  wedding_date=2026-11-14
  hotel_name=Galle Face Hotel
  hotel_address=2 Galle Road, Colombo 03
  poruwa_time=16:00
  milestone1_year=2019
  milestone1_title=The day we met
  password=TempPass123!   # optional

If the email already exists, the script updates the existing couple data.
`);
}

function parseTime(value, fieldName) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  throw new Error(
    `Invalid ${fieldName} "${value}". Use HH:mm (e.g. 16:00).`
  );
}

function parseCoupleFile(filePath) {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, "utf8");
  const data = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      throw new Error(`Invalid line (expected key=value): ${trimmed}`);
    }

    const key = trimmed.slice(0, eq).trim().toLowerCase();
    const value = trimmed.slice(eq + 1).trim();
    if (!key) {
      throw new Error(`Invalid line (empty key): ${trimmed}`);
    }
    data[key] = value;
  }

  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const email = data.email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Invalid email: ${data.email}`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.wedding_date)) {
    throw new Error(
      `Invalid wedding_date "${data.wedding_date}". Use YYYY-MM-DD (e.g. 2026-11-14).`
    );
  }

  const weddingDate = new Date(`${data.wedding_date}T00:00:00`);
  if (Number.isNaN(weddingDate.getTime())) {
    throw new Error(`Invalid wedding_date: ${data.wedding_date}`);
  }

  const contacts = [];
  for (const index of [1, 2]) {
    const name = data[`contact${index}_name`];
    const phone = data[`contact${index}_phone`];
    const relation = data[`contact${index}_relation`] || null;
    if (name || phone) {
      if (!name || !phone) {
        throw new Error(
          `contact${index}_name and contact${index}_phone must both be provided`
        );
      }
      contacts.push({ name, phone, relation });
    }
  }

  const milestones = [];
  for (const index of [1, 2, 3, 4]) {
    const year = data[`milestone${index}_year`];
    const title = data[`milestone${index}_title`];
    const description = data[`milestone${index}_description`] || null;
    if (year || title) {
      if (!year || !title) {
        throw new Error(
          `milestone${index}_year and milestone${index}_title must both be provided`
        );
      }
      milestones.push({ yearOrDate: year, title, description, displayOrder: index });
    }
  }

  return {
    brideName: data.bride_name,
    groomName: data.groom_name,
    email,
    weddingDate: data.wedding_date,
    password: data.password || null,
    hotelName: data.hotel_name || null,
    hotelAddress: data.hotel_address || null,
    googleMapsLink: data.google_maps_link || null,
    poruwaTime: parseTime(data.poruwa_time, "poruwa_time"),
    weatherNote: data.weather_note || null,
    parkingNote: data.parking_note || null,
    specialText: data.special_text
      ? String(data.special_text).replace(/\\n/g, "\n")
      : null,
    thankYouNote: data.thank_you_note || null,
    contacts,
    milestones,
    sourceFile: absolutePath,
  };
}

function generatePassword(length = 14) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

async function upsertInvitation(transaction, weddingId, invitationId, details) {
  if (invitationId) {
    // Update existing invitation
    await sequelize.query(
      `UPDATE invitations SET
        special_text = COALESCE(?, special_text),
        poruwa_time = COALESCE(?, poruwa_time),
        hotel_name = COALESCE(?, hotel_name),
        hotel_address = COALESCE(?, hotel_address),
        google_maps_link = COALESCE(?, google_maps_link),
        weather_note = COALESCE(?, weather_note),
        parking_note = COALESCE(?, parking_note),
        thank_you_note = COALESCE(?, thank_you_note)
      WHERE id = ?;`,
      {
        replacements: [
          details.specialText,
          details.poruwaTime,
          details.hotelName,
          details.hotelAddress,
          details.googleMapsLink,
          details.weatherNote,
          details.parkingNote,
          details.thankYouNote,
          invitationId,
        ],
        transaction,
      }
    );
    return invitationId;
  }

  // Create new invitation
  const newId = crypto.randomUUID();
  await sequelize.query(
    `INSERT INTO invitations (
      id, wedding_id, opening_video_url, special_text, poruwa_time, hotel_name,
      hotel_address, google_maps_link, weather_note, parking_note, thank_you_note
    ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?);`,
    {
      replacements: [
        newId, weddingId,
        details.specialText, details.poruwaTime, details.hotelName,
        details.hotelAddress, details.googleMapsLink,
        details.weatherNote, details.parkingNote, details.thankYouNote,
      ],
      transaction,
    }
  );
  return newId;
}

async function upsertContacts(transaction, weddingId, invitationId, contacts) {
  if (contacts.length === 0) return;

  // Remove old contacts for this invitation
  const [existingMappings] = await sequelize.query(
    `SELECT contact_id FROM invitation_contacts WHERE invitation_id = ?;`,
    { replacements: [invitationId], transaction }
  );
  for (const mapping of existingMappings) {
    await sequelize.query(`DELETE FROM invitation_contacts WHERE invitation_id = ? AND contact_id = ?;`,
      { replacements: [invitationId, mapping.contact_id], transaction });
    await sequelize.query(`DELETE FROM contacts WHERE id = ?;`,
      { replacements: [mapping.contact_id], transaction });
  }

  // Insert new contacts
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const contactId = crypto.randomUUID();
    const mappingId = crypto.randomUUID();

    await sequelize.query(
      `INSERT INTO contacts (id, wedding_id, contact_name, contact_phone, relation_type, created_at)
       VALUES (?, ?, ?, ?, ?, NOW());`,
      { replacements: [contactId, weddingId, contact.name, contact.phone, contact.relation], transaction }
    );

    await sequelize.query(
      `INSERT INTO invitation_contacts (id, invitation_id, contact_id, display_order)
       VALUES (?, ?, ?, ?);`,
      { replacements: [mappingId, invitationId, contactId, i + 1], transaction }
    );
  }
}

async function upsertMilestones(transaction, invitationId, milestones) {
  if (milestones.length === 0) return;

  // Remove old milestones
  await sequelize.query(`DELETE FROM milestones WHERE invitation_id = ?;`,
    { replacements: [invitationId], transaction });

  // Insert new milestones
  for (const m of milestones) {
    await sequelize.query(
      `INSERT INTO milestones (id, invitation_id, year_or_date, title, description, display_order)
       VALUES (?, ?, ?, ?, ?, ?);`,
      { replacements: [crypto.randomUUID(), invitationId, m.yearOrDate, m.title, m.description, m.displayOrder], transaction }
    );
  }
}

async function registerOrUpdateCouple(filePath) {
  const details = parseCoupleFile(filePath);
  const coupleNames = `${details.groomName} & ${details.brideName}`;

  const transaction = await sequelize.transaction();

  try {
    // Check if user already exists
    const [existing] = await sequelize.query(
      `SELECT u.id AS user_id, w.id AS wedding_id
       FROM users u
       LEFT JOIN weddings w ON w.user_id = u.id
       WHERE u.email = ? LIMIT 1;`,
      { replacements: [details.email], transaction }
    );

    let userId, weddingId, isUpdate = false, plainPassword = null;

    if (existing.length > 0) {
      // UPDATE existing couple
      isUpdate = true;
      userId = existing[0].user_id;
      weddingId = existing[0].wedding_id;

      // Update password if provided
      if (details.password) {
        const saltRounds = Number(env.SALT_ROUNDS || 10);
        const passwordHash = await bcrypt.hash(details.password, saltRounds);
        await sequelize.query(`UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?;`,
          { replacements: [passwordHash, userId], transaction });
        plainPassword = details.password;
      }

      // Update wedding details
      await sequelize.query(
        `UPDATE weddings SET
          couple_names = ?,
          bride_name = ?,
          groom_name = ?,
          wedding_date = ?,
          updated_at = NOW()
        WHERE id = ?;`,
        { replacements: [coupleNames, details.brideName, details.groomName, `${details.weddingDate} 00:00:00`, weddingId], transaction }
      );

      // Get or create invitation
      const [invRows] = await sequelize.query(
        `SELECT id FROM invitations WHERE wedding_id = ? LIMIT 1;`,
        { replacements: [weddingId], transaction }
      );
      const existingInvId = invRows.length > 0 ? invRows[0].id : null;

      const invitationId = await upsertInvitation(transaction, weddingId, existingInvId, details);
      await upsertContacts(transaction, weddingId, invitationId, details.contacts);
      await upsertMilestones(transaction, invitationId, details.milestones);

      await transaction.commit();

      return {
        mode: "updated",
        userId, weddingId, invitationId, coupleNames,
        email: details.email, weddingDate: details.weddingDate,
        hotelName: details.hotelName, poruwaTime: details.poruwaTime,
        password: plainPassword, sourceFile: details.sourceFile,
        milestoneCount: details.milestones.length,
        contactCount: details.contacts.length,
      };
    }

    // NEW registration
    plainPassword = details.password;
    const saltRounds = Number(env.SALT_ROUNDS || 10);
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

    userId = crypto.randomUUID();
    weddingId = crypto.randomUUID();

    await sequelize.query(
      `INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, 'COUPLE', NOW(), NOW());`,
      { replacements: [userId, details.email, passwordHash], transaction }
    );

    await sequelize.query(
      `INSERT INTO weddings (id, user_id, couple_names, bride_name, groom_name, wedding_date, schedule_image_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, NOW(), NOW());`,
      { replacements: [weddingId, userId, coupleNames, details.brideName, details.groomName, `${details.weddingDate} 00:00:00`], transaction }
    );

    const invitationId = await upsertInvitation(transaction, weddingId, null, details);
    await upsertContacts(transaction, weddingId, invitationId, details.contacts);
    await upsertMilestones(transaction, invitationId, details.milestones);

    await transaction.commit();

    return {
      mode: "created",
      userId, weddingId, invitationId, coupleNames,
      email: details.email, weddingDate: details.weddingDate,
      hotelName: details.hotelName, poruwaTime: details.poruwaTime,
      password: plainPassword,
      passwordWasGenerated: !details.password,
      sourceFile: details.sourceFile,
      milestoneCount: details.milestones.length,
      contactCount: details.contacts.length,
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function main() {
  const fileArg = process.argv[2];

  if (!fileArg || fileArg === "-h" || fileArg === "--help") {
    printUsage();
    process.exit(fileArg ? 0 : 1);
  }

  const result = await registerOrUpdateCouple(fileArg);

  if (result.mode === "updated") {
    console.log("\nCouple UPDATED successfully.\n");
  } else {
    console.log("\nCouple REGISTERED successfully.\n");
  }

  console.log(`  Couple:       ${result.coupleNames}`);
  console.log(`  Wedding date: ${result.weddingDate}`);
  console.log(`  Venue:        ${result.hotelName || "—"}`);
  console.log(`  Poruwa time:  ${result.poruwaTime || "—"}`);
  console.log(`  Login email:  ${result.email}`);
  if (result.password) {
    console.log(
      `  Password:     ${result.password}${
        result.passwordWasGenerated ? "  (auto-generated — copy now)" : ""
      }`
    );
  } else {
    console.log(`  Password:     (unchanged)`);
  }
  console.log(`  User ID:      ${result.userId}`);
  console.log(`  Wedding ID:   ${result.weddingId}`);
  console.log(`  Invitation:   ${result.invitationId}`);
  console.log(`  Contacts:     ${result.contactCount}`);
  console.log(`  Milestones:   ${result.milestoneCount}`);
  console.log(`  Source file:  ${result.sourceFile}\n`);

  if (result.mode === "created") {
    console.log(
      "Share the email and password with the couple securely. The password is not stored in plain text.\n"
    );
  } else {
    console.log("Existing couple data has been updated with the new values from the file.\n");
  }
}

if (require.main === module) {
  main()
    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("\nRegister couple FAILED:", err?.message || err);
      try {
        await sequelize.close();
      } catch (_) {
        // ignore close errors
      }
      process.exit(1);
    });
}

module.exports = {
  registerOrUpdateCouple,
  parseCoupleFile,
};
