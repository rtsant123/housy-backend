const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Routes will be defined here
// Example:
// router.post('/example', protect, ticketController.exampleMethod);

module.exports = router;
