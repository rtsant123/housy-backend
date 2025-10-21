const Game = require('../models/Game');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

exports.getAllGames = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    let query = {};
    if (status) query.status = status;
    const games = await Game.find(query).sort({ scheduledTime: -1 }).limit(parseInt(limit));
    res.json({ success: true, data: games });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGameById = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    res.json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUpcomingGames = async (req, res) => {
  try {
    const games = await Game.find({ scheduledTime: { $gt: new Date() }, status: 'upcoming' }).sort({ scheduledTime: 1 }).limit(20);
    res.json({ success: true, data: games });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLiveGames = async (req, res) => {
  try {
    const games = await Game.find({ status: 'live' });
    res.json({ success: true, data: games });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompletedGames = async (req, res) => {
  try {
    const games = await Game.find({ status: 'completed' }).sort({ scheduledTime: -1 }).limit(50);
    res.json({ success: true, data: games });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyGames = async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user.id }).populate('gameId').sort({ createdAt: -1 });
    const games = [...new Set(tickets.map(t => t.gameId).filter(g => g))];
    res.json({ success: true, data: games });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.joinGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    if (game.status !== 'upcoming') return res.status(400).json({ success: false, message: 'Cannot join this game' });
    if (game.filledSpots >= game.maxSpots) return res.status(400).json({ success: false, message: 'Game is full' });

    const user = await User.findById(req.user.id);
    if (user.walletBalance < game.entryFee) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    user.walletBalance -= game.entryFee;
    await user.save();

    const ticket = await Ticket.create({ userId: req.user.id, gameId: game._id, price: game.entryFee });
    game.filledSpots += 1;
    await game.save();

    res.json({ success: true, message: 'Joined game successfully', data: { game, ticket } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
