const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.post('/', ticketController.createTicket);
router.get('/my-tickets', ticketController.getMyTickets);
router.put('/:id', ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);
router.get('/league/:leagueId', ticketController.getTicketsByLeague);

module.exports = router;
