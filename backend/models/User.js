const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { nama, nik, email, password, role, no_hp, tempat_lahir, tanggal_lahir, jenis_kelamin, pekerjaan, status_perkawinan, agama, alamat, foto_ktp } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [rows] = await pool.execute(
      `INSERT INTO users 
       (nama, nik, email, password, role, status, no_hp, tempat_lahir, tanggal_lahir, jenis_kelamin, pekerjaan, status_perkawinan, agama, alamat, foto_ktp) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING nik`,
      [nama, nik, email, hashedPassword, role, 'aktif', no_hp || null, tempat_lahir || null, tanggal_lahir || null, jenis_kelamin || null, pekerjaan || null, status_perkawinan || null, agama || null, alamat || null, foto_ktp || null]
    );
    
    return { insertId: rows[0].nik };
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT *, nik as id_user FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findByNIK(nik) {
    const [rows] = await pool.execute(
      'SELECT *, nik as id_user FROM users WHERE nik = ?',
      [nik]
    );
    return rows[0];
  }

  static async findById(nik) {
    const [rows] = await pool.execute(
      `SELECT nik as id_user, nama, nik, email, role, status, no_hp, created_at, 
              tempat_lahir, tanggal_lahir, jenis_kelamin, pekerjaan, status_perkawinan, agama, alamat, foto_ktp 
       FROM users WHERE nik = ?`,
      [nik]
    );
    return rows[0];
  }

  static async updateProfile(nik, profileData) {
    const { nama, no_hp, tempat_lahir, tanggal_lahir, jenis_kelamin, pekerjaan, status_perkawinan, agama, alamat } = profileData;
    const [result] = await pool.execute(
      `UPDATE users SET 
        nama = ?, 
        no_hp = ?,
        tempat_lahir = ?, 
        tanggal_lahir = ?, 
        jenis_kelamin = ?, 
        pekerjaan = ?, 
        status_perkawinan = ?, 
        agama = ?, 
        alamat = ?,
        updated_at = CURRENT_TIMESTAMP 
       WHERE nik = ?`,
      [nama, no_hp || null, tempat_lahir || null, tanggal_lahir || null, jenis_kelamin || null, pekerjaan || null, status_perkawinan || null, agama || null, alamat || null, nik]
    );
    return result;
  }

  static async getAll(role = null) {
    let query = 'SELECT nik as id_user, nama, nik, email, role, status, no_hp, created_at, tempat_lahir, tanggal_lahir, jenis_kelamin, pekerjaan, status_perkawinan, agama, alamat, foto_ktp FROM users';
    const params = [];
    
    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async update(nik, userData) {
    const { nama, email, status } = userData;
    const [result] = await pool.execute(
      'UPDATE users SET nama = ?, email = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE nik = ?',
      [nama, email, status, nik]
    );
    return result;
  }

  static async updateUserByAdmin(oldNik, userData) {
    const { nama, nik, email, status, no_hp, tempat_lahir, tanggal_lahir, jenis_kelamin, pekerjaan, status_perkawinan, agama, alamat } = userData;
    const [result] = await pool.execute(
      `UPDATE users SET 
        nama = ?, 
        nik = ?, 
        email = ?, 
        status = ?, 
        no_hp = ?,
        tempat_lahir = ?, 
        tanggal_lahir = ?, 
        jenis_kelamin = ?, 
        pekerjaan = ?, 
        status_perkawinan = ?, 
        agama = ?, 
        alamat = ?, 
        updated_at = CURRENT_TIMESTAMP 
       WHERE nik = ?`,
      [nama, nik, email, status, no_hp || null, tempat_lahir || null, tanggal_lahir || null, jenis_kelamin || null, pekerjaan || null, status_perkawinan || null, agama || null, alamat || null, oldNik]
    );
    return result;
  }

  static async updatePassword(nik, plainPassword) {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const [result] = await pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE nik = ?',
      [hashedPassword, nik]
    );
    return result;
  }

  static async verifyPassword(inputPassword, hashedPassword) {
    return await bcrypt.compare(inputPassword, hashedPassword);
  }

  static async setResetOtp(nik, otp, expiresAt) {
    const [result] = await pool.execute(
      'UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE nik = ?',
      [otp, expiresAt, nik]
    );
    return result;
  }

  static async clearResetOtp(nik) {
    const [result] = await pool.execute(
      'UPDATE users SET reset_otp = NULL, reset_otp_expires = NULL WHERE nik = ?',
      [nik]
    );
    return result;
  }

  static async delete(nik) {
    const [result] = await pool.execute(
      'DELETE FROM users WHERE nik = ?',
      [nik]
    );
    return result;
  }
}

module.exports = User;

