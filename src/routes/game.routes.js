const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Routes will be defined here
// Example:
// router.post('/example', protect, gameController.exampleMethod);

module.exports = router;
