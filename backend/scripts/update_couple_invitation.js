/**
 * Upsert invitation details for an already-registered couple.
 *
 * Usage (from wedflow/backend):
 *   node scripts/update_couple_invitation.js couple-registrations/kasunihiruni.txt
 *
 * Looks up the couple by email, then creates/updates invitations,
 * contacts, and invitation_contacts (max 2 contacts).
 */

const crypto = require("crypto");
const { sequelize } = require("../src/models");
const { parseCoupleFile } = require("./register_couple");

async function updateCoupleInvitationFromFile(filePath) {
  const details = parseCoupleFile(filePath);

  const [userRows] = await sequelize.query(
    `
    SELECT u.id AS user_id, w.id AS wedding_id, w.couple_names
    FROM users u
    JOIN weddings w ON w.user_id = u.id
    WHERE u.email = ?
    LIMIT 1;
    `,
    { replacements: [details.email] }
  );

  if (!userRows.length) {
    throw new Error(`No registered couple found for email: ${details.email}`);
  }

  const weddingId = userRows[0].wedding_id;
  const coupleNames = userRows[0].couple_names;
  const transaction = await sequelize.transaction();

  try {
    const [invitationRows] = await sequelize.query(
      `SELECT id FROM invitations WHERE wedding_id = ? LIMIT 1;`,
      { replacements: [weddingId], transaction }
    );

    let invitationId;

    if (invitationRows.length) {
      invitationId = invitationRows[0].id;
      await sequelize.query(
        `
        UPDATE invitations
        SET
          special_text = ?,
          poruwa_time = ?,
          hotel_name = ?,
          google_maps_link = ?,
          weather_note = ?,
          parking_note = ?,
          thank_you_note = ?
        WHERE id = ?;
        `,
        {
          replacements: [
            details.specialText,
            details.poruwaTime,
            details.hotelName,
            details.googleMapsLink,
            details.weatherNote,
            details.parkingNote,
            details.thankYouNote,
            invitationId,
          ],
          transaction,
        }
      );
    } else {
      invitationId = crypto.randomUUID();
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
    }

    // Clear existing invitation contacts for a clean rebuild (max 2).
    await sequelize.query(
      `
      DELETE ic FROM invitation_contacts ic
      WHERE ic.invitation_id = ?;
      `,
      { replacements: [invitationId], transaction }
    );

    await sequelize.query(
      `DELETE FROM contacts WHERE wedding_id = ?;`,
      { replacements: [weddingId], transaction }
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

    // Keep wedding date in sync if provided in the same file.
    await sequelize.query(
      `
      UPDATE weddings
      SET wedding_date = ?, updated_at = NOW()
      WHERE id = ?;
      `,
      {
        replacements: [`${details.weddingDate} 00:00:00`, weddingId],
        transaction,
      }
    );

    await transaction.commit();

    return {
      coupleNames,
      email: details.email,
      weddingId,
      invitationId,
      hotelName: details.hotelName,
      poruwaTime: details.poruwaTime,
      weatherNote: details.weatherNote,
      parkingNote: details.parkingNote,
      contacts: createdContacts,
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
    console.log(`
Usage:
  node scripts/update_couple_invitation.js <path-to-text-file>

Example:
  node scripts/update_couple_invitation.js couple-registrations/kasunihiruni.txt
`);
    process.exit(fileArg ? 0 : 1);
  }

  const result = await updateCoupleInvitationFromFile(fileArg);

  console.log("\nInvitation details updated.\n");
  console.log(`  Couple:       ${result.coupleNames}`);
  console.log(`  Email:        ${result.email}`);
  console.log(`  Venue:        ${result.hotelName}`);
  console.log(`  Poruwa time:  ${result.poruwaTime || "—"}`);
  console.log(`  Weather:      ${result.weatherNote || "—"}`);
  console.log(`  Parking:      ${result.parkingNote || "—"}`);
  console.log(`  Invitation:   ${result.invitationId}`);
  if (result.contacts.length) {
    console.log("  Contacts:");
    result.contacts.forEach((c, i) => {
      console.log(
        `    ${i + 1}. ${c.name} (${c.relation || "—"}) · ${c.phone}`
      );
    });
  }
  console.log(`  Source file:  ${result.sourceFile}\n`);
}

if (require.main === module) {
  main()
    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("\nUpdate invitation FAILED:", err?.message || err);
      try {
        await sequelize.close();
      } catch (_) {
        // ignore
      }
      process.exit(1);
    });
}

module.exports = { updateCoupleInvitationFromFile };
