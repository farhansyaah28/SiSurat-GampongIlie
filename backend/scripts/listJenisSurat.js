const db = require('../config/database');

async function list() {
  try {
    const [rows] = await db.query('SELECT * FROM jenis_surat ORDER BY id_jenis ASC');
    console.log('Available jenis_surat:');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

list();
