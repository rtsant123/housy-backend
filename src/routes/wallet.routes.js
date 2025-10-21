const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', walletController.getWallet);
router.post('/add-money', walletController.addMoney);
router.post('/withdraw', walletController.withdraw);
router.get('/transactions', walletController.getTransactions);
router.post('/payment-proof', walletController.uploadPaymentProof);
router.get('/payment-methods', walletController.getPaymentMethods);

module.exports = router;
