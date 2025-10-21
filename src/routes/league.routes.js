const express = require('express');
const router = express.Router();
const leagueController = require('../controllers/league.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Routes will be defined here
// Example:
// router.post('/example', protect, leagueController.exampleMethod);

module.exports = router;
