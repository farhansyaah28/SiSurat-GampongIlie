const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { verifyToken } = require('../middleware/auth');


router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/download-formulir-biodata', AuthController.downloadFormulirBiodata);
router.get('/profile', verifyToken, AuthController.getProfile);
router.put('/profile', verifyToken, AuthController.updateProfile);

module.exports = router;
