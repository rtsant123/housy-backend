const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Routes will be defined here
// Example:
// router.post('/example', protect, userController.exampleMethod);

module.exports = router;
