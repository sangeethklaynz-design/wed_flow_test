/**
 * Smoke test invitation template APIs.
 * Usage: node scripts/smoke_invitation_template.js
 */
const { sequelize } = require("../src/models");
const { ensureCoreSchema } = require("../src/bootstrap/ensureSchema");
const {
  loadStaticInvitationBundle,
  loadGuestByToken,
  buildTemplateResponse,
} = require("../src/utils/invitationTemplate");

(async () => {
  await ensureCoreSchema();

  const [[wedding]] = await sequelize.query(
    `
    SELECT w.id AS wedding_id
    FROM weddings w
    JOIN users u ON u.id = w.user_id
    WHERE u.email = 'admintest@gmail.com'
    LIMIT 1;
    `
  );

  if (!wedding) {
    throw new Error("Test wedding not found");
  }

  const staticBundle = await loadStaticInvitationBundle(wedding.wedding_id);
  console.log("Static template wedding:", staticBundle.wedding);

  const [[guest]] = await sequelize.query(
    `
    SELECT unique_token
    FROM guests
    WHERE wedding_id = ?
    LIMIT 1;
    `,
    { replacements: [wedding.wedding_id] }
  );

  if (guest?.unique_token) {
    const guestRow = await loadGuestByToken(guest.unique_token);
    const guestTemplate = buildTemplateResponse(staticBundle, guestRow);
    console.log("Guest invitationNote:", guestTemplate.guest.invitationNote);
    console.log("Guest RSVP status:", guestTemplate.guest.rsvp.attendingStatus);
  } else {
    console.log("No guests seeded — static template only");
  }

  await sequelize.close();
})().catch(async (err) => {
  console.error(err);
  try {
    await sequelize.close();
  } catch (_) {}
  process.exit(1);
});
