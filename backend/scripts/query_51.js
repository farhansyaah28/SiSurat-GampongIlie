const db = require('../config/database');

async function run() {
  try {
    const [rows] = await db.execute('SELECT id_pengajuan, status, file_surat, nomor_surat, tanggal_disetujui FROM pengajuan_surat WHERE id_pengajuan = 51');
    console.log('QUERY_RESULT:', rows[0]);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    db.end();
  }
}

run();
