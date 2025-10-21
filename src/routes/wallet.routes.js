const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Routes will be defined here
// Example:
// router.post('/example', protect, walletController.exampleMethod);

module.exports = router;
