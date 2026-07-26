const axios = require('axios');
require('dotenv').config();

/**
 * Mengirim notifikasi WhatsApp ke warga saat status pengajuan surat berubah
 * @param {Object} pengajuan - Data pengajuan surat (termasuk nama_pemohon, no_hp, nama_jenis)
 * @param {string} newStatus - Status baru (terverifikasi, disetujui, ditolak, direvisi)
 * @param {string} keterangan Tambahan keterangan / alasan penolakan
 */
async function sendStatusNotification(pengajuan, newStatus, keterangan = '') {
  try {
    const targetPhone = pengajuan.no_hp || '081234567890';
    const namaPemohon = pengajuan.nama_pemohon || 'Warga';
    const jenisSurat = pengajuan.nama_jenis || 'Surat Gampong';
    const idSurat = pengajuan.id_pengajuan || '-';

    let statusText = '';
    let emoji = '';
    if (newStatus === 'terverifikasi') {
      statusText = 'TERVERIFIKASI oleh Operator';
      emoji = '✅';
    } else if (newStatus === 'disetujui') {
      statusText = 'DISETUJUI & SIAP DICETAK oleh Kepala Desa';
      emoji = '🎉';
    } else if (newStatus === 'ditolak') {
      statusText = 'DITOLAK';
      emoji = '❌';
    } else if (newStatus === 'menunggu_verifikasi') {
      statusText = 'DIKEMBALIKAN UNTUK REVISI / DIAJUKAN ULANG';
      emoji = '🔄';
    } else {
      statusText = newStatus.toUpperCase();
      emoji = '📨';
    }

    const message = `*SYSTEM NOTIFICATION - SISURAT GAMPONG ILIE*\n\n` +
      `Halo *${namaPemohon}*,\n` +
      `Status pengajuan surat Anda telah diperbarui:\n\n` +
      `📄 *Jenis Surat:* ${jenisSurat}\n` +
      `🔖 *ID Pengajuan:* #${idSurat}\n` +
      `📊 *Status Baru:* ${emoji} *${statusText}*\n` +
      (keterangan ? `💬 *Catatan / Alasan:* "${keterangan}"\n\n` : `\n`) +
      `Silakan login ke portal SiSurat Gampong atau buka aplikasi mobile Anda untuk melihat detail lengkap atau mengunduh surat yang telah disetujui.\n\n` +
      `_Pesan ini dikirim secara otomatis oleh sistem SiSurat Gampong._`;

    // Always log clean presentation output in terminal
    console.log('\n======================================================');
    console.log(`📱 [WHATSAPP NOTIFICATION GATEWAY]`);
    console.log(`Tujuan (WA Warga) : ${targetPhone}`);
    console.log(`Status Surat      : ${statusText} ${emoji}`);
    console.log(`Isi Pesan         :\n${message}`);
    console.log('======================================================\n');

    // Send real message if Fonnte API Token is configured
    if (process.env.FONNTE_TOKEN) {
      await axios.post('https://api.fonnte.com/send', {
        target: targetPhone,
        message: message,
        countryCode: '62'
      }, {
        headers: {
          'Authorization': process.env.FONNTE_TOKEN
        }
      });
      console.log(`✅ [WA Notifier] Pesan WhatsApp berhasil dikirim via Fonnte API ke ${targetPhone}`);
    }
  } catch (err) {
    console.error('❌ [WA Notifier Error]: Gagal mengirim notifikasi WhatsApp:', err.message || err);
  }
}

/**
 * Mengirim OTP reset password via WhatsApp ke warga
 * @param {string} phone - Nomor HP / WA warga
 * @param {string} nama - Nama lengkap warga
 * @param {string} otp - Kode OTP 6 digit
 */
async function sendResetOtpNotification(phone, nama, otp) {
  try {
    const targetPhone = phone || '081234567890';
    const message = `*SISURAT GAMPONG ILIE - RESET KATA SANDI*\n\n` +
      `Halo *${nama}*,\n` +
      `Kami menerima permintaan untuk menyetel ulang kata sandi akun Anda.\n\n` +
      `🔑 *KODE OTP RESET:* *${otp}*\n\n` +
      `Masukkan kode OTP di atas pada halaman web untuk melanjutkan proses reset.\n` +
      `Kode ini berlaku selama *10 menit*. Jika Anda tidak meminta reset kata sandi, abaikan saja pesan ini.\n\n` +
      `_Pesan ini dikirim secara otomatis oleh sistem SiSurat Gampong._`;

    // Always log to console
    console.log('\n======================================================');
    console.log(`🔑 [WHATSAPP OTP GATEWAY]`);
    console.log(`Tujuan (WA Warga) : ${targetPhone}`);
    console.log(`OTP               : ${otp}`);
    console.log(`Isi Pesan         :\n${message}`);
    console.log('======================================================\n');

    if (process.env.FONNTE_TOKEN) {
      await axios.post('https://api.fonnte.com/send', {
        target: targetPhone,
        message: message,
        countryCode: '62'
      }, {
        headers: {
          'Authorization': process.env.FONNTE_TOKEN
        }
      });
      console.log(`✅ [WA Notifier] OTP Reset Password berhasil dikirim via Fonnte ke ${targetPhone}`);
    }
  } catch (err) {
    console.error('❌ [WA Notifier Error]: Gagal mengirim OTP WhatsApp:', err.message || err);
  }
}

module.exports = { sendStatusNotification, sendResetOtpNotification };
