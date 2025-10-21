const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/kyc', userController.uploadKyc);
router.get('/kyc/status', userController.getKycStatus);
router.get('/stats', userController.getUserStats);
router.get('/leaderboard', userController.getLeaderboard);

module.exports = router;
