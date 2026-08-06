const { sequelize } = require("../src/models");

const email = process.argv[2] || "admintest@gmail.com";
const weddingDate = process.argv[3] || "2026-08-21";

async function main() {
  await sequelize.query(
    `
    UPDATE weddings w
    JOIN users u ON u.id = w.user_id
    SET w.wedding_date = ?, w.updated_at = NOW()
    WHERE u.email = ?;
    `,
    {
      replacements: [`${weddingDate} 00:00:00`, email.toLowerCase()],
    }
  );

  const [rows] = await sequelize.query(
    `
    SELECT w.couple_names, u.email, w.wedding_date
    FROM weddings w
    JOIN users u ON u.id = w.user_id
    WHERE u.email = ?
    LIMIT 1;
    `,
    { replacements: [email.toLowerCase()] }
  );

  if (!rows.length) {
    console.error("No wedding found for:", email);
    process.exit(1);
  }

  console.log("Updated wedding date:", rows[0]);
}

main()
  .then(() => sequelize.close())
  .catch((err) => {
    console.error(err);
    sequelize.close().finally(() => process.exit(1));
  });
