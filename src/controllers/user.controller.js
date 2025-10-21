const User = require('../models/User');
const Ticket = require('../models/Ticket');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, photoUrl, email } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, photoUrl, email }, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadKyc = async (req, res) => {
  try {
    const { panNumber, aadhaarNumber, documents } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { 'kycDocuments.panNumber': panNumber, 'kycDocuments.aadhaarNumber': aadhaarNumber, 'kycDocuments.documents': documents, kycStatus: 'pending' }, { new: true }).select('-password');
    res.json({ success: true, message: 'KYC uploaded', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getKycStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('kycStatus kycVerified kycDocuments');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const totalGames = await Ticket.countDocuments({ userId: req.user.id });
    const wins = await Ticket.countDocuments({ userId: req.user.id, isWinner: true });
    const winnings = await Ticket.aggregate([{ $match: { userId: req.user.id, isWinner: true } }, { $group: { _id: null, total: { $sum: '$winAmount' } } }]);
    res.json({ success: true, data: { totalGames, wins, losses: totalGames - wins, totalWinnings: winnings[0]?.total || 0, winRate: totalGames > 0 ? ((wins / totalGames) * 100).toFixed(2) : 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { period = 'all', limit = 100 } = req.query;
    let dateFilter = {};
    if (period === 'weekly') dateFilter = { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    else if (period === 'monthly') dateFilter = { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };

    const leaderboard = await Ticket.aggregate([
      { $match: { isWinner: true, ...dateFilter } },
      { $group: { _id: '$userId', totalWins: { $sum: 1 }, totalWinnings: { $sum: '$winAmount' } } },
      { $sort: { totalWinnings: -1 } },
      { $limit: parseInt(limit) },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', photoUrl: '$user.photoUrl', totalWins: 1, totalWinnings: 1 } }
    ]);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
