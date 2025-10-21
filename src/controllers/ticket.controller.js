const Ticket = require('../models/Ticket');
const Game = require('../models/Game');

exports.createTicket = async (req, res) => {
  try {
    const { gameId } = req.body;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    const ticket = await Ticket.create({ userId: req.user.id, gameId, price: game.entryFee });
    res.json({ success: true, message: 'Ticket created', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const { gameId, status } = req.query;
    let query = { userId: req.user.id };
    if (gameId) query.gameId = gameId;
    if (status) query.status = status;
    const tickets = await Ticket.find(query).populate('gameId').sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const { markedNumbers } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (ticket.userId.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    ticket.markedNumbers = markedNumbers;
    await ticket.save();
    res.json({ success: true, message: 'Ticket updated', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (ticket.userId.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    await ticket.remove();
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTicketsByLeague = async (req, res) => {
  try {
    const tickets = await Ticket.find({ leagueId: req.params.leagueId }).populate('userId', 'name photoUrl').populate('gameId');
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
