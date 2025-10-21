const League = require('../models/League');

exports.createLeague = async (req, res) => {
  try {
    const league = await League.create({ ...req.body, creatorId: req.user.id });
    res.json({ success: true, message: 'League created', data: league });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLeague = async (req, res) => {
  try {
    const league = await League.findById(req.params.id).populate('creatorId', 'name photoUrl').populate('members.userId', 'name photoUrl');
    if (!league) return res.status(404).json({ success: false, message: 'League not found' });
    res.json({ success: true, data: league });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.joinLeague = async (req, res) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) return res.status(404).json({ success: false, message: 'League not found' });
    if (league.members.some(m => m.userId.toString() === req.user.id)) return res.status(400).json({ success: false, message: 'Already a member' });
    league.members.push({ userId: req.user.id });
    await league.save();
    res.json({ success: true, message: 'Joined league', data: league });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPublicLeagues = async (req, res) => {
  try {
    const leagues = await League.find({ visibility: 'public' }).populate('creatorId', 'name photoUrl').sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: leagues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyLeagues = async (req, res) => {
  try {
    const leagues = await League.find({ $or: [{ creatorId: req.user.id }, { 'members.userId': req.user.id }] }).populate('creatorId', 'name photoUrl');
    res.json({ success: true, data: leagues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.joinWithCode = async (req, res) => {
  try {
    const { code } = req.body;
    const league = await League.findOne({ code });
    if (!league) return res.status(404).json({ success: false, message: 'Invalid code' });
    if (league.members.some(m => m.userId.toString() === req.user.id)) return res.status(400).json({ success: false, message: 'Already a member' });
    league.members.push({ userId: req.user.id });
    await league.save();
    res.json({ success: true, message: 'Joined league', data: league });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
