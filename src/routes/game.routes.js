const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', gameController.getAllGames);
router.get('/upcoming', gameController.getUpcomingGames);
router.get('/live', gameController.getLiveGames);
router.get('/completed', gameController.getCompletedGames);
router.get('/:id', gameController.getGameById);
router.get('/my/games', protect, gameController.getMyGames);
router.post('/:id/join', protect, gameController.joinGame);

module.exports = router;
