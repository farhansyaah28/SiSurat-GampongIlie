const pool = require('../config/database');
const PengajuanSurat = require('../models/PengajuanSurat');
const PengajuanController = require('../controllers/PengajuanController');
const fs = require('fs');
const path = require('path');

async function testDynamicLetters() {
  console.log('=== START TESTING DYNAMIC LETTERS AND PDF GENERATION ===');
  
  try {
    // 1. Get a citizen
    const [users] = await pool.execute("SELECT id_user, nama FROM users WHERE role = 'warga' LIMIT 1");
    if (!users.length) {
      throw new Error('No citizens found to run tests. Please run seeding first.');
    }
    const citizen = users[0];
    console.log(`Using citizen: ${citizen.nama} (ID: ${citizen.id_user})`);

    // 2. Get Surat Keterangan Usahu / Usaha jenis
    const [jenis] = await pool.execute("SELECT id_jenis, nama_jenis FROM jenis_surat WHERE LOWER(nama_jenis) LIKE '%usaha%' LIMIT 1");
    if (!jenis.length) {
      throw new Error('No "Surat Keterangan Usaha" template found in database.');
    }
    const targetJenis = jenis[0];
    console.log(`Using letter type: ${targetJenis.nama_jenis} (ID: ${targetJenis.id_jenis})`);

    // 3. Create dynamic JSON payload
    const mockFields = {
      nama_usaha: 'Warung Kopi Beusaba Keren',
      alamat_usaha: 'Jalan Tgk Direuleung Dusun Meunasah Tuha Gampong Ilie',
      jenis_usaha: 'Warkop & Kuliner Tradisional'
    };
    const keteranganJson = JSON.stringify({
      is_dynamic: true,
      keterangan_tambahan: 'Ini adalah catatan tambahan opsional untuk keperluan izin usaha',
      fields: mockFields
    });

    console.log('Inserting dynamic pengajuan...');
    const insertRes = await PengajuanSurat.create({
      id_user: citizen.id_user,
      id_jenis: targetJenis.id_jenis,
      keperluan: 'Syarat Pengajuan Kredit Usaha Rakyat (KUR)',
      keterangan: keteranganJson
    });
    const pengajuanId = insertRes.insertId;
    console.log(`Pengajuan created successfully with ID: ${pengajuanId}`);

    // 4. Update status to 'disetujui' and set nomor_surat
    const mockNomor = `102/KU/GI-UK/${new Date().getFullYear()}`;
    await pool.execute(
      "UPDATE pengajuan_surat SET status = 'disetujui', nomor_surat = ?, tanggal_disetujui = CURRENT_TIMESTAMP WHERE id_pengajuan = ?",
      [mockNomor, pengajuanId]
    );
    console.log(`Updated status to 'disetujui' with nomor_surat: ${mockNomor}`);

    // 5. Generate PDF using the backend controller helper
    console.log('Generating PDF...');
    const mockUser = {
      id_user: 1,
      nama: 'Muhammad Nur',
      role: 'kepala_desa',
      nik: '1171012345670001'
    };
    
    const pdfPath = await PengajuanController.generatePDFHelper(pengajuanId, mockUser, '127.0.0.1');
    console.log(`PDF Generated successfully! Path: ${pdfPath}`);

    // 6. Verify file exists on disk
    const absolutePdfPath = path.join(__dirname, '..', pdfPath.replace(/^\//, ''));
    const exists = fs.existsSync(absolutePdfPath);
    console.log(`Checking physical file existence: ${exists ? 'SUCCESS (File Exists)' : 'FAILED (File Not Found)'}`);
    
    if (exists) {
      const stats = fs.statSync(absolutePdfPath);
      console.log(`File size: ${stats.size} bytes`);
    } else {
      throw new Error('PDF file was not physically created on disk.');
    }

    console.log('=== TEST DYNAMIC LETTERS COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  } finally {
    pool.end();
  }
}

testDynamicLetters();
