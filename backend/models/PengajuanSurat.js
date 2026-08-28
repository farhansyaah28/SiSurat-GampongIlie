const pool = require('../config/database');

class PengajuanSurat {
  static async create(pengajuanData) {
    const { id_user, nik, id_jenis, keperluan, keterangan, lampiran_kk } = pengajuanData;
    const targetNik = nik || id_user;
    
    const [rows] = await pool.execute(
      `INSERT INTO pengajuan_surat 
       (nik, id_jenis, keperluan, keterangan, status, lampiran_kk) 
       VALUES (?, ?, ?, ?, 'menunggu_verifikasi', ?) RETURNING id_pengajuan`,
      [targetNik, id_jenis, keperluan, keterangan, lampiran_kk || null]
    );
    
    return { insertId: rows[0].id_pengajuan };
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT ps.*, ps.nik as id_user, js.nama_jenis, js.template_file, js.custom_fields, js.body_template, 
              u.nama as nama_pemohon, u.nik, u.no_hp, u.tempat_lahir, u.tanggal_lahir, 
              u.jenis_kelamin, u.pekerjaan, u.status_perkawinan, u.agama, u.alamat, u.foto_ktp
       FROM pengajuan_surat ps
       JOIN jenis_surat js ON ps.id_jenis = js.id_jenis
       JOIN users u ON ps.nik = u.nik
       WHERE ps.id_pengajuan = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByUserId(nik, limit = null, offset = null) {
    let query = `SELECT ps.*, ps.nik as id_user, js.nama_jenis 
                 FROM pengajuan_surat ps
                 JOIN jenis_surat js ON ps.id_jenis = js.id_jenis
                 WHERE ps.nik = ?
                 ORDER BY ps.tanggal_pengajuan DESC`;
    const params = [nik];
    if (limit !== null && offset !== null) {
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async countByUserId(nik) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count FROM pengajuan_surat WHERE nik = ?`,
      [nik]
    );
    return parseInt(rows[0].count || '0', 10);
  }

  static async getAll(status = null, limit = null, offset = null) {
    let query = `SELECT ps.*, ps.nik as id_user, js.nama_jenis, u.nama as nama_pemohon, u.nik 
                 FROM pengajuan_surat ps
                 JOIN jenis_surat js ON ps.id_jenis = js.id_jenis
                 JOIN users u ON ps.nik = u.nik`;
    const params = [];
    
    if (status) {
      query += ' WHERE ps.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY ps.tanggal_pengajuan DESC';

    if (limit !== null && offset !== null) {
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async countAll(status = null) {
    let query = `SELECT COUNT(*) as count 
                 FROM pengajuan_surat ps
                 JOIN jenis_surat js ON ps.id_jenis = js.id_jenis
                 JOIN users u ON ps.nik = u.nik`;
    const params = [];
    if (status) {
      query += ' WHERE ps.status = ?';
      params.push(status);
    }
    const [rows] = await pool.execute(query, params);
    return parseInt(rows[0].count || '0', 10);
  }

  static async getStats() {
    // Get counts grouped by status
    const [rows] = await pool.execute(
      `SELECT status, COUNT(*) as count FROM pengajuan_surat GROUP BY status`
    );

    const stats = {
      total: 0,
      menunggu_verifikasi: 0,
      terverifikasi: 0,
      menunggu_persetujuan: 0,
      disetujui: 0,
      ditolak: 0
    };

    rows.forEach(row => {
      const cnt = parseInt(row.count || '0', 10);
      stats.total += cnt;
      if (stats.hasOwnProperty(row.status)) {
        stats[row.status] = cnt;
      }
    });

    return stats;
  }

  static async updateStatus(id, status, additionalData = {}) {
    let query = 'UPDATE pengajuan_surat SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const params = [status, id];
    
    if (additionalData.nomor_surat) {
      query = query.replace('updated_at', `nomor_surat = ?, updated_at`);
      params.splice(-1, 0, additionalData.nomor_surat);
    }
    
    if (additionalData.tanggal_disetujui) {
      query = query.replace('updated_at', `tanggal_disetujui = ?, updated_at`);
      params.splice(-1, 0, additionalData.tanggal_disetujui);
    }
    
    if (additionalData.catatan_ditolak) {
      query = query.replace('updated_at', `catatan_ditolak = ?, updated_at`);
      params.splice(-1, 0, additionalData.catatan_ditolak);
    }
    
    query += ' WHERE id_pengajuan = ?';
    
    const [result] = await pool.execute(query, params);
    return result;
  }

  static async updateFile(id, filePath) {
    const [result] = await pool.execute(
      'UPDATE pengajuan_surat SET file_surat = ?, updated_at = CURRENT_TIMESTAMP WHERE id_pengajuan = ?',
      [filePath, id]
    );
    return result;
  }

  static async updateLampiran(id, filePath) {
    const [result] = await pool.execute(
      'UPDATE pengajuan_surat SET lampiran_file = ?, updated_at = CURRENT_TIMESTAMP WHERE id_pengajuan = ?',
      [filePath, id]
    );
    return result;
  }

  static async update(id, pengajuanData) {
    const { keperluan, keterangan, status } = pengajuanData;
    const [result] = await pool.execute(
      `UPDATE pengajuan_surat SET 
        keperluan = ?, 
        keterangan = ?, 
        status = ?, 
        catatan_ditolak = NULL,
        updated_at = CURRENT_TIMESTAMP 
       WHERE id_pengajuan = ?`,
      [keperluan, keterangan, status, id]
    );
    return result;
  }
}

module.exports = PengajuanSurat;
