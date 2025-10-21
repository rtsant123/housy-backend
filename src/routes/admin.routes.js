const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.use(authorize('admin'));
router.post('/games', adminController.createGame);
router.put('/games/:id', adminController.updateGame);
router.delete('/games/:id', adminController.deleteGame);
router.get('/payments/pending', adminController.getPendingPayments);
router.put('/payments/:id/approve', adminController.approvePayment);
router.put('/payments/:id/reject', adminController.rejectPayment);
router.get('/users', adminController.getUsersList);
router.get('/dashboard/stats', adminController.getDashboardStats);
router.post('/declare-winner', adminController.declareWinner);

module.exports = router;
