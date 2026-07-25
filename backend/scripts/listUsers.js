require('dotenv').config();
const pool = require('../config/database');

(async () => {
  try {
    const [rows] = await pool.execute('SELECT id_user, nama, email, role, status FROM users');
    console.log('Registered Users:');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error fetching users:', err);
    process.exit(1);
  }
})();
