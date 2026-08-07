const { sequelize } = require("../src/models");
const { loadStaticInvitationBundle } = require("../src/utils/invitationTemplate");

async function main() {
  const [rows] = await sequelize.query(
    `SELECT id, couple_names FROM weddings WHERE couple_names LIKE ? LIMIT 1;`,
    { replacements: ["%Kasun%"] }
  );
  if (!rows.length) {
    throw new Error("No Kasun wedding found");
  }
  const bundle = await loadStaticInvitationBundle(rows[0].id);
  console.log(
    JSON.stringify(
      {
        couple: rows[0].couple_names,
        video: bundle.video,
        images: bundle.images,
      },
      null,
      2
    )
  );
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
