const { createServer } = require("./server");
const { sequelize } = require("./models");
const { requireEnv } = require("./config/env");
const { ensureCoreSchema } = require("./bootstrap/ensureSchema");

async function main() {
  requireEnv([
    "PORT",
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "DB_DIALECT",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
  ]);

  const app = createServer();

  await sequelize.authenticate();
  console.log("DB connection OK");
  await ensureCoreSchema();
  console.log("Schema sync OK");

  const port = Number(process.env.PORT);
  app.listen(port, () => {
    console.log(`API listening on :${port}`);
  });
}

main().catch((err) => {
  console.error("Startup error:", err);
  process.exit(1);
});

