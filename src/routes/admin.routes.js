const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Routes will be defined here
// Example:
// router.post('/example', protect, adminController.exampleMethod);

module.exports = router;
