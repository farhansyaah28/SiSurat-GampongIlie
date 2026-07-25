require('dotenv').config();
const User = require('../models/User');
const pool = require('../config/database');

(async () => {
  try {
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@desa.local';
    const adminNIK = process.env.SEED_ADMIN_NIK || '0000000000000000';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [adminEmail]);
    if (rows.length) {
      console.log('Admin sudah ada:', adminEmail);
      process.exit(0);
    }

    const result = await User.create({
      nama: 'Administrator',
      nik: adminNIK,
      email: adminEmail,
      password: adminPassword,
      role: 'kepala_desa'
    });

    console.log('Admin terbuat dengan id:', result.insertId);
    process.exit(0);
  } catch (err) {
    console.error('Seed admin error:', err);
    process.exit(1);
  }
})();
