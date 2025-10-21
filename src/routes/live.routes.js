const express = require('express');
const router = express.Router();
const liveController = require('../controllers/live.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/state/:gameId', protect, liveController.getGameState);
router.get('/replay/:gameId', liveController.getReplay);
router.post('/start/:gameId', protect, authorize('admin'), liveController.startGame);
router.post('/call-number/:gameId', protect, authorize('admin'), liveController.callNumber);
router.post('/declare', protect, liveController.declarePattern);

module.exports = router;
