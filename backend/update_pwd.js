const bcrypt = require('bcrypt');
const { sequelize } = require('./src/models');

async function run() {
  try {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    await sequelize.query('UPDATE users SET password_hash = ? WHERE email = ?', {
      replacements: [hash, 'admintest@gmail.com']
    });
    console.log("Updated admintest@gmail.com with password: password123");
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}
run();
