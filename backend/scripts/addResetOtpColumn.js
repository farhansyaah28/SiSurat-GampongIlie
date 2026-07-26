const pool = require('../config/database');

async function migrate() {
  try {
    console.log('Menambahkan kolom reset_otp dan reset_otp_expires ke tabel users...');
    await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6)`);
    await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires TIMESTAMP`);
    console.log('✅ Kolom reset_otp dan reset_otp_expires berhasil ditambahkan!');
    process.exit(0);
  } catch(e) {
    console.error('Error alter table:', e);
    process.exit(1);
  }
}

migrate();
