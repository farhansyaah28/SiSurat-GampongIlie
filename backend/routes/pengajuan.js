const express = require('express');
const router = express.Router();
const PengajuanController = require('../controllers/PengajuanController');
const { verifyToken, verifyRole } = require('../middleware/auth');
const upload = require('../config/upload');
const { check } = require('express-validator');
const validators = require('../middleware/validators');

// Warga: buat pengajuan dan lihat pengajuan sendiri
router.post('/', verifyToken, PengajuanController.create);
router.get('/me', verifyToken, PengajuanController.getMyPengajuan);
router.get('/stats', verifyToken, PengajuanController.getStats);
router.get('/:id', verifyToken, PengajuanController.getById);
router.put('/:id', verifyToken, PengajuanController.update);

// Upload file pendukung (warga)
router.post('/:id/upload', verifyToken, upload.any(), PengajuanController.uploadFile);
// Download file pendukung
router.get('/:id/download', verifyToken, PengajuanController.downloadFile);
// Riwayat cetak
router.get('/:id/riwayat', verifyToken, verifyRole(['operator', 'kepala_desa', 'warga']), PengajuanController.getRiwayat);
// List uploads for a pengajuan (file path)
router.get('/:id/files', verifyToken, PengajuanController.listUploads);

// Operator / Kepala Desa: lihat semua pengajuan
router.get('/', verifyToken, verifyRole(['operator', 'kepala_desa']), PengajuanController.getAll);

// Verifikasi (operator)
router.put(
	'/:id/verifikasi',
	verifyToken,
	verifyRole(['operator']),
	[check('status').isIn(['terverifikasi','ditolak']).withMessage('Status tidak valid')],
	validators,
	PengajuanController.verifikasi
);

// Persetujuan (kepala desa)
router.put(
	'/:id/approve',
	verifyToken,
	verifyRole(['kepala_desa']),
	[check('nomor_surat').optional({ checkFalsy: true })],
	validators,
	PengajuanController.approve
);

// Penolakan (operator / kepala_desa)
router.put(
	'/:id/reject',
	verifyToken,
	verifyRole(['operator', 'kepala_desa']),
	[check('catatan_ditolak').notEmpty().withMessage('Catatan penolakan harus diisi')],
	validators,
	PengajuanController.reject
);

// Generate PDF surat (operator/kepala_desa)
router.post('/:id/generate', verifyToken, verifyRole(['operator', 'kepala_desa']), PengajuanController.generatePDF);

// Pengajuan atas nama warga (operator/kepala_desa)
router.post('/on-behalf', verifyToken, verifyRole(['operator', 'kepala_desa']), PengajuanController.onBehalf);

module.exports = router;
