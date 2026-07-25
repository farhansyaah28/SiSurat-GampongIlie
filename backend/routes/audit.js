const express = require('express');
const router = express.Router();
const AuditLogController = require('../controllers/AuditLogController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', verifyToken, verifyRole(['operator', 'kepala_desa']), AuditLogController.getAll);

module.exports = router;
