const pool = require('../config/database');

class JenisSurat {
  static async getAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM jenis_surat WHERE status = \'aktif\' ORDER BY nama_jenis'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM jenis_surat WHERE id_jenis = ?',
      [id]
    );
    return rows[0];
  }

  static async create(data) {
    const { nama_jenis, deskripsi, template_file, custom_fields, body_template, syarat_dokumen } = data;
    const [rows] = await pool.execute(
      'INSERT INTO jenis_surat (nama_jenis, deskripsi, template_file, status, custom_fields, body_template, syarat_dokumen) VALUES (?, ?, ?, \'aktif\', ?, ?, ?) RETURNING id_jenis',
      [nama_jenis, deskripsi, template_file || null, custom_fields || '[]', body_template || null, syarat_dokumen || null]
    );
    return { insertId: rows[0].id_jenis };
  }

  static async update(id, data) {
    const { nama_jenis, deskripsi, status, template_file, custom_fields, body_template, syarat_dokumen } = data;
    let query = 'UPDATE jenis_surat SET nama_jenis = ?, deskripsi = ?, status = ?';
    const params = [nama_jenis, deskripsi, status || 'aktif'];

    if (template_file !== undefined) {
      query += ', template_file = ?';
      params.push(template_file);
    }
    if (custom_fields !== undefined) {
      query += ', custom_fields = ?';
      params.push(custom_fields);
    }
    if (body_template !== undefined) {
      query += ', body_template = ?';
      params.push(body_template);
    }
    if (syarat_dokumen !== undefined) {
      query += ', syarat_dokumen = ?';
      params.push(syarat_dokumen);
    }

    query += ' WHERE id_jenis = ?';
    params.push(id);

    const [result] = await pool.execute(query, params);
    return result;
  }

  static async remove(id) {
    const [result] = await pool.execute(
      'UPDATE jenis_surat SET status = \'nonaktif\' WHERE id_jenis = ?',
      [id]
    );
    return result;
  }
}

module.exports = JenisSurat;
