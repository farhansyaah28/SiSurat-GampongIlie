const pool = require('../config/database');

class RiwayatCetak {
  static async create(data) {
    const { id_pengajuan, jumlah_cetak, status_cetak, dicetak_oleh, file_path } = data;
    const [rows] = await pool.execute(
      `INSERT INTO riwayat_cetak (id_pengajuan, jumlah_cetak, status_cetak, dicetak_oleh, file_path) VALUES (?, ?, ?, ?, ?) RETURNING id_cetak`,
      [id_pengajuan, jumlah_cetak, status_cetak, dicetak_oleh, file_path]
    );
    return { insertId: rows[0].id_cetak };
  }

  static async getByPengajuan(id_pengajuan) {
    const [rows] = await pool.execute(
      'SELECT * FROM riwayat_cetak WHERE id_pengajuan = ? ORDER BY tanggal_cetak DESC',
      [id_pengajuan]
    );
    return rows;
  }
}

module.exports = RiwayatCetak;
