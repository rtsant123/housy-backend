const Game = require('../models/Game');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Ticket = require('../models/Ticket');

exports.createGame = async (req, res) => {
  try {
    const game = await Game.create(req.body);
    res.json({ success: true, message: 'Game created', data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGame = async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    res.json({ success: true, message: 'Game updated', data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteGame = async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    res.json({ success: true, message: 'Game deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingPayments = async (req, res) => {
  try {
    const payments = await Transaction.find({ type: 'credit', status: 'pending' }).populate('userId', 'name phone email').sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approvePayment = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    transaction.status = 'completed';
    await transaction.save();
    const user = await User.findById(transaction.userId);
    user.walletBalance += transaction.amount;
    await user.save();
    res.json({ success: true, message: 'Payment approved', data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectPayment = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, { status: 'failed' }, { new: true });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, message: 'Payment rejected', data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUsersList = async (req, res) => {
  try {
    const { limit = 100, status } = req.query;
    let query = {};
    if (status) query.isActive = status === 'active';
    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalGames = await Game.countDocuments();
    const liveGames = await Game.countDocuments({ status: 'live' });
    const pendingPayments = await Transaction.countDocuments({ status: 'pending' });
    const totalRevenue = await Transaction.aggregate([{ $match: { type: 'credit', status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    res.json({ success: true, data: { totalUsers, activeUsers, totalGames, liveGames, pendingPayments, totalRevenue: totalRevenue[0]?.total || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.declareWinner = async (req, res) => {
  try {
    const { gameId, winnerTicketId, winningPattern, winAmount } = req.body;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    const ticket = await Ticket.findById(winnerTicketId);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    ticket.isWinner = true;
    ticket.winAmount = winAmount;
    ticket.winningPattern = winningPattern;
    await ticket.save();
    const user = await User.findById(ticket.userId);
    user.walletBalance += winAmount;
    await user.save();
    await Transaction.create({ userId: ticket.userId, type: 'credit', amount: winAmount, status: 'completed', description: `Won ${winningPattern} in game ${game.title}` });
    game.status = 'completed';
    await game.save();
    res.json({ success: true, message: 'Winner declared', data: { game, ticket } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
