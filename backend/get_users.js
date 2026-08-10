const { sequelize } = require('./src/models');

async function run() {
  try {
    const [users] = await sequelize.query('SELECT * FROM users');
    console.log("Users:", users);
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}
run();
