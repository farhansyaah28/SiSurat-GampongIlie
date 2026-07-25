const pool = require('../config/database');

async function migrate() {
  try {
    console.log('Menambahkan kolom no_hp ke tabel users...');
    await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS no_hp VARCHAR(20)`);
    console.log('✅ Kolom no_hp berhasil ditambahkan!');
    
    // Set default WA number for test users if empty
    await pool.execute(`UPDATE users SET no_hp = '081234567890' WHERE no_hp IS NULL OR no_hp = ''`);
    console.log('✅ Default nomor WA (081234567890) berhasil diatur untuk user testing!');
    process.exit(0);
  } catch(e) {
    console.error('Error alter table:', e);
    process.exit(1);
  }
}

migrate();
