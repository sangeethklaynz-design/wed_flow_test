require("dotenv").config();

function requireEnv(keys) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

const env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_DIALECT: process.env.DB_DIALECT,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  SALT_ROUNDS: process.env.SALT_ROUNDS,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
};

module.exports = { env, requireEnv };

