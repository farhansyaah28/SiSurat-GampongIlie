const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/UsersController');
const { verifyToken, verifyRole } = require('../middleware/auth');

// Only operator or kepala_desa can list users
router.get('/', verifyToken, verifyRole(['operator','kepala_desa']), UsersController.list);

// Operator/Kades can create a new citizen
router.post('/', verifyToken, verifyRole(['operator','kepala_desa']), UsersController.create);

// Operator/Kades can update citizen info
router.put('/:id', verifyToken, verifyRole(['operator','kepala_desa']), UsersController.update);

// Operator/Kades can reset citizen password
router.post('/:id/reset-password', verifyToken, verifyRole(['operator','kepala_desa']), UsersController.resetPassword);

module.exports = router;
