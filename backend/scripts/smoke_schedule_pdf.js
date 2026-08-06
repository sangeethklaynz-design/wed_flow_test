const fs = require("fs");
const path = require("path");
const { sequelize } = require("../src/models");
const { ensureCoreSchema } = require("../src/bootstrap/ensureSchema");
const { buildSchedulePdfBuffer, PAGE_WIDTH, PAGE_HEIGHT } = require("../src/utils/schedulePdf");

(async () => {
  await ensureCoreSchema();
  const [rows] = await sequelize.query(
    `
    SELECT w.id
    FROM weddings w
    JOIN users u ON u.id = w.user_id
    WHERE u.email = 'admintest@gmail.com'
    LIMIT 1;
    `
  );
  const buf = await buildSchedulePdfBuffer(rows[0].id);
  const out = path.join(process.cwd(), "uploads", "schedule-templates", "preview-schedule.pdf");
  fs.writeFileSync(out, buf);
  console.log({
    bytes: buf.length,
    header: buf.slice(0, 5).toString(),
    page: `${PAGE_WIDTH}x${PAGE_HEIGHT}`,
    out,
  });
  await sequelize.close();
})().catch(async (err) => {
  console.error(err);
  try {
    await sequelize.close();
  } catch (_) {}
  process.exit(1);
});
