const User = require('../models/User');
const Transaction = require('../models/Transaction');

exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance');
    res.json({ success: true, data: { balance: user.walletBalance } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addMoney = async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId, paymentProof } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const transaction = await Transaction.create({ userId: req.user.id, type: 'credit', amount, status: 'pending', paymentMethod, transactionId, paymentProof, description: 'Add money to wallet' });
    res.json({ success: true, message: 'Payment request submitted. Admin will approve shortly.', data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const user = await User.findById(req.user.id);
    if (user.walletBalance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    user.walletBalance -= amount;
    await user.save();

    const transaction = await Transaction.create({ userId: req.user.id, type: 'debit', amount, status: 'pending', bankDetails, description: 'Withdraw from wallet' });
    res.json({ success: true, message: 'Withdrawal request submitted', data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { limit = 50, type } = req.query;
    let query = { userId: req.user.id };
    if (type) query.type = type;
    const transactions = await Transaction.find(query).sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadPaymentProof = async (req, res) => {
  try {
    const { transactionId, paymentProof } = req.body;
    const transaction = await Transaction.findByIdAndUpdate(transactionId, { paymentProof }, { new: true });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, message: 'Payment proof uploaded', data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPaymentMethods = async (req, res) => {
  try {
    const PaymentMethod = require('../models/PaymentMethod');
    const methods = await PaymentMethod.find({ isActive: true });
    res.json({ success: true, data: methods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
