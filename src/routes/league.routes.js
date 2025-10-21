const express = require('express');
const router = express.Router();
const leagueController = require('../controllers/league.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/public', leagueController.getPublicLeagues);
router.get('/:id', leagueController.getLeague);
router.use(protect);
router.post('/', leagueController.createLeague);
router.post('/:id/join', leagueController.joinLeague);
router.get('/my/leagues', leagueController.getMyLeagues);
router.post('/join-with-code', leagueController.joinWithCode);

module.exports = router;
