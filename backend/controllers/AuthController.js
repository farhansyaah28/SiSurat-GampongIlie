const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');
const { sendResetOtpNotification } = require('../utils/waNotifier');
const { sendResetOtpEmail } = require('../utils/emailNotifier');

class AuthController {
  static async register(req, res) {
    try {
      const { nama, nik, email, password, confirmPassword, role, no_hp, tempat_lahir, tanggal_lahir, jenis_kelamin, pekerjaan, status_perkawinan, agama, alamat, foto_ktp_base64 } = req.body;

      // Validasi
      if (!nama || !nik || !email || !password || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Semua field harus diisi'
        });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password tidak cocok'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 6 karakter'
        });
      }

      // Cek email sudah terdaftar
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email sudah terdaftar'
        });
      }

      // Cek NIK sudah terdaftar
      const existingNIK = await User.findByNIK(nik);
      if (existingNIK) {
        return res.status(409).json({
          success: false,
          message: 'NIK sudah terdaftar'
        });
      }

      // Decode and save KTP photo if present
      let foto_ktp = null;
      if (foto_ktp_base64) {
        try {
          const fs = require('fs');
          const path = require('path');
          const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, '../uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const matches = foto_ktp_base64.match(/^data:image\/([a-zA-Z0-9\+]+);base64,(.+)$/);
          if (matches) {
            const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const fileName = `ktp_${nik}_${Date.now()}.${ext}`;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            foto_ktp = `/uploads/${fileName}`;
          }
        } catch (err) {
          console.error('Failed to save KTP photo:', err);
        }
      }

      // Create user
      const userData = {
        nama,
        nik,
        email,
        password,
        role: role || 'warga',
        no_hp: no_hp || '081234567890',
        tempat_lahir,
        tanggal_lahir: tanggal_lahir || null,
        jenis_kelamin,
        pekerjaan,
        status_perkawinan,
        agama,
        alamat,
        foto_ktp
      };

      const result = await User.create(userData);

      // Log audit
      await logAudit({
        id_user: result.insertId,
        aksi: 'REGISTER_USER',
        deskripsi: `Registrasi user baru dengan nama: ${nama}, role: ${role || 'warga'}`,
        tabel_target: 'users',
        id_target: result.insertId,
        ip_address: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil',
        data: {
          id_user: result.insertId,
          email: email
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat registrasi',
        error: error.message
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email dan password harus diisi'
        });
      }

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah'
        });
      }

      // Verify password
      const isPasswordValid = await User.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah'
        });
      }

      if (user.status !== 'aktif') {
        return res.status(403).json({
          success: false,
          message: 'Akun Anda tidak aktif'
        });
      }

      // Generate token
      const token = jwt.sign(
        {
          id_user: user.id_user,
          email: user.email,
          role: user.role,
          nama: user.nama
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      // Log audit
      await logAudit({
        id_user: user.id_user,
        aksi: 'LOGIN_USER',
        deskripsi: `User login sukses: ${user.email} (${user.role})`,
        tabel_target: 'users',
        id_target: user.id_user,
        ip_address: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Login berhasil',
        token,
        user: {
          id_user: user.id_user,
          nama: user.nama,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat login'
      });
    }
  }

  static async getProfile(req, res) {
    try {
      const { id_user } = req.user;

      const user = await User.findById(id_user);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan'
      });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { id_user } = req.user;
      const { nama, no_hp, tempat_lahir, tanggal_lahir, jenis_kelamin, pekerjaan, status_perkawinan, agama, alamat, password } = req.body;
      console.log('--- DEBUG updateProfile ---');
      console.log('req.body:', req.body);
      console.log('no_hp:', no_hp);

      if (!nama) {
        return res.status(400).json({
          success: false,
          message: 'Nama lengkap harus diisi'
        });
      }

      const profileData = {
        nama,
        no_hp,
        tempat_lahir,
        tanggal_lahir: tanggal_lahir || null,
        jenis_kelamin,
        pekerjaan,
        status_perkawinan,
        agama,
        alamat
      };

      await User.updateProfile(id_user, profileData);

      if (password && password.trim() !== '') {
        await User.updatePassword(id_user, password);
      }

      // Log audit
      await logAudit({
        id_user,
        aksi: 'UPDATE_PROFILE',
        deskripsi: `User mengupdate profil pribadi: ${nama}`,
        tabel_target: 'users',
        id_target: id_user,
        ip_address: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Profil berhasil diperbarui'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memperbarui profil',
        error: error.message
      });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { nik } = req.body;
      if (!nik) {
        return res.status(400).json({ success: false, message: 'NIK wajib diisi' });
      }

      const user = await User.findByNIK(nik);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Warga dengan NIK tersebut tidak ditemukan' });
      }

      // Generate 6-digit OTP
      const otp = (100000 + Math.floor(Math.random() * 900000)).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      await User.setResetOtp(user.id_user, otp, expiresAt);
      
      // Kirim via WhatsApp
      await sendResetOtpNotification(user.no_hp, user.nama, otp);

      // Mask nomor telepon untuk privasi (contoh: 0812****890)
      const maskedPhone = user.no_hp.replace(/(\d{4})(\d+)(\d{3})/, (m, a, b, c) => a + '*'.repeat(b.length) + c);

      res.status(200).json({
        success: true,
        message: `Kode OTP berhasil dikirim ke nomor WhatsApp Anda (${maskedPhone})`
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan saat meminta reset kata sandi' });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { nik, otp, newPassword } = req.body;
      if (!nik || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
      }

      const user = await User.findByNIK(nik);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      }

      if (!user.reset_otp || user.reset_otp !== otp) {
        return res.status(400).json({ success: false, message: 'Kode OTP tidak valid' });
      }

      const isExpired = new Date() > new Date(user.reset_otp_expires);
      if (isExpired) {
        return res.status(400).json({ success: false, message: 'Kode OTP sudah kedaluwarsa' });
      }

      await User.updatePassword(user.id_user, newPassword);
      await User.clearResetOtp(user.id_user);

      // Log Audit
      await logAudit({
        id_user: user.id_user,
        aksi: 'RESET_PASSWORD',
        deskripsi: `User mereset kata sandi melalui WhatsApp OTP`,
        tabel_target: 'users',
        id_target: user.id_user,
        ip_address: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Kata sandi berhasil diperbarui'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengatur ulang kata sandi' });
    }
  }
}

module.exports = AuthController;
