const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    console.log('Mengubah akun Operator Test (ID: 6) menjadi Kepala Desa...');
    await pool.execute(
      `UPDATE users 
       SET role = 'kepala_desa', 
           email = 'kades@gmail.com', 
           nama = 'Kepala Desa', 
           password = ? 
       WHERE id_user = 6 OR email = 'operator_1782918004963@example.local'`,
      [hashedPassword]
    );

    console.log('Mengubah akun Operator Rahmi (ID: 2) menjadi Operator dengan email singkat...');
    await pool.execute(
      `UPDATE users 
       SET role = 'operator', 
           email = 'operator@gmail.com', 
           nama = 'Operator Desa', 
           password = ? 
       WHERE id_user = 2 OR email = 'operator_1782917025450@example.local'`,
      [hashedPassword]
    );

    console.log('✓ Akun berhasil disesuaikan!');
    console.log('=============================================');
    console.log('Akun Kepala Desa baru:');
    console.log('- Email   : kades@gmail.com');
    console.log('- Password: admin123');
    console.log('---------------------------------------------');
    console.log('Akun Operator baru:');
    console.log('- Email   : operator@gmail.com');
    console.log('- Password: admin123');
    console.log('=============================================');
  } catch (err) {
    console.error('Gagal menyesuaikan akun:', err.message);
  } finally {
    pool.end();
  }
}

run();
