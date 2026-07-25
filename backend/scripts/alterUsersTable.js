require('dotenv').config({ path: __dirname + '/../.env' });
const pool = require('../config/database');

(async () => {
  try {
    console.log('Altering users table to add new profile columns...');
    
    const queries = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(100)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS tanggal_lahir DATE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(20)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS pekerjaan VARCHAR(100)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS status_perkawinan VARCHAR(50)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS agama VARCHAR(50)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS alamat TEXT'
    ];

    for (const query of queries) {
      console.log(`Executing: ${query}`);
      await pool.execute(query);
    }

    console.log('✓ Successfully altered users table. All profile columns added.');
    process.exit(0);
  } catch (err) {
    console.error('✗ Failed to alter users table:', err.message);
    process.exit(1);
  }
})();
