require('dotenv').config({ path: __dirname + '/../.env' });
const pool = require('../config/database');

(async () => {
  try {
    console.log('Clearing template_file for all jenis_surat to enforce new fallback PDF design...');
    const [result] = await pool.execute('UPDATE jenis_surat SET template_file = NULL');
    console.log('✓ Successfully cleared template_file for all records. Affected rows:', result.affectedRows || result.rowCount);
    process.exit(0);
  } catch (err) {
    console.error('Error clearing templates:', err);
    process.exit(1);
  }
})();
