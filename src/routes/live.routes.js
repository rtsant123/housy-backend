const express = require('express');
const router = express.Router();
const liveController = require('../controllers/live.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Routes will be defined here
// Example:
// router.post('/example', protect, liveController.exampleMethod);

module.exports = router;
