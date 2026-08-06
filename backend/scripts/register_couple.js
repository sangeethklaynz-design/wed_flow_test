/**
 * Admin script: register a couple from a text file.
 *
 * Usage (from wedflow/backend):
 *   node scripts/register_couple.js couple-registrations/example.txt
 *   npm run register-couple -- couple-registrations/example.txt
 *
 * Required fields:
 *   bride_name, groom_name, email, wedding_date, hotel_name
 *
 * Optional:
 *   password, hotel_address, google_maps_link, poruwa_time,
 *   weather_note, parking_note, special_text, thank_you_note,
 *   contact1_name, contact1_phone, contact1_relation,
 *   contact2_name, contact2_phone, contact2_relation
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sequelize } = require("../src/models");
const { env } = require("../src/config/env");

const REQUIRED_FIELDS = [
  "bride_name",
  "groom_name",
  "email",
  "wedding_date",
  "hotel_name",
];

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
  weather_note=Light outdoor breeze expected — bring a wrap
  parking_note=Valet available at the main lobby entrance
  contact1_name=Kasun
  contact1_phone=+94771234567
  contact1_relation=Groom
  contact2_name=Hiruni
  contact2_phone=+94772345678
  contact2_relation=Bride
  password=TempPass123!   # optional
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

  if (contacts.length > 2) {
    throw new Error("Maximum of 2 invitation contacts allowed");
  }

  const hotelName = data.hotel_name;
  const hotelAddress = data.hotel_address || "";
  const venueDisplay = hotelAddress
    ? `${hotelName} · ${hotelAddress}`
    : hotelName;

  return {
    brideName: data.bride_name,
    groomName: data.groom_name,
    email,
    weddingDate: data.wedding_date,
    password: data.password || null,
    hotelName: venueDisplay,
    hotelOnly: hotelName,
    hotelAddress,
    googleMapsLink: data.google_maps_link || null,
    poruwaTime: parseTime(data.poruwa_time, "poruwa_time"),
    weatherNote: data.weather_note || null,
    parkingNote: data.parking_note || null,
    specialText: data.special_text || null,
    thankYouNote: data.thank_you_note || null,
    contacts,
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

async function insertInvitationBundle(transaction, weddingId, details) {
  const invitationId = crypto.randomUUID();

  await sequelize.query(
    `
    INSERT INTO invitations (
      id, wedding_id, opening_video_url, special_text, poruwa_time, hotel_name,
      google_maps_link, weather_note, parking_note, thank_you_note
    )
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?);
    `,
    {
      replacements: [
        invitationId,
        weddingId,
        details.specialText,
        details.poruwaTime,
        details.hotelName,
        details.googleMapsLink,
        details.weatherNote,
        details.parkingNote,
        details.thankYouNote,
      ],
      transaction,
    }
  );

  const createdContacts = [];

  for (let i = 0; i < details.contacts.length; i += 1) {
    const contact = details.contacts[i];
    const contactId = crypto.randomUUID();
    const mappingId = crypto.randomUUID();

    await sequelize.query(
      `
      INSERT INTO contacts (
        id, wedding_id, contact_name, contact_phone, relation_type, created_at
      )
      VALUES (?, ?, ?, ?, ?, NOW());
      `,
      {
        replacements: [
          contactId,
          weddingId,
          contact.name,
          contact.phone,
          contact.relation,
        ],
        transaction,
      }
    );

    await sequelize.query(
      `
      INSERT INTO invitation_contacts (
        id, invitation_id, contact_id, display_order
      )
      VALUES (?, ?, ?, ?);
      `,
      {
        replacements: [mappingId, invitationId, contactId, i + 1],
        transaction,
      }
    );

    createdContacts.push({
      id: contactId,
      name: contact.name,
      phone: contact.phone,
      relation: contact.relation,
    });
  }

  return { invitationId, contacts: createdContacts };
}

async function registerCoupleFromFile(filePath) {
  const details = parseCoupleFile(filePath);
  const plainPassword = details.password || generatePassword();
  const saltRounds = Number(env.SALT_ROUNDS || 10);
  const passwordHash = await bcrypt.hash(plainPassword, saltRounds);
  const coupleNames = `${details.groomName} & ${details.brideName}`;

  const userId = crypto.randomUUID();
  const weddingId = crypto.randomUUID();

  const transaction = await sequelize.transaction();

  try {
    const [existing] = await sequelize.query(
      `SELECT id FROM users WHERE email = ? LIMIT 1;`,
      {
        replacements: [details.email],
        transaction,
      }
    );

    if (existing.length > 0) {
      throw new Error(`A user with email "${details.email}" already exists.`);
    }

    await sequelize.query(
      `
      INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, 'COUPLE', NOW(), NOW());
      `,
      {
        replacements: [userId, details.email, passwordHash],
        transaction,
      }
    );

    await sequelize.query(
      `
      INSERT INTO weddings (
        id, user_id, couple_names, wedding_date, schedule_image_url, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, NULL, NOW(), NOW());
      `,
      {
        replacements: [
          weddingId,
          userId,
          coupleNames,
          `${details.weddingDate} 00:00:00`,
        ],
        transaction,
      }
    );

    const invitation = await insertInvitationBundle(
      transaction,
      weddingId,
      details
    );

    await transaction.commit();

    return {
      userId,
      weddingId,
      invitationId: invitation.invitationId,
      contacts: invitation.contacts,
      coupleNames,
      email: details.email,
      weddingDate: details.weddingDate,
      hotelName: details.hotelName,
      poruwaTime: details.poruwaTime,
      password: plainPassword,
      passwordWasGenerated: !details.password,
      sourceFile: details.sourceFile,
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

  const result = await registerCoupleFromFile(fileArg);

  console.log("\nCouple registered successfully.\n");
  console.log(`  Couple:       ${result.coupleNames}`);
  console.log(`  Wedding date: ${result.weddingDate}`);
  console.log(`  Venue:        ${result.hotelName}`);
  console.log(`  Poruwa time:  ${result.poruwaTime || "—"}`);
  console.log(`  Login email:  ${result.email}`);
  console.log(
    `  Password:     ${result.password}${
      result.passwordWasGenerated ? "  (auto-generated — copy now)" : ""
    }`
  );
  console.log(`  User ID:      ${result.userId}`);
  console.log(`  Wedding ID:   ${result.weddingId}`);
  console.log(`  Invitation:   ${result.invitationId}`);
  if (result.contacts?.length) {
    console.log("  Contacts:");
    result.contacts.forEach((c, i) => {
      console.log(
        `    ${i + 1}. ${c.name} (${c.relation || "—"}) · ${c.phone}`
      );
    });
  }
  console.log(`  Source file:  ${result.sourceFile}\n`);
  console.log(
    "Share the email and password with the couple securely. The password is not stored in plain text.\n"
  );
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
  registerCoupleFromFile,
  parseCoupleFile,
  insertInvitationBundle,
};
