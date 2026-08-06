const bcrypt = require("bcrypt");
const { env } = require("../config/env");

async function hashPassword(plainPassword) {
  const saltRounds = Number(env.SALT_ROUNDS || 10);
  return bcrypt.hash(plainPassword, saltRounds);
}

async function verifyPassword(plainPassword, passwordHash) {
  if (!plainPassword || !passwordHash) return false;
  return bcrypt.compare(plainPassword, passwordHash);
}

module.exports = { hashPassword, verifyPassword };
