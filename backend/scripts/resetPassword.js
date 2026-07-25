require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

(async () => {
  try {
    const email = 'molyrahmi0@gmail.com';
    const password = 'secret123';
    console.log('Mengenkripsi password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Mengupdate database...');
    const [result] = await pool.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    
    console.log(`✓ Password untuk ${email} berhasil diubah menjadi: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error('✗ Gagal mengubah password:', err);
    process.exit(1);
  }
})();
