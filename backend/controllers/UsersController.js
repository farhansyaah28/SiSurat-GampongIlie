const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');
const pool = require('../config/database');

class UsersController {
  static async create(req, res) {
    try {
      const { nik, nama, email } = req.body;
      if (!nik || !nama || !email) {
        return res.status(400).json({ success: false, message: 'NIK, Nama, dan Email wajib diisi' });
      }

      // Check if NIK already exists
      const existingUser = await User.findByNIK(nik);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'NIK sudah terdaftar di sistem' });
      }

      // Generate default password (e.g., first 4 letters of name + last 3 of NIK)
      const cleanName = nama.replace(/[^a-zA-Z]/g, '').padEnd(4, 'a').substring(0, 4).toLowerCase();
      const defaultPassword = cleanName + nik.substring(nik.length - 3);

      const userData = {
        ...req.body,
        password: defaultPassword,
        role: 'warga'
      };

      const result = await User.create(userData);

      logAudit(req.user.id_user, 'CREATE_USER', `Mendaftarkan warga baru NIK: ${nik}`);

      res.status(201).json({ 
        success: true, 
        message: 'Warga berhasil didaftarkan',
        defaultPassword: defaultPassword,
        id_user: result.insertId
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ success: false, message: 'Gagal mendaftarkan warga' });
    }
  }

  static async list(req, res) {
    try {
      const { role } = req.query;
      const users = await User.getAll(role);
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const actor = req.user;
      const { nama, nik, email, status, no_hp, tempat_lahir, tanggal_lahir, jenis_kelamin, pekerjaan, status_perkawinan, agama, alamat } = req.body;
      console.log('--- DEBUG updateUserByAdmin ---');
      console.log('req.body:', req.body);
      console.log('no_hp:', no_hp);

      if (!nama || !nik || !email) {
        return res.status(400).json({ success: false, message: 'Nama, NIK, dan Email harus diisi' });
      }

      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Warga tidak ditemukan' });
      }

      // Check if NIK already used by another user
      const [existingNik] = await pool.execute('SELECT id_user FROM users WHERE nik = ? AND id_user != ?', [nik, id]);
      if (existingNik.length > 0) {
        return res.status(400).json({ success: false, message: `NIK ${nik} sudah terdaftar pada pengguna lain` });
      }

      // Check if Email already used by another user
      const [existingEmail] = await pool.execute('SELECT id_user FROM users WHERE email = ? AND id_user != ?', [email, id]);
      if (existingEmail.length > 0) {
        return res.status(400).json({ success: false, message: `Email ${email} sudah terdaftar pada pengguna lain` });
      }

      await User.updateUserByAdmin(id, {
        nama,
        nik,
        email,
        status: status || 'aktif',
        no_hp,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin,
        pekerjaan,
        status_perkawinan,
        agama,
        alamat
      });

      // Log Audit
      await logAudit({
        id_user: actor.id_user,
        aksi: 'UPDATE_USER_BY_ADMIN',
        deskripsi: `Aparatur desa mengupdate data warga: ${nama} (ID: ${id})`,
        tabel_target: 'users',
        id_target: id,
        ip_address: req.ip
      });

      res.status(200).json({ success: true, message: 'Data warga berhasil diperbarui' });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengupdate data warga' });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const actor = req.user;
      const { password } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Warga tidak ditemukan' });
      }

      const namaDepan = user.nama.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const tigaDigitNIK = user.nik.substring(Math.max(0, user.nik.length - 3));
      const defaultPassword = `${namaDepan}${tigaDigitNIK}`;

      const targetPassword = (password && password.trim() !== '') ? password.trim() : defaultPassword;

      await User.updatePassword(id, targetPassword);

      // Log Audit
      await logAudit({
        id_user: actor.id_user,
        aksi: 'RESET_PASSWORD_BY_ADMIN',
        deskripsi: `Aparatur desa mereset kata sandi warga: ${user.nama} (ID: ${id})`,
        tabel_target: 'users',
        id_target: id,
        ip_address: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Kata sandi warga berhasil disetel ulang',
        newPassword: targetPassword
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menyetel ulang sandi' });
    }
  }
}

module.exports = UsersController;
