const express = require('express');
const router = express.Router();
const JenisSuratController = require('../controllers/JenisSuratController');
const { verifyToken, verifyRole } = require('../middleware/auth');
const { check } = require('express-validator');
const validators = require('../middleware/validators');

const upload = require('../config/upload');

router.get('/', JenisSuratController.getAll);
router.get('/:id', JenisSuratController.getById);

// Protected routes for creating/updating/deleting jenis_surat
router.post(
	'/',
	verifyToken,
	verifyRole(['operator','kepala_desa']),
	upload.single('template'),
	[check('nama_jenis').notEmpty().withMessage('Nama jenis harus diisi')],
	validators,
	JenisSuratController.create
);

router.put(
	'/:id',
	verifyToken,
	verifyRole(['operator','kepala_desa']),
	upload.single('template'),
	[check('nama_jenis').notEmpty().withMessage('Nama jenis harus diisi')],
	validators,
	JenisSuratController.update
);

router.delete('/:id', verifyToken, verifyRole(['operator','kepala_desa']), JenisSuratController.remove);

module.exports = router;
