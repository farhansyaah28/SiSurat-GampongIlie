const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const sse = require('../config/sse');

router.get('/stream', verifyToken, (req, res) => {
  sse.addClient(req, res);
});

module.exports = router;
