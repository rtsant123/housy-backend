const Game = require('../models/Game');
const Ticket = require('../models/Ticket');

exports.startGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    game.status = 'live';
    game.startedAt = new Date();
    await game.save();
    const io = req.app.get('io');
    io.to(`game_${game._id}`).emit('game_started', { game });
    res.json({ success: true, message: 'Game started', data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.callNumber = async (req, res) => {
  try {
    const { number } = req.body;
    const game = await Game.findById(req.params.gameId);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    if (game.status !== 'live') return res.status(400).json({ success: false, message: 'Game is not live' });
    if (!game.calledNumbers.includes(number)) {
      game.calledNumbers.push(number);
      await game.save();
    }
    const io = req.app.get('io');
    io.to(`game_${game._id}`).emit('number_called', { number, calledNumbers: game.calledNumbers });
    res.json({ success: true, data: { number, calledNumbers: game.calledNumbers } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.declarePattern = async (req, res) => {
  try {
    const { gameId, ticketId, pattern } = req.body;
    const game = await Game.findById(gameId);
    const ticket = await Ticket.findById(ticketId);
    if (!game || !ticket) return res.status(404).json({ success: false, message: 'Game or ticket not found' });
    const io = req.app.get('io');
    io.to(`game_${gameId}`).emit('pattern_declared', { ticketId, pattern });
    res.json({ success: true, message: 'Pattern declared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGameState = async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    res.json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReplay = async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    if (game.status !== 'completed') return res.status(400).json({ success: false, message: 'Game not completed yet' });
    const tickets = await Ticket.find({ gameId: game._id }).populate('userId', 'name photoUrl');
    res.json({ success: true, data: { game, tickets } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
