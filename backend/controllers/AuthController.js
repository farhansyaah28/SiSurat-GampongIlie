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

      // Save KTP photo as base64 directly to database
      let foto_ktp = foto_ktp_base64 || null;

      // Create user
      const userData = {
        nama,
        nik,
        email,
        password,
        role: role || 'warga',
        no_hp: no_hp || null,
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
        nik: result.insertId,
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
          nik: result.insertId,
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
          nik: user.nik,
          email: user.email,
          role: user.role,
          nama: user.nama
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      // Log audit
      await logAudit({
        nik: user.nik,
        aksi: 'LOGIN_USER',
        deskripsi: `User login sukses: ${user.email} (${user.role})`,
        tabel_target: 'users',
        id_target: user.nik,
        ip_address: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Login berhasil',
        token,
        user: {
          id_user: user.id_user,
          nik: user.nik,
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
        nik: id_user,
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

      await User.setResetOtp(user.nik, otp, expiresAt);
      
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

      await User.updatePassword(user.nik, newPassword);
      await User.clearResetOtp(user.nik);

      // Log Audit
      await logAudit({
        nik: user.nik,
        aksi: 'RESET_PASSWORD',
        deskripsi: `User mereset kata sandi melalui WhatsApp OTP`,
        tabel_target: 'users',
        id_target: user.nik,
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

  static async downloadFormulirBiodata(req, res) {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=formulir_biodata_warga.pdf');

      doc.pipe(res);

      // Title
      doc.font('Helvetica-Bold').fontSize(18).text('FORMULIR BIODATA', { align: 'center' });
      doc.moveDown(0.2);
      
      const width = doc.page.width;
      doc.lineWidth(1.5).moveTo(50, doc.y).lineTo(width - 50, doc.y).stroke();
      doc.moveDown(1.5);

      // Section I: IDENTITAS DIRI
      doc.font('Helvetica-Bold').fontSize(12).text('I. IDENTITAS DIRI', 50, doc.y);
      doc.moveDown(0.2);
      doc.lineWidth(1).moveTo(50, doc.y).lineTo(width - 50, doc.y).stroke();
      doc.moveDown(1);

      // Form helper to draw line items
      const drawFieldLine = (label, dotted = true) => {
        const startY = doc.y;
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text(label, 50, startY, { width: 150 });
        doc.font('Helvetica').fontSize(10).text(':', 200, startY);
        
        if (dotted) {
          let dots = '';
          const dotLength = 48;
          for(let i=0; i<dotLength; i++) dots += '.';
          doc.fillColor('#888888').text(dots, 215, startY);
        }
        doc.fillColor('#000000');
        doc.moveDown(1.5);
      };

      // Draw Nama Lengkap *
      drawFieldLine('Nama Lengkap *');

      // Draw NIK (16 boxes)
      const nikY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text('NIK (16 Digit) *', 50, nikY, { width: 150 });
      doc.font('Helvetica').fontSize(10).text(':', 200, nikY);
      
      const boxSize = 13;
      const boxGap = 5;
      const startX = 215;
      for (let i = 0; i < 16; i++) {
        const curX = startX + i * (boxSize + boxGap);
        doc.rect(curX, nikY - 2, boxSize, boxSize).stroke();
      }
      doc.moveDown(2);

      // Draw Tempat Lahir
      drawFieldLine('Tempat Lahir');

      // Draw Tanggal Lahir
      const tglY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text('Tanggal Lahir', 50, tglY, { width: 150 });
      doc.font('Helvetica').fontSize(10).text(':', 200, tglY);
      
      let dotsTgl = '';
      for(let i=0; i<25; i++) dotsTgl += '.';
      doc.fillColor('#888888').text(dotsTgl, 215, tglY);
      doc.font('Helvetica').fontSize(9).fillColor('#666666').text('(Tgl / Bln / Thn : GG / MM / TTTT)', 340, tglY);
      doc.fillColor('#000000');
      doc.moveDown(2.2);

      // Draw Jenis Kelamin
      const jkY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text('Jenis Kelamin', 50, jkY, { width: 150 });
      doc.font('Helvetica').fontSize(10).text(':', 200, jkY);
      
      doc.circle(220, jkY + 4, 5).stroke();
      doc.font('Helvetica').fontSize(10).text('Laki-laki', 232, jkY);
      
      doc.circle(300, jkY + 4, 5).stroke();
      doc.font('Helvetica').fontSize(10).text('Perempuan', 312, jkY);
      doc.moveDown(2.2);

      // Draw Agama
      const agY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text('Agama', 50, agY, { width: 150 });
      doc.font('Helvetica').fontSize(10).text(':', 200, agY);
      
      const agamaOptions1 = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha'];
      agamaOptions1.forEach((opt, idx) => {
        const oX = 215 + idx * 65;
        doc.rect(oX, agY - 2, 8, 8).stroke();
        doc.font('Helvetica').fontSize(9).text(opt, oX + 13, agY - 2);
      });
      
      const agY2 = agY + 16;
      doc.rect(215, agY2 - 2, 8, 8).stroke();
      doc.font('Helvetica').fontSize(9).text('Khonghucu', 228, agY2 - 2);
      doc.moveDown(3);

      // Draw Status Perkawinan
      const spY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text('Status Perkawinan', 50, spY, { width: 150 });
      doc.font('Helvetica').fontSize(10).text(':', 200, spY);
      
      const spOptions = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'];
      spOptions.forEach((opt, idx) => {
        const oX = 215 + idx * 75;
        doc.rect(oX, spY - 2, 8, 8).stroke();
        doc.font('Helvetica').fontSize(9).text(opt, oX + 13, spY - 2);
      });
      doc.moveDown(2.5);

      // Draw Pekerjaan
      drawFieldLine('Pekerjaan');

      // Section II: KONTAK & ALAMAT DOMISILI
      doc.font('Helvetica-Bold').fontSize(12).text('II. KONTAK & ALAMAT DOMISILI', 50, doc.y);
      doc.moveDown(0.2);
      doc.lineWidth(1).moveTo(50, doc.y).lineTo(width - 50, doc.y).stroke();
      doc.moveDown(1.2);

      // Draw Email Aktif
      drawFieldLine('Email Aktif');

      // Draw No. HP / WhatsApp
      drawFieldLine('No. HP / WhatsApp');

      // Draw Alamat Lengkap
      const alY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text('Alamat Lengkap', 50, alY, { width: 150 });
      doc.font('Helvetica').fontSize(10).text(':', 200, alY);
      
      doc.font('Helvetica').fontSize(9).fillColor('#666666').text('(Dusun / Jalan / RT / RW / Desa / Kelurahan / Kecamatan)', 215, alY);
      
      const lineGap = 20;
      doc.fillColor('#888888');
      for (let i = 0; i < 3; i++) {
        const lineYPos = alY + 22 + i * lineGap;
        let lineDots = '';
        for(let j=0; j<48; j++) lineDots += '.';
        doc.text(lineDots, 215, lineYPos);
      }

      doc.end();
    } catch (error) {
      console.error('Download form error:', error);
      res.status(500).send('Gagal mengunduh formulir.');
    }
  }
}

module.exports = AuthController;
