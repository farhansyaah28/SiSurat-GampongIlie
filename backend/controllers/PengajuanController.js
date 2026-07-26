const PengajuanSurat = require('../models/PengajuanSurat');
const JenisSurat = require('../models/JenisSurat');
const RiwayatCetak = require('../models/RiwayatCetak');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { logAudit } = require('../utils/auditLogger');
const sse = require('../config/sse');
const { sendStatusNotification } = require('../utils/waNotifier');

function terbilang(nilai) {
  nilai = Math.floor(Math.abs(nilai));
  const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  let temp = "";
  if (nilai < 12) {
    temp = " " + huruf[nilai];
  } else if (nilai < 20) {
    temp = terbilang(nilai - 10) + " Belas";
  } else if (nilai < 100) {
    temp = terbilang(nilai / 10) + " Puluh" + terbilang(nilai % 10);
  } else if (nilai < 200) {
    temp = " Seratus" + terbilang(nilai - 100);
  } else if (nilai < 1000) {
    temp = terbilang(nilai / 100) + " Ratus" + terbilang(nilai % 100);
  } else if (nilai < 2000) {
    temp = " Seribu" + terbilang(nilai - 1000);
  } else if (nilai < 1000000) {
    temp = terbilang(nilai / 1000) + " Ribu" + terbilang(nilai % 1000);
  } else if (nilai < 1000000000) {
    temp = terbilang(nilai / 1000000) + " Juta" + terbilang(nilai % 1000000);
  } else if (nilai < 1000000000000) {
    temp = terbilang(nilai / 1000000000) + " Milyar" + terbilang(nilai % 1000000000);
  }
  return temp.trim();
}

class PengajuanController {
  static async create(req, res) {
    try {
      const { id_jenis, keperluan, keterangan, lampiran_kk_base64 } = req.body;
      const { id_user } = req.user;

      if (!id_jenis || !keperluan) {
        return res.status(400).json({
          success: false,
          message: 'Jenis surat dan keperluan harus diisi'
        });
      }

      // Decode and save KK photo if present
      let lampiran_kk = null;
      if (lampiran_kk_base64) {
        try {
          const user = await User.findById(id_user);
          const nik = user ? user.nik : 'unknown';
          const fs = require('fs');
          const path = require('path');
          const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, '../uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const matches = lampiran_kk_base64.match(/^data:image\/([a-zA-Z0-9\+]+);base64,(.+)$/);
          if (matches) {
            const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const fileName = `kk_${nik}_${Date.now()}.${ext}`;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            lampiran_kk = `/uploads/${fileName}`;
          }
        } catch (err) {
          console.error('Failed to save KK attachment:', err);
        }
      }

      const data = {
        id_user,
        id_jenis,
        keperluan,
        keterangan,
        lampiran_kk
      };

      const result = await PengajuanSurat.create(data);

      // Log audit
      await logAudit({
        id_user,
        aksi: 'CREATE_PENGAJUAN',
        deskripsi: `Membuat pengajuan surat baru dengan id_jenis: ${id_jenis}, keperluan: ${keperluan}`,
        tabel_target: 'pengajuan_surat',
        id_target: result.insertId,
        ip_address: req.ip
      });

      // Broadcast to real-time clients
      sse.broadcast('new_pengajuan', { id_pengajuan: result.insertId });

      res.status(201).json({
        success: true,
        message: 'Pengajuan surat berhasil dibuat',
        data: {
          id_pengajuan: result.insertId
        }
      });
    } catch (error) {
      console.error('Create pengajuan error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan'
      });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { keperluan, keterangan } = req.body;
      const { id_user } = req.user;

      const pengajuan = await PengajuanSurat.findById(id);
      if (!pengajuan) {
        return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
      }

      if (pengajuan.id_user !== id_user) {
        return res.status(403).json({ success: false, message: 'Anda tidak memiliki hak untuk merevisi pengajuan ini' });
      }

      await PengajuanSurat.update(id, { keperluan, keterangan, status: 'menunggu_verifikasi' });

      // Log audit
      await logAudit({
        id_user,
        aksi: 'REVISE_PENGAJUAN',
        deskripsi: `Merevisi pengajuan surat ID: ${id}, status kembali menjadi menunggu_verifikasi`,
        tabel_target: 'pengajuan_surat',
        id_target: id,
        ip_address: req.ip
      });

      // Broadcast to real-time clients
      sse.broadcast('status_update', { id_pengajuan: id, status: 'menunggu_verifikasi' });

      res.status(200).json({
        success: true,
        message: 'Pengajuan berhasil direvisi dan dikirim kembali'
      });
    } catch (error) {
      console.error('Update pengajuan error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan saat merevisi pengajuan' });
    }
  }

  static async onBehalf(req, res) {
    try {
      const { is_new_user, id_user, new_user_data, id_jenis, keperluan, keterangan } = req.body;
      const actor = req.user;

      if (!id_jenis || !keperluan) {
        return res.status(400).json({ success: false, message: 'Jenis surat dan keperluan harus diisi' });
      }

      let targetUserId = id_user;

      if (is_new_user) {
        const { nama, nik, tempat_lahir, tanggal_lahir, jenis_kelamin, pekerjaan, status_perkawinan, agama, alamat } = new_user_data || {};
        if (!nama || !nik) {
          return res.status(400).json({ success: false, message: 'Nama dan NIK warga baru harus diisi' });
        }

        // Check if NIK exists
        const existing = await User.findByNIK(nik);
        if (existing) {
          return res.status(400).json({ success: false, message: `Warga dengan NIK ${nik} sudah terdaftar di sistem` });
        }

        // Create new user
        const email = `${nik}@example.local`;
        const namaDepan = nama.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const tigaDigitNIK = nik.substring(Math.max(0, nik.length - 3));
        const defaultPassword = `${namaDepan}${tigaDigitNIK}`;

        const newUser = await User.create({
          nama,
          nik,
          email,
          password: defaultPassword,
          role: 'warga',
          tempat_lahir,
          tanggal_lahir,
          jenis_kelamin,
          pekerjaan,
          status_perkawinan,
          agama,
          alamat
        });
        targetUserId = newUser.insertId;

        // Log audit user creation
        await logAudit({
          id_user: actor.id_user,
          aksi: 'CREATE_USER_ON_BEHALF',
          deskripsi: `Operator/Kades mendaftarkan warga baru atas nama: ${nama} (NIK: ${nik})`,
          tabel_target: 'users',
          id_target: targetUserId,
          ip_address: req.ip
        });
      } else {
        if (!targetUserId) {
          return res.status(400).json({ success: false, message: 'Pilih warga terdaftar terlebih dahulu' });
        }
        const userExists = await User.findById(targetUserId);
        if (!userExists) {
          return res.status(404).json({ success: false, message: 'Warga terdaftar tidak ditemukan' });
        }
      }

      // Create pengajuan
      const result = await PengajuanSurat.create({
        id_user: targetUserId,
        id_jenis,
        keperluan,
        keterangan
      });
      const id_pengajuan = result.insertId;

      // Determine target status
      const targetStatus = actor.role === 'kepala_desa' ? 'disetujui' : 'terverifikasi';
      const additionalData = {};

      if (targetStatus === 'disetujui') {
        additionalData.nomor_surat = await generateNomorSurat(id_pengajuan);
        additionalData.tanggal_disetujui = new Date();
      }

      await PengajuanSurat.updateStatus(id_pengajuan, targetStatus, additionalData);

      // If approved, automatically generate PDF
      let generatedFile = null;
      if (targetStatus === 'disetujui') {
        try {
          generatedFile = await PengajuanController.generatePDFHelper(id_pengajuan, actor, req.ip);
        } catch (err) {
          console.error('Failed to auto-generate PDF on behalf:', err);
        }
      }

      // Log audit pengajuan
      await logAudit({
        id_user: actor.id_user,
        aksi: 'CREATE_PENGAJUAN_ON_BEHALF',
        deskripsi: `Membuat pengajuan on-behalf dengan id_jenis: ${id_jenis}, status: ${targetStatus}`,
        tabel_target: 'pengajuan_surat',
        id_target: id_pengajuan,
        ip_address: req.ip
      });

      // Broadcast to real-time clients
      sse.broadcast('new_pengajuan', { id_pengajuan });

      // Kirim Notifikasi WA ke Warga
      try {
        const fullPengajuan = await PengajuanSurat.findById(id_pengajuan);
        if (fullPengajuan) sendStatusNotification(fullPengajuan, targetStatus);
      } catch(e) { console.error('WA Notif error:', e); }

      res.status(201).json({
        success: true,
        message: targetStatus === 'disetujui' 
          ? 'Surat berhasil dibuat, disetujui, dan PDF otomatis dibuat' 
          : 'Surat berhasil diajukan dan status diset menjadi terverifikasi (menunggu persetujuan Kades)',
        data: {
          id_pengajuan,
          status: targetStatus,
          file: generatedFile
        }
      });
    } catch (error) {
      console.error('On behalf error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan saat memproses surat warga' });
    }
  }

  static async getMyPengajuan(req, res) {
    try {
      const { id_user } = req.user;
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);
      const offset = (page - 1) * limit;

      const pengajuan = await PengajuanSurat.findByUserId(id_user, limit, offset);
      const totalData = await PengajuanSurat.countByUserId(id_user);
      const totalPages = Math.ceil(totalData / limit);

      res.status(200).json({
        success: true,
        data: pengajuan,
        pagination: {
          page,
          limit,
          totalData,
          totalPages
        }
      });
    } catch (error) {
      console.error('Get pengajuan error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan'
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;

      const pengajuan = await PengajuanSurat.findById(id);
      if (!pengajuan) {
        return res.status(404).json({
          success: false,
          message: 'Pengajuan tidak ditemukan'
        });
      }

      res.status(200).json({
        success: true,
        data: pengajuan
      });
    } catch (error) {
      console.error('Get pengajuan by id error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan'
      });
    }
  }

  static async getAll(req, res) {
    try {
      const { status } = req.query;
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);
      const offset = (page - 1) * limit;

      const pengajuan = await PengajuanSurat.getAll(status, limit, offset);
      const totalData = await PengajuanSurat.countAll(status);
      const totalPages = Math.ceil(totalData / limit);

      res.status(200).json({
        success: true,
        data: pengajuan,
        pagination: {
          page,
          limit,
          totalData,
          totalPages
        }
      });
    } catch (error) {
      console.error('Get all pengajuan error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan'
      });
    }
  }

  static async verifikasi(req, res) {
    try {
      const { id } = req.params;
      const { status, catatan_ditolak } = req.body;
      const { id_user } = req.user;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status harus diisi'
        });
      }

      const validStatus = ['terverifikasi', 'ditolak'];
      if (!validStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status tidak valid'
        });
      }

      const additionalData = {};
      if (status === 'ditolak' && catatan_ditolak) {
        additionalData.catatan_ditolak = catatan_ditolak;
      }

      await PengajuanSurat.updateStatus(id, status, additionalData);

      // Log audit
      await logAudit({
        id_user,
        aksi: 'VERIFY_PENGAJUAN',
        deskripsi: `Operator memverifikasi pengajuan surat id: ${id} dengan status: ${status}${catatan_ditolak ? `, catatan: ${catatan_ditolak}` : ''}`,
        tabel_target: 'pengajuan_surat',
        id_target: parseInt(id, 10),
        ip_address: req.ip
      });

      // Broadcast to real-time clients
      sse.broadcast('status_update', { id_pengajuan: id, status });

      // Kirim Notifikasi WA ke Warga
      try {
        const fullPengajuan = await PengajuanSurat.findById(id);
        if (fullPengajuan) sendStatusNotification(fullPengajuan, status, catatan_ditolak);
      } catch(e) { console.error('WA Notif error:', e); }

      res.status(200).json({
        success: true,
        message: 'Pengajuan berhasil diverifikasi'
      });
    } catch (error) {
      console.error('Verifikasi error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan'
      });
    }
  }

  static async approve(req, res) {
    try {
      const { id } = req.params;
      let { nomor_surat } = req.body;
      const { id_user } = req.user;

      if (!nomor_surat) {
        nomor_surat = await generateNomorSurat(id);
      }

      const additionalData = {
        nomor_surat,
        tanggal_disetujui: new Date()
      };

      await PengajuanSurat.updateStatus(id, 'disetujui', additionalData);

      // Generate PDF automatically upon approval
      let generatedFile = null;
      try {
        generatedFile = await PengajuanController.generatePDFHelper(id, req.user, req.ip);
      } catch (err) {
        console.error('Failed to auto-generate PDF upon approval:', err);
      }

      // Log audit
      await logAudit({
        id_user,
        aksi: 'APPROVE_PENGAJUAN',
        deskripsi: `Kepala Desa menyetujui surat id: ${id} dengan nomor surat: ${nomor_surat}`,
        tabel_target: 'pengajuan_surat',
        id_target: parseInt(id, 10),
        ip_address: req.ip
      });

      // Broadcast to real-time clients
      sse.broadcast('status_update', { id_pengajuan: id, status: 'disetujui' });

      // Kirim Notifikasi WA ke Warga
      try {
        const fullPengajuan = await PengajuanSurat.findById(id);
        if (fullPengajuan) sendStatusNotification(fullPengajuan, 'disetujui');
      } catch(e) { console.error('WA Notif error:', e); }

      res.status(200).json({
        success: true,
        message: 'Surat berhasil disetujui dan PDF otomatis terbuat',
        nomor_surat,
        file: generatedFile
      });
    } catch (error) {
      console.error('Approve error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan'
      });
    }
  }

  static async reject(req, res) {
    try {
      const { id } = req.params;
      const { catatan_ditolak } = req.body;
      const { id_user } = req.user;

      if (!catatan_ditolak) {
        return res.status(400).json({
          success: false,
          message: 'Catatan penolakan harus diisi'
        });
      }

      const additionalData = { catatan_ditolak };

      await PengajuanSurat.updateStatus(id, 'ditolak', additionalData);

      // Log audit
      await logAudit({
        id_user,
        aksi: 'REJECT_PENGAJUAN',
        deskripsi: `Petugas menolak pengajuan surat id: ${id} dengan alasan: ${catatan_ditolak}`,
        tabel_target: 'pengajuan_surat',
        id_target: parseInt(id, 10),
        ip_address: req.ip
      });

      // Broadcast to real-time clients
      sse.broadcast('status_update', { id_pengajuan: id, status: 'ditolak' });

      // Kirim Notifikasi WA ke Warga
      try {
        const fullPengajuan = await PengajuanSurat.findById(id);
        if (fullPengajuan) sendStatusNotification(fullPengajuan, 'ditolak', catatan_ditolak);
      } catch(e) { console.error('WA Notif error:', e); }

      res.status(200).json({
        success: true,
        message: 'Surat berhasil ditolak'
      });
    } catch (error) {
      console.error('Reject error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan'
      });
    }
  }

  static async uploadFile(req, res) {
    try {
      const { id } = req.params;
      const uploadedFiles = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);
      if (uploadedFiles.length === 0) {
        return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
      }

      const pengajuan = await PengajuanSurat.findById(id);
      let existingFiles = [];
      if (pengajuan && pengajuan.lampiran_file) {
        try {
          if (pengajuan.lampiran_file.startsWith('[')) {
            existingFiles = JSON.parse(pengajuan.lampiran_file);
          } else {
            existingFiles = [pengajuan.lampiran_file];
          }
        } catch(e) { existingFiles = [pengajuan.lampiran_file]; }
      }

      const newPaths = uploadedFiles.map(f => `/uploads/${f.filename}`);
      const combinedFiles = [...existingFiles, ...newPaths];
      const storedValue = combinedFiles.length === 1 ? combinedFiles[0] : JSON.stringify(combinedFiles);

      await PengajuanSurat.updateLampiran(id, storedValue);

      res.status(200).json({ success: true, message: 'File berhasil diunggah', files: combinedFiles });
    } catch (error) {
      console.error('Upload file error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengunggah file' });
    }
  }

  static async generatePDFHelper(id, user, ipAddress) {
    const pengajuan = await PengajuanSurat.findById(id);
    if (!pengajuan) {
      throw new Error('Pengajuan tidak ditemukan');
    }

    if (pengajuan.status !== 'disetujui') {
      throw new Error('Hanya pengajuan yang disetujui yang dapat dicetak');
    }

    const uploadsDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const fileName = `surat_${id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    // Buat PDF sederhana
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Buat QR Code untuk verifikasi surat
    const verificationLink = `http://localhost:3000/verifikasi.html?id=${id}`;
    const qrDataUrl = await QRCode.toDataURL(verificationLink, { width: 150, margin: 1 });
    const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(qrBase64, 'base64');

    let templateApplied = false;

    if (pengajuan.template_file) {
      const templatePath = path.join(__dirname, '..', pengajuan.template_file.replace(/^\//, ''));
      if (fs.existsSync(templatePath)) {
        const ext = path.extname(templatePath).toLowerCase();
        try {
          if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            // Image background overlay template
            doc.image(templatePath, 0, 0, { width: doc.page.width, height: doc.page.height });
            doc.fillColor('#000000');
            
            // Draw dynamic values at coordinates
            doc.fontSize(11);
            
            // Label and values coordinates
            const xLabel = 70;
            const xValue = 180;
            
            doc.text(`Nomor Surat`, xLabel, 150);
            doc.text(`:  ${pengajuan.nomor_surat || '-'}`, xValue, 150);
            
            doc.text(`Nama Pemohon`, xLabel, 190);
            doc.text(`:  ${pengajuan.nama_pemohon}`, xValue, 190);
            
            doc.text(`NIK`, xLabel, 215);
            doc.text(`:  ${pengajuan.nik || '-'}`, xValue, 215);
            
            doc.text(`Keperluan`, xLabel, 240);
            doc.text(`:  ${pengajuan.keperluan}`, xValue, 240, { width: doc.page.width - 250 });
            
            doc.text(`Keterangan`, xLabel, doc.y + 15);
            doc.text(`:  ${pengajuan.keterangan || '-'}`, xValue, doc.y - 12, { width: doc.page.width - 250 });
            
            // Sign block
            const sigX = 350;
            const sigY = 550;
            doc.text(`Gampong Ilie, ${new Date(pengajuan.tanggal_disetujui || Date.now()).toLocaleDateString('id-ID')}`, sigX, sigY);
            doc.text('Keuchik Gampong Ilie', sigX, sigY + 15);
            
            // QR Code sebagai Tanda Tangan Digital (TTE) di Kanan
            doc.image(qrBuffer, sigX + 20, sigY + 32, { width: 55, height: 55 });

            doc.fontSize(11).font('Helvetica-Bold');
            doc.text('Zahlul Amri', sigX, sigY + 92);
            doc.fontSize(10).font('Helvetica');
            doc.text('NIP/NIK: -', sigX, sigY + 107);
            
            templateApplied = true;
          }
        } catch (err) {
          console.error('Error applying image template:', err);
          // Will fallback to default generation below
        }
      }
    }

    if (!templateApplied) {
      // --- 1. KOP SURAT (LOGO & TEKS) ---
      const logoPath = path.join(__dirname, '..', 'logo_surat.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 55, 38, { width: 52, height: 60 });
      } else {
        doc.save();
        doc.translate(50, 40);
        doc.lineWidth(1.5).strokeColor('#546B41');
        doc.circle(27.5, 27.5, 25).stroke();
        doc.circle(27.5, 27.5, 22).stroke();
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#546B41').text('★', 23.5, 22);
        doc.restore();
      }

      // Teks Header/Kop Surat
      doc.fillColor('#000000');
      doc.font('Helvetica-Bold').fontSize(12).text('PEMERINTAH KOTA BANDA ACEH', 110, 40, { align: 'center', width: doc.page.width - 160 });
      doc.fontSize(14).text('KECAMATAN ULEE KARENG', { align: 'center', width: doc.page.width - 160 });
      doc.fontSize(15).text('GAMPONG ILIE', { align: 'center', width: doc.page.width - 160 });
      doc.font('Helvetica').fontSize(8.5).text('Jalan Tgk. Direuleung – Banda Aceh Kode Pos: 23119', { align: 'center', width: doc.page.width - 160 });
      doc.text('E-mail: gampongilie20@gmail.com   Website: www.gampongiliebeusaba.com', { align: 'center', width: doc.page.width - 160 });

      // Garis Pembatas Kop Surat (Double Line)
      doc.lineWidth(2).moveTo(50, 115).lineTo(doc.page.width - 50, 115).stroke();
      doc.lineWidth(0.5).moveTo(50, 119).lineTo(doc.page.width - 50, 119).stroke();

      // Parse dynamic JSON if present
      let dynamicData = null;
      if (pengajuan.keterangan) {
        try {
          const parsed = JSON.parse(pengajuan.keterangan);
          if (parsed && parsed.is_dynamic) {
            dynamicData = parsed;
          }
        } catch (e) {
          // Not JSON
        }
      }

      const namaJenis = (pengajuan.nama_jenis || '').toLowerCase();
      let isUsaha = namaJenis.includes('usaha');

      // --- 2. JUDUL SURAT ---
      let titleText = `SURAT KETERANGAN DOMISILI`;
      let nomorPrefix = '470';
      if (namaJenis.includes('izin') && namaJenis.includes('usaha')) {
        titleText = 'SURAT IZIN USAHA GAMPONG';
        nomorPrefix = '503';
      } else if (isUsaha) {
        titleText = 'SURAT KETERANGAN USAHA';
        nomorPrefix = '503';
      } else if (namaJenis.includes('mampu') || namaJenis.includes('miskin')) {
        titleText = 'SURAT KETERANGAN KURANG MAMPU';
        nomorPrefix = '401';
      } else if (namaJenis.includes('penghasilan')) {
        titleText = 'SURAT KETERANGAN PENGHASILAN';
        nomorPrefix = '440';
      } else if (namaJenis.includes('keluarga')) {
        titleText = 'SURAT KETERANGAN STATUS KELUARGA';
        nomorPrefix = '474';
      } else if (namaJenis.includes('pajak') || namaJenis.includes('hutang')) {
        titleText = 'SURAT KETERANGAN BEBAS HUTANG PAJAK (STNPPT)';
        nomorPrefix = '973';
      } else if (namaJenis.includes('tanah')) {
        titleText = 'SURAT KETERANGAN PENGANTAR PERMOHONAN HAK TANAH';
        nomorPrefix = '593';
      } else if (namaJenis.includes('referensi')) {
        titleText = 'SURAT REFERENSI DESA';
        nomorPrefix = '510';
      } else if (pengajuan.nama_jenis) {
        titleText = `SURAT KETERANGAN ${pengajuan.nama_jenis.toUpperCase()}`;
        nomorPrefix = '470';
      }

      doc.font('Helvetica-Bold').fontSize(12).text(titleText, 50, 135, { align: 'center', underline: true, width: doc.page.width - 100 });
      doc.text(`NOMOR: ${pengajuan.nomor_surat || `${nomorPrefix}/xxx/GI-UK/xx/2026`}`, 50, doc.y, { align: 'center', width: doc.page.width - 100 });

      // --- 3. PEMBUKA ---
      doc.font('Helvetica').fontSize(11);
      
      let openingText = 'Keuchik Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh, dengan ini menerangkan bahwa :';
      if (namaJenis.includes('izin') && namaJenis.includes('usaha')) {
        openingText = 'Keuchik Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh, dengan ini memberikan izin usaha kepada :';
      }
      doc.text(openingText, 50, doc.y + 15, { align: 'justify', width: doc.page.width - 100 });

      // --- 4. GRID DATA WARGA ---
      const labelX = 85;
      const colonX = 210;
      const valueX = 220;
      let lineY = doc.y + 12;

      const drawField = (lbl, val) => {
        doc.font('Helvetica').text(lbl, labelX, lineY, { width: 120 });
        doc.text(':', colonX, lineY);
        doc.text(val || '-', valueX, lineY, { width: doc.page.width - valueX - 60 });
        lineY = doc.y + 5;
      };

      const fields = (dynamicData && dynamicData.fields) ? dynamicData.fields : {};

      if (namaJenis.includes('mampu') && (fields.nama_orang_tua || fields.nama_anak)) {
        // SKTM Pendidikan
        drawField('Nama Orang Tua (Ayah)', fields.nama_orang_tua);
        drawField('Tempat/Tgl Lahir', fields.ttl_orang_tua);
        drawField('Pekerjaan', fields.pekerjaan_orang_tua);
        drawField('Alamat', pengajuan.alamat || 'Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh');

        lineY += 10;
        doc.font('Helvetica-Bold').text('Adalah benar Orang Tua/Wali dari :', 50, lineY, { align: 'center', width: doc.page.width - 100 });
        lineY = doc.y + 8;

        drawField('N a m a', fields.nama_anak);
        drawField('Tempat/Tgl Lahir', fields.ttl_anak);
        drawField('Pekerjaan', fields.pekerjaan_anak || 'Pelajar/Mahasiswa');
        drawField('Pendidikan', fields.sekolah_anak);
        drawField('Jurusan', fields.jurusan_anak);
        drawField('NIM/NISN', fields.npm_anak);
        drawField('Alamat', pengajuan.alamat || 'Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh');

      } else if (namaJenis.includes('mampu') && fields.anggota_keluarga) {
        // SKTM Bansos
        drawField('N I K', pengajuan.nik);
        drawField('Nama Lengkap', pengajuan.nama_pemohon);
        const ttl = `${pengajuan.tempat_lahir || '-'}, ${pengajuan.tanggal_lahir ? new Date(pengajuan.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}`;
        drawField('Tempat/Tgl Lahir', ttl);
        drawField('Pekerjaan', pengajuan.pekerjaan);
        drawField('Alamat', pengajuan.alamat || 'Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh');

      } else if (namaJenis.includes('domisili')) {
        drawField('N I K', pengajuan.nik);
        drawField('N a m a', pengajuan.nama_pemohon);
        const ttl = `${pengajuan.tempat_lahir || '-'}, ${pengajuan.tanggal_lahir ? new Date(pengajuan.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}`;
        drawField('Tempat/Tgl Lahir', ttl);
        drawField('Jenis Kelamin', pengajuan.jenis_kelamin);
        drawField('Pekerjaan', pengajuan.pekerjaan);
        drawField('Status', pengajuan.status_perkawinan);
        drawField('Alamat', pengajuan.alamat || 'Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh');

      } else if (isUsaha) {
        drawField('Nama', pengajuan.nama_pemohon);
        drawField('NIK', pengajuan.nik);
        const ttl = `${pengajuan.tempat_lahir || '-'}, ${pengajuan.tanggal_lahir ? new Date(pengajuan.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}`;
        drawField('Tempat/Tgl Lahir', ttl);
        drawField('Pekerjaan', pengajuan.pekerjaan);
        drawField('Jenis Kelamin', pengajuan.jenis_kelamin);
        drawField('Status', pengajuan.status_perkawinan);
        drawField('Agama', pengajuan.agama);
        drawField('Alamat', pengajuan.alamat || 'Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh');

      } else if (namaJenis.includes('penghasilan') || namaJenis.includes('referensi') || (namaJenis.includes('tidak') && namaJenis.includes('pajak'))) {
        drawField('N I K', pengajuan.nik);
        drawField('Nama Lengkap', pengajuan.nama_pemohon);
        const ttl = `${pengajuan.tempat_lahir || '-'}, ${pengajuan.tanggal_lahir ? new Date(pengajuan.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}`;
        drawField('Tempat/Tgl Lahir', ttl);
        drawField('Pekerjaan', pengajuan.pekerjaan);
        drawField('Alamat', pengajuan.alamat || 'Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh');

      } else if (namaJenis.includes('izin') && namaJenis.includes('usaha')) {
        drawField('N I K', pengajuan.nik);
        drawField('Nama Lengkap', pengajuan.nama_pemohon);
        const ttl = `${pengajuan.tempat_lahir || '-'}, ${pengajuan.tanggal_lahir ? new Date(pengajuan.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}`;
        drawField('Tempat/Tgl Lahir', ttl);
        drawField('Alamat', pengajuan.alamat || 'Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh');

      } else if (namaJenis.includes('keluarga')) {
        drawField('N I K', pengajuan.nik);
        drawField('Nama Lengkap', pengajuan.nama_pemohon);
        const ttl = `${pengajuan.tempat_lahir || '-'}, ${pengajuan.tanggal_lahir ? new Date(pengajuan.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}`;
        drawField('Tempat/Tgl Lahir', ttl);
        drawField('Status Perkawinan', pengajuan.status_perkawinan);
        drawField('Alamat', pengajuan.alamat || 'Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh');

      } else if (namaJenis.includes('tanah')) {
        drawField('N I K', pengajuan.nik);
        drawField('Nama Lengkap', pengajuan.nama_pemohon);
        const ttl = `${pengajuan.tempat_lahir || '-'}, ${pengajuan.tanggal_lahir ? new Date(pengajuan.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}`;
        drawField('Tempat/Tgl Lahir', ttl);
        drawField('Pekerjaan', pengajuan.pekerjaan);
        drawField('Alamat', pengajuan.alamat || 'Gampong Ilie Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh');

      } else {
        drawField('Nama Lengkap', pengajuan.nama_pemohon);
        drawField('NIK', pengajuan.nik);
        const ttl = `${pengajuan.tempat_lahir || '-'}, ${pengajuan.tanggal_lahir ? new Date(pengajuan.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}`;
        drawField('Tempat/Tgl Lahir', ttl);
        drawField('Pekerjaan', pengajuan.pekerjaan);
        drawField('Alamat', pengajuan.alamat || 'Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh');
      }

      // --- 5. PARAGRAF ISI ---
      let bodyText = '';
      let subSectionY = lineY + 10;

      if (namaJenis.includes('domisili')) {
        bodyText = `Benar berdasarkan laporan yang masuk kepada kami bahwa yang namanya tersebut diatas saat ini tinggal dan berdomisili di Jalan Keuchik Hasan Dusun Meunasah Tuha Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh.`;
      } 
      else if (isUsaha) {
        bodyText = `Benar yang namanya tersebut diatas adalah Penduduk Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh dan benar sepengetahuan kami bahwa yang bersangkutan memiliki Usaha di alamat tersebut.`;
        
        lineY += 10;
        doc.font('Helvetica-Bold').text('Untuk menjalankan kegiatan usaha dagang/jasa berikut:', 50, lineY);
        lineY = doc.y + 8;
        drawField('Nama Usaha', fields.nama_usaha);
        drawField('Jenis Usaha', fields.jenis_usaha);
        drawField('Alamat Usaha', fields.alamat_usaha);
        subSectionY = lineY + 8;
      } 
      else if (namaJenis.includes('mampu') && (fields.nama_orang_tua || fields.nama_anak)) {
        const incomeVal = parseFloat(fields.penghasilan_orang_tua || 1000000);
        const formattedIncome = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(incomeVal);
        const dependentsVal = parseInt(fields.jumlah_tanggungan || 4, 10);
        bodyText = `Yang Kehidupan Sosial Ekonominya Kurang Mampu (Miskin) dengan penghasilan Rata-rata per bulan \u00b1 ${formattedIncome} dan menanggung ${dependentsVal} Orang anggota keluarga.`;
      } 
      else if (namaJenis.includes('mampu') && fields.anggota_keluarga) {
        bodyText = `Adalah benar warga Gampong Ilie yang berasal dari keluarga ekonomi lemah / kurang mampu, dengan tanggungan anggota keluarga sebagai berikut:`;
        
        lineY += 10;
        const startX = 60;
        const colWidths = [30, 180, 150, 120];
        const headers = ['No', 'Nama Lengkap', 'NIK', 'Hubungan Keluarga'];
        
        doc.save();
        doc.lineWidth(1).strokeColor('#000000');
        
        const drawRow = (rowCells, yPos) => {
          let currX = startX;
          rowCells.forEach((cell, idx) => {
            doc.rect(currX, yPos, colWidths[idx], 20).stroke();
            doc.font(idx === 0 || yPos === lineY ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).text(cell || '', currX + 4, yPos + 6, { width: colWidths[idx] - 8, align: idx === 0 ? 'center' : 'left' });
            currX += colWidths[idx];
          });
        };
        
        drawRow(headers, lineY);
        lineY += 20;
        
        let members = [];
        try {
          members = Array.isArray(fields.anggota_keluarga) ? fields.anggota_keluarga : JSON.parse(fields.anggota_keluarga);
        } catch(e) {
          members = [{ nama: 'Nama Warga', nik: '1171xxxxxxxxxxxx', hubungan: 'Anak Kandung' }];
        }
        
        members.forEach((m, index) => {
          drawRow([`${index + 1}`, m.nama || '-', m.nik || '-', m.hubungan || '-'], lineY);
          lineY += 20;
        });
        
        doc.restore();
        lineY += 10;
        doc.font('Helvetica').fontSize(11).text('Bahwa keluarga tersebut di atas dinyatakan benar-benar berasal dari keluarga kurang mampu/ekonomi lemah dan layak untuk mendapatkan bantuan sosial atau jaminan kesehatan dari Pemerintah.', 50, lineY, { align: 'justify', width: doc.page.width - 100 });
        subSectionY = doc.y + 10;
      } 
      else if (namaJenis.includes('penghasilan')) {
        const nominal = parseFloat(fields.jumlah_penghasilan || 3500000);
        const nominalStr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nominal);
        const terbilangStr = terbilang(nominal) + " Rupiah";
        bodyText = `Benar sepengetahuan kami bahwa yang namanya tersebut diatas memiliki Penghasilan Rata-rata per bulan sebesar ${nominalStr},- (${terbilangStr}).`;
      } 
      else if (namaJenis.includes('referensi')) {
        bodyText = `Adalah benar yang namanya tersebut diatas merupakan warga Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh yang berkelakuan baik, bermasyarakat, dan tidak pernah terlibat tindakan pidana/hukum.`;
      } 
      else if (namaJenis.includes('izin') && namaJenis.includes('usaha')) {
        bodyText = `Untuk menjalankan kegiatan usaha dagang/jasa berikut:`;
        
        lineY += 10;
        drawField('Nama Usaha', fields.nama_usaha || 'KEDAI KELONTONG BEUSABA');
        drawField('Jenis Usaha', fields.jenis_usaha || 'Perdagangan Sembako');
        drawField('Alamat Usaha', fields.alamat_usaha || 'Jalan Tgk. Direuleung Dusun Meunasah Tuha Gampong Ilie');
        subSectionY = lineY + 8;
      } 
      else if (namaJenis.includes('keluarga')) {
        bodyText = `Benar yang namanya tersebut diatas terdaftar dalam Kartu Keluarga (KK) Nomor: ${fields.nomor_kk || '1171xxxxxxxxxxxx'} dengan status hubungan keluarga sebagai ${fields.kepala_keluarga || 'Kepala Keluarga'} / anggota keluarga di lingkungan Gampong Ilie.`;
      } 
      else if (namaJenis.includes('tidak') && namaJenis.includes('pajak')) {
        bodyText = `Berdasarkan hasil pemeriksaan data pembayaran Pajak Bumi dan Bangunan Perdesaan dan Perkotaan (PBB-P2) serta retribusi daerah tingkat desa, wajib pajak tersebut di atas dinyatakan Bebas / Tidak Memiliki Tunggakan Hutang Pajak untuk tahun pajak ${fields.tahun_pajak || '2026'}.`;
      } 
      else if (namaJenis.includes('tanah')) {
        bodyText = `Benar yang namanya tersebut diatas sedang mengajukan permohonan pengakuan/pendaftaran hak atas sebidang tanah milik adat/negara seluas \u00b1 ${fields.luas_tanah || '500'} m\u00b2 yang terletak di Dusun ${fields.lokasi_tanah || 'Meunasah Tuha'} Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh.`;
      } 
      else if (namaJenis.includes('kematian')) {
        let tglMeninggal = fields.tanggal_meninggal ? new Date(fields.tanggal_meninggal) : new Date();
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const formattedTglMeninggal = tglMeninggal.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const dayName = days[tglMeninggal.getDay()];

        bodyText = `Benar berdasarkan laporan dari pihak keluarga/masyarakat, telah meninggal dunia warga Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh dengan identitas sebagai berikut:`;
        
        doc.font('Helvetica').fontSize(11).text(bodyText, 50, subSectionY, { align: 'justify', width: doc.page.width - 100 });
        subSectionY = doc.y + 12;
        bodyText = ''; // clear it so we don't print it again below

        // Helper to draw fields inside death certificate details list
        const drawFieldLocal = (label, val) => {
          doc.font('Helvetica-Bold').text(label, 70, lineY, { width: 140 });
          doc.font('Helvetica').text(`:  ${val}`, 210, lineY, { width: 330 });
          lineY += 18;
        };
        
        let lineY = subSectionY;
        drawFieldLocal('Nama Almarhum/ah', fields.nama_jenazah || '-');
        drawFieldLocal('NIK Almarhum/ah', fields.nik_jenazah || '-');
        drawFieldLocal('Hari / Tgl Kematian', `${dayName}, ${formattedTglMeninggal}`);
        drawFieldLocal('Pukul / Waktu', `${fields.jam_meninggal || '-'} WIB`);
        drawFieldLocal('Tempat Meninggal', fields.tempat_meninggal || '-');
        drawFieldLocal('Penyebab Kematian', fields.penyebab_meninggal || '-');
        drawFieldLocal('Nama Pelapor / Hubungan', `${pengajuan.nama_pemohon} (${fields.hubungan_pelapor || 'Keluarga'})`);
        
        subSectionY = lineY + 12;
      }
      else {
        // Fallback or generic custom template dynamic drawer
        let parsedFields = [];
        try {
          if (pengajuan.custom_fields) {
            parsedFields = typeof pengajuan.custom_fields === 'string' 
              ? JSON.parse(pengajuan.custom_fields) 
              : pengajuan.custom_fields;
          }
        } catch (e) {
          console.error('Failed to parse custom_fields:', e);
        }

        if (pengajuan.body_template && pengajuan.body_template.trim() !== '') {
          bodyText = pengajuan.body_template;
        } else {
          bodyText = `Benar berdasarkan laporan yang masuk kepada kami bahwa yang namanya tersebut diatas saat ini tinggal dan berdomisili di Gampong Ilie Kecamatan Ulee Kareng Kota Banda Aceh.`;
        }

        if (Array.isArray(parsedFields) && parsedFields.length > 0) {
          // Dynamic fields exist!
          doc.font('Helvetica').fontSize(11).text(bodyText, 50, subSectionY, { align: 'justify', width: doc.page.width - 100 });
          subSectionY = doc.y + 12;
          bodyText = ''; // clear it, as it has already been drawn

          const drawFieldLocal = (label, val) => {
            doc.font('Helvetica-Bold').text(label, 70, lineY, { width: 140 });
            doc.font('Helvetica').text(`:  ${val}`, 210, lineY, { width: 330 });
            lineY += 18;
          };

          let lineY = subSectionY;
          parsedFields.forEach(f => {
            const val = fields[f.name] || '-';
            drawFieldLocal(f.label, val);
          });
          subSectionY = lineY + 12;
        }
      }

      // Write bodyText
      doc.font('Helvetica').fontSize(11);
      if (bodyText) {
        doc.text(bodyText, 50, subSectionY, { align: 'justify', width: doc.page.width - 100 });
        subSectionY = doc.y + 12;
      }

      // Add Keperluan and Penutup texts
      let keperluanText = '';
      if (namaJenis.includes('domisili')) {
        keperluanText = `Surat Keterangan ini dikeluarkan untuk melengkapi Administrasi ${pengajuan.keperluan || 'Pembelian Sepeda Motor serta sebagai dokumen pendaftaran STNK dan BPKB di Samsat Polda Aceh'}.`;
      } else if (isUsaha) {
        keperluanText = `Surat Keterangan Usaha ini dikeluarkan atas permintaan yang bersangkutan untuk pengurusan administrasi ${pengajuan.keperluan || 'kredit perbankan / modal usaha'}.`;
      } else if (namaJenis.includes('mampu') && (fields.nama_orang_tua || fields.nama_anak)) {
        keperluanText = `Surat keterangan ini dikeluarkan untuk Pengurusan Administrasi ${pengajuan.keperluan || 'Kampus'}.`;
      } else if (namaJenis.includes('mampu') && fields.anggota_keluarga) {
        keperluanText = `Surat keterangan ini dibuat sebagai kelengkapan berkas administrasi ${pengajuan.keperluan || 'bantuan sosial / jaminan kesehatan'}.`;
      } else if (namaJenis.includes('penghasilan')) {
        keperluanText = `Surat Keterangan Penghasilan ini dikeluarkan atas permintaan yang bersangkutan untuk pengurusan administrasi ${pengajuan.keperluan || 'KPR/Finansial'}.`;
      } else if (namaJenis.includes('referensi')) {
        keperluanText = `Surat Referensi ini dikeluarkan atas permintaan yang bersangkutan untuk melengkapi dokumen ${pengajuan.keperluan || 'lamaran pekerjaan/keperluan administrasi lainnya'}.`;
      } else if (namaJenis.includes('izin') && namaJenis.includes('usaha')) {
        keperluanText = `Surat Izin Usaha Gampong ini dikeluarkan sebagai bukti pendaftaran izin gangguan/HO tingkat desa dan kelengkapan administrasi ${pengajuan.keperluan || 'perbankan'}.`;
      } else if (namaJenis.includes('keluarga')) {
        keperluanText = `Surat keterangan status keluarga ini diberikan untuk melengkapi persyaratan kepengurusan ${pengajuan.keperluan || 'jaminan sosial / beasiswa'}.`;
      } else if (namaJenis.includes('tidak') && namaJenis.includes('pajak')) {
        keperluanText = `Surat Keterangan Bebas Hutang Pajak ini dikeluarkan untuk memenuhi kelengkapan administrasi kepengurusan ${pengajuan.keperluan || 'sertifikat tanah / permohonan kredit'}.`;
      } else if (namaJenis.includes('tanah')) {
        keperluanText = `Surat Keterangan Pengantar ini dibuat sebagai kelengkapan berkas permohonan hak atas tanah ke ${pengajuan.keperluan || 'Kantor Pertanahan Kota Banda Aceh (BPN)'}.`;
      } else if (namaJenis.includes('kematian')) {
        keperluanText = `Surat Keterangan Kematian ini dikeluarkan atas permintaan pelapor untuk pengurusan administrasi ${pengajuan.keperluan || 'Akte Kematian / Ahli Waris / keperluan keluarga lainnya'}.`;
      } else {
        keperluanText = `Surat keterangan ini dikeluarkan untuk melengkapi persyaratan keperluan: ${pengajuan.keperluan}.`;
      }

      doc.text(keperluanText, 50, subSectionY, { align: 'justify', width: doc.page.width - 100 });
      subSectionY = doc.y + 12;

      let penutupText = 'Demikianlah surat keterangan ini diperbuat dengan sebenarnya agar dapat dipergunakan seperlunya.';
      if (namaJenis.includes('referensi')) {
        penutupText = 'Demikianlah surat referensi ini kami keluarkan dengan sebenarnya untuk dipergunakan sebagaimana mestinya.';
      } else if (namaJenis.includes('izin') && namaJenis.includes('usaha')) {
        penutupText = 'Demikianlah surat keterangan izin usaha ini kami buat untuk dapat dipergunakan sebagaimana mestinya.';
      } else if (namaJenis.includes('tanah')) {
        penutupText = 'Demikianlah surat keterangan pengantar permohonan tanah ini dikeluarkan agar dapat dipergunakan sebagaimana mestinya.';
      }

      doc.text(penutupText, 50, subSectionY, { align: 'justify', width: doc.page.width - 100 });

      // --- 6. PENANDATANGAN & QR CODE ---
      const sigY = doc.y + 35;
      const formattedDate = new Date(pengajuan.tanggal_disetujui || Date.now()).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Tanggal & Jabatan (Kanan)
      doc.font('Helvetica').fontSize(11);
      doc.text(`Banda Aceh, ${formattedDate}`, 350, sigY, { width: 200 });
      doc.text('Keuchik Gampong Ilie', 350, sigY + 15, { width: 200 });

      // QR Code sebagai Tanda Tangan Digital (TTE) di Kanan
      doc.image(qrBuffer, 370, sigY + 32, { width: 55, height: 55 });

      // Nama Penandatangan (Kanan)
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000');
      doc.text('Zahlul Amri', 350, sigY + 92, { underline: true, width: 200 });
    }

    doc.end();

    // Tunggu sampai stream selesai
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Simpan path relatif ke database
    const relPath = `/uploads/${fileName}`;
    await PengajuanSurat.updateFile(id, relPath);

    // Catat riwayat cetak
    await RiwayatCetak.create({
      id_pengajuan: id,
      jumlah_cetak: 1,
      status_cetak: 'berhasil',
      dicetak_oleh: user.id_user,
      file_path: relPath
    });

    // Catat Audit Log
    await logAudit({
      id_user: user.id_user,
      aksi: 'GENERATE_PDF',
      deskripsi: `Mencetak PDF surat untuk pengajuan id: ${id}. PDF disimpan ke: ${relPath}`,
      tabel_target: 'pengajuan_surat',
      id_target: parseInt(id, 10),
      ip_address: ipAddress
    });

    return relPath;
  }

  static async generatePDF(req, res) {
    try {
      const { id } = req.params;
      const file = await PengajuanController.generatePDFHelper(id, req.user, req.ip);
      res.status(200).json({ success: true, message: 'PDF berhasil dibuat', file });
    } catch (error) {
      console.error('Generate PDF error:', error);
      res.status(500).json({ success: false, message: error.message || 'Terjadi kesalahan saat membuat PDF' });
    }
  }

  static async downloadFile(req, res) {
    try {
      const { id } = req.params;

      const pengajuan = await PengajuanSurat.findById(id);
      if (!pengajuan) return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });

      let fileSurat = pengajuan.file_surat;

      // Jika file_surat kosong tetapi statusnya disetujui, buat secara otomatis (Self-Healing)
      if (!fileSurat && pengajuan.status === 'disetujui') {
        try {
          fileSurat = await PengajuanController.generatePDFHelper(id, req.user || { id_user: pengajuan.id_user }, req.ip);
        } catch (err) {
          console.error('Failed to auto-generate PDF during download:', err);
        }
      }

      if (!fileSurat) return res.status(404).json({ success: false, message: 'File tidak tersedia' });

      const path = require('path');
      const uploadsBaseDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..');
      const filePath = path.join(uploadsBaseDir, fileSurat.replace(/^[\/]/, ''));
      return res.download(filePath);
    } catch (error) {
      console.error('Download file error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengunduh file' });
    }
  }

  static async getRiwayat(req, res) {
    try {
      const { id } = req.params;
      const RiwayatCetak = require('../models/RiwayatCetak');

      const rows = await RiwayatCetak.getByPengajuan(id);
      res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error('Get riwayat error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
  }

  static async listUploads(req, res) {
    try {
      const { id } = req.params;
      const pengajuan = await PengajuanSurat.findById(id);
      if (!pengajuan) return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
      let list = [];
      if (pengajuan.lampiran_file) {
        try {
          if (pengajuan.lampiran_file.startsWith('[')) {
            list = list.concat(JSON.parse(pengajuan.lampiran_file));
          } else {
            list.push(pengajuan.lampiran_file);
          }
        } catch(e) { list.push(pengajuan.lampiran_file); }
      }
      if (pengajuan.lampiran_kk) list.push(pengajuan.lampiran_kk);
      res.status(200).json({ success: true, data: list });
    } catch (error) {
      console.error('List uploads error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
  }

  static async getStats(req, res) {
    try {
      const stats = await PengajuanSurat.getStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil statistik'
      });
    }
  }
}

function getLetterTypeCode(namaJenis) {
  const name = (namaJenis || '').toLowerCase();
  if (name.includes('domisili')) return 'KD';
  if (name.includes('usaha') && name.includes('keterangan')) return 'KU';
  if (name.includes('penghasilan')) return 'KP';
  if (name.includes('referensi')) return 'SR';
  if (name.includes('izin') && name.includes('usaha')) return 'SIU';
  if (name.includes('keluarga')) return 'SKK';
  if (name.includes('hutang') || name.includes('pajak')) return 'STNPPT';
  if (name.includes('tanah')) return 'SPT';
  
  // Default fallback
  const words = name.replace('surat', '').trim().split(/\s+/);
  return words.map(w => w.charAt(0).toUpperCase()).join('');
}

async function generateNomorSurat(id_pengajuan) {
  const pengajuan = await PengajuanSurat.findById(id_pengajuan);
  if (!pengajuan) return '001/GEN/GI-UK/' + new Date().getFullYear();

  const id_jenis = pengajuan.id_jenis;
  const nama_jenis = pengajuan.nama_jenis;
  const code = getLetterTypeCode(nama_jenis);
  
  const currentYear = new Date().getFullYear();
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count 
     FROM pengajuan_surat 
     WHERE status = 'disetujui' 
       AND id_jenis = ? 
       AND EXTRACT(YEAR FROM tanggal_disetujui) = ?`,
    [id_jenis, currentYear]
  );
  
  const count = parseInt(rows[0].count || '0', 10);
  const nextNum = String(count + 1).padStart(3, '0');
  
  return `${nextNum}/${code}/GI-UK/${currentYear}`;
}

module.exports = PengajuanController;
