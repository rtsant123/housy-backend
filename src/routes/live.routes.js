const express = require('express');
const router = express.Router();
const liveController = require('../controllers/live.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/game/:gameId', liveController.getGameState);
router.get('/replay/:gameId', liveController.getReplay);
router.post('/start/:gameId', protect, authorize('admin'), liveController.startGame);
router.post('/call/:gameId', liveController.callNumber);
router.post('/claim-pattern', protect, liveController.claimPattern);
router.post('/declare', protect, liveController.declarePattern); // Deprecated

module.exports = router;
