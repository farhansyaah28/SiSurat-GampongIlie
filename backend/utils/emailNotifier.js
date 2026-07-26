const nodemailer = require('nodemailer');
require('dotenv').config();

// Buat transporter SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465', // true untuk port 465, false untuk port lainnya
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

/**
 * Mengirim email berisi kode OTP reset password ke warga
 * @param {string} toEmail - Alamat email tujuan
 * @param {string} nama - Nama warga
 * @param {string} otp - Kode OTP 6 digit
 */
async function sendResetOtpEmail(toEmail, nama, otp) {
  const htmlContent = `
    <div style="font-family: 'Poppins', sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-corners: 16px; border-radius: 16px; background-color: #ffffff;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px dashed #99ad7a; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #546b41; margin: 0; font-size: 22px;">SiSurat Gampong Ilie</h2>
        <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Sistem Administrasi Terpadu</p>
      </div>

      <!-- Content -->
      <div style="color: #2d3b22; font-size: 14px; line-height: 1.6;">
        <p>Halo <strong>${nama}</strong>,</p>
        <p>Kami menerima permintaan untuk menyetel ulang kata sandi akun Anda di portal SiSurat Gampong Ilie.</p>
        
        <!-- OTP Card -->
        <div style="background-color: #f7fafc; border: 1px solid #edf2f7; border-radius: 12px; padding: 15px; text-align: center; margin: 25px 0;">
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #718096; font-weight: bold; text-transform: uppercase;">Kode OTP Reset Anda</p>
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #546b41;">${otp}</span>
        </div>

        <p style="font-size: 12px; color: #718096;">
          Masukkan kode OTP di atas pada halaman web untuk melanjutkan proses reset kata sandi Anda. 
          <br>
          *Kode ini hanya berlaku selama <strong>10 menit</strong>.
        </p>
        <p style="font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; padding-top: 15px; margin-top: 20px;">
          Jika Anda tidak merasa mengajukan perubahan kata sandi ini, silakan abaikan email ini dengan aman.
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 25px; padding-top: 10px; border-top: 1px solid #edf2f7; font-size: 10px; color: #a0aec0;">
        © 2026 Pemerintah Gampong Ilie. Seluruh Hak Cipta Dilindungi.
      </div>
    </div>
  `;

  // Tampilkan simulasi di console server
  console.log('\n======================================================');
  console.log(`📧 [EMAIL OTP GATEWAY - SIMULASI]`);
  console.log(`Tujuan (Email Warga) : ${toEmail}`);
  console.log(`Nama Warga           : ${nama}`);
  console.log(`OTP                  : ${otp}`);
  console.log('======================================================\n');

  // Kirim email asli jika konfigurasi SMTP sudah ada
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'SiSurat Gampong'}" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `[SiSurat Gampong] Kode OTP Reset Kata Sandi Anda`,
        html: htmlContent
      });
      console.log(`✅ [Email Notifier] Email OTP berhasil dikirim ke ${toEmail}`);
    } catch (err) {
      console.error('❌ [Email Notifier Error]: Gagal mengirim email asli:', err.message || err);
    }
  } else {
    console.log(`ℹ️ [Email Notifier] SMTP tidak dikonfigurasi. Menggunakan mode Simulasi (lihat log terminal di atas).`);
  }
}

module.exports = { sendResetOtpEmail };
