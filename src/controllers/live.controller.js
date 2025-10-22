const Game = require('../models/Game');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

exports.startGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    game.status = 'live';
    game.startedAt = new Date();
    await game.save();
    const io = req.app.get('io');
    io.to(`game_${game._id}`).emit('game_started', { game });
    res.json({ success: true, message: 'Game started', data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.callNumber = async (req, res) => {
  try {
    const { number } = req.body;
    const game = await Game.findById(req.params.gameId);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    if (game.status !== 'live') return res.status(400).json({ success: false, message: 'Game is not live' });

    if (!game.calledNumbers.includes(number)) {
      game.calledNumbers.push(number);
      await game.save();

      // Auto-mark number on all tickets
      const tickets = await Ticket.find({ gameId: game._id });
      for (const ticket of tickets) {
        if (ticket.hasNumber(number) && !ticket.markedNumbers.includes(number)) {
          ticket.markNumber(number);
          await ticket.save();
        }
      }
    }

    const io = req.app.get('io');
    io.to(`game_${game._id}`).emit('number_called', { number, calledNumbers: game.calledNumbers });
    res.json({ success: true, data: { number, calledNumbers: game.calledNumbers } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.claimPattern = async (req, res) => {
  try {
    const { ticketId, pattern } = req.body;

    const ticket = await Ticket.findById(ticketId).populate('userId', 'name phone');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const game = await Game.findById(ticket.gameId);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });

    if (game.status !== 'live') {
      return res.status(400).json({ success: false, message: 'Game is not live' });
    }

    // Check if pattern already claimed by this ticket
    if (ticket.patterns[pattern]) {
      return res.status(400).json({ success: false, message: 'Pattern already claimed' });
    }

    // Verify pattern is actually complete
    if (!ticket.checkPattern(pattern)) {
      return res.status(400).json({ success: false, message: 'Pattern not complete' });
    }

    // Verify all marked numbers have been called
    for (const markedNum of ticket.markedNumbers) {
      if (!game.calledNumbers.includes(markedNum)) {
        return res.status(400).json({ success: false, message: 'Invalid claim: uncalled numbers marked' });
      }
    }

    // Check if pattern already has a winner (only first claim wins)
    if (game.winners[pattern] && game.winners[pattern].length > 0) {
      return res.status(400).json({ success: false, message: 'Pattern already won by someone else' });
    }

    // Calculate prize
    const prizePercentage = game.prizeDistribution[pattern];
    const prize = Math.floor(game.prizePool * prizePercentage);

    // Update ticket
    ticket.patterns[pattern] = true;
    ticket.patternTimes[pattern] = new Date();
    await ticket.save();

    // Update game winners
    game.winners[pattern].push({
      userId: ticket.userId,
      ticketId: ticket._id,
      prize,
      declaredAt: new Date(),
    });
    await game.save();

    // Update user wallet
    const user = await User.findById(ticket.userId);
    if (user) {
      user.balance += prize;
      await user.save();
    }

    // Broadcast winner announcement
    const io = req.app.get('io');
    io.to(`game_${game._id}`).emit('pattern_won', {
      pattern,
      winner: {
        name: ticket.userId.name,
        phone: ticket.userId.phone,
        prize,
      },
      ticketId: ticket._id,
    });

    res.json({
      success: true,
      message: `Congratulations! You won ${pattern}`,
      data: {
        pattern,
        prize,
        totalWinnings: prize,
      },
    });
  } catch (error) {
    console.error('Claim pattern error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Deprecated - use claimPattern instead
exports.declarePattern = async (req, res) => {
  try {
    const { gameId, ticketId, pattern } = req.body;
    const game = await Game.findById(gameId);
    const ticket = await Ticket.findById(ticketId);
    if (!game || !ticket) return res.status(404).json({ success: false, message: 'Game or ticket not found' });
    const io = req.app.get('io');
    io.to(`game_${gameId}`).emit('pattern_declared', { ticketId, pattern });
    res.json({ success: true, message: 'Pattern declared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGameState = async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    res.json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReplay = async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    if (game.status !== 'completed') return res.status(400).json({ success: false, message: 'Game not completed yet' });
    const tickets = await Ticket.find({ gameId: game._id }).populate('userId', 'name photoUrl');
    res.json({ success: true, data: { game, tickets } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
