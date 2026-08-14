const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');
const pool = require('../config/database');

class UsersController {
  static async create(req, res) {
    try {
      const { nik, nama } = req.body;
      let email = req.body.email;
      if (!nik || !nama) {
        return res.status(400).json({ success: false, message: 'NIK dan Nama wajib diisi' });
      }

      if (!email || String(email).trim() === '') {
        email = `${nik}@gampong.id`;
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
        email,
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

  static async bulkCreate(req, res) {
    try {
      const { warga } = req.body;
      if (!warga || !Array.isArray(warga)) {
        return res.status(400).json({ success: false, message: 'Data warga tidak valid' });
      }

      let successCount = 0;
      let failedCount = 0;
      const details = [];

      for (const w of warga) {
        const nik = w.nik ? String(w.nik).trim() : '';
        const nama = w.nama ? String(w.nama).trim() : '';
        let email = w.email ? String(w.email).trim() : '';

        // Validate basic fields
        if (!nik || !nama || !/^[0-9]{16}$/.test(nik)) {
          failedCount++;
          details.push({
            nik,
            nama,
            success: false,
            message: 'Format NIK atau nama tidak valid / kosong'
          });
          continue;
        }

        if (!email) {
          email = `${nik}@gampong.id`;
        }

        // Check if NIK already exists
        const existingUser = await User.findByNIK(nik);
        if (existingUser) {
          failedCount++;
          details.push({
            nik,
            nama,
            success: false,
            message: 'NIK sudah terdaftar di sistem'
          });
          continue;
        }

        // Generate default password (first 4 letters of name + last 3 of NIK)
        const cleanName = nama.replace(/[^a-zA-Z]/g, '').padEnd(4, 'a').substring(0, 4).toLowerCase();
        const defaultPassword = cleanName + nik.substring(nik.length - 3);

        const userData = {
          nama,
          nik,
          email,
          password: defaultPassword,
          role: 'warga',
          no_hp: w.no_hp || null,
          tempat_lahir: w.tempat_lahir || null,
          tanggal_lahir: w.tanggal_lahir || null,
          jenis_kelamin: w.jenis_kelamin || null,
          pekerjaan: w.pekerjaan || null,
          status_perkawinan: w.status_perkawinan || null,
          agama: w.agama || null,
          alamat: w.alamat || null,
          foto_ktp: null // Default null for bulk imports
        };

        try {
          const result = await User.create(userData);
          successCount++;
          details.push({
            nik,
            nama,
            password: defaultPassword,
            success: true,
            id_user: result.insertId
          });
        } catch (insertError) {
          console.error(`Error inserting resident NIK ${nik}:`, insertError);
          failedCount++;
          details.push({
            nik,
            nama,
            success: false,
            message: 'Gagal memasukkan data ke database'
          });
        }
      }

      if (successCount > 0) {
        logAudit(req.user.id_user, 'BULK_CREATE_USERS', `Mengimpor ${successCount} warga secara massal`);
      }

      res.status(200).json({
        success: true,
        successCount,
        failedCount,
        details
      });
    } catch (error) {
      console.error('Bulk create error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem' });
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

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const actor = req.user;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Warga tidak ditemukan' });
      }

      if (user.role !== 'warga') {
        return res.status(403).json({ success: false, message: 'Hanya akun warga yang dapat dihapus' });
      }

      await User.delete(id);

      await logAudit({
        id_user: actor.id_user,
        aksi: 'DELETE_USER',
        deskripsi: `Aparatur desa menghapus akun warga: ${user.nama} (NIK: ${user.nik})`,
        tabel_target: 'users',
        id_target: id,
        ip_address: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Data warga berhasil dihapus'
      });
    } catch (error) {
      console.error('Delete citizen error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan saat menghapus data warga' });
    }
  }
}

module.exports = UsersController;

