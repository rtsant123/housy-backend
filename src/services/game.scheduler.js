const Game = require('../models/Game');

class GameScheduler {
  constructor(io) {
    this.io = io;
    this.activeGames = new Map(); // gameId -> interval
    this.callingSpeed = 5000; // 5 seconds between numbers
  }

  // Start scheduler - check every minute for games to start
  start() {
    console.log('🎮 Game Scheduler started');

    // Check every 30 seconds for games that should start
    setInterval(() => {
      this.checkAndStartGames();
    }, 30000);

    // Initial check
    this.checkAndStartGames();
  }

  async checkAndStartGames() {
    try {
      const now = new Date();

      // Find games that are past deadline but not started
      const gamesToStart = await Game.find({
        status: 'upcoming',
        deadline: { $lte: now },
      });

      for (const game of gamesToStart) {
        console.log(`🚀 Auto-starting game: ${game.title}`);
        await this.startGame(game._id.toString());
      }
    } catch (error) {
      console.error('Error checking games:', error);
    }
  }

  async startGame(gameId) {
    try {
      const game = await Game.findById(gameId);
      if (!game) return;

      // Update game status
      game.status = 'live';
      game.startedAt = new Date();
      await game.save();

      // Broadcast game started
      this.io.to(`game_${gameId}`).emit('game_started', {
        game,
        message: 'Game is starting! Get ready! 🎉',
      });

      // Send welcome message
      setTimeout(() => {
        this.io.to(`game_${gameId}`).emit('announcement', {
          type: 'welcome',
          message: `Welcome to ${game.title}! Prize Pool: ₹${game.prizePool}`,
        });
      }, 2000);

      // Start auto-calling numbers
      setTimeout(() => {
        this.startAutoCalling(gameId);
      }, 5000);

    } catch (error) {
      console.error('Error starting game:', error);
    }
  }

  startAutoCalling(gameId) {
    console.log(`📢 Starting auto-calling for game: ${gameId}`);

    const interval = setInterval(async () => {
      try {
        const game = await Game.findById(gameId);
        if (!game || game.status !== 'live') {
          this.stopAutoCalling(gameId);
          return;
        }

        // Get remaining numbers
        const allNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
        const remaining = allNumbers.filter(n => !game.calledNumbers.includes(n));

        if (remaining.length === 0) {
          // Game complete
          await this.completeGame(gameId);
          this.stopAutoCalling(gameId);
          return;
        }

        // Pick random number
        const number = remaining[Math.floor(Math.random() * remaining.length)];

        // Add to called numbers
        game.calledNumbers.push(number);
        await game.save();

        // Broadcast number
        this.io.to(`game_${gameId}`).emit('number_called', {
          number,
          calledNumbers: game.calledNumbers,
          remaining: remaining.length - 1,
        });

        console.log(`📢 Game ${gameId}: Called number ${number} (${game.calledNumbers.length}/90)`);

      } catch (error) {
        console.error('Error auto-calling number:', error);
        this.stopAutoCalling(gameId);
      }
    }, this.callingSpeed);

    this.activeGames.set(gameId, interval);
  }

  stopAutoCalling(gameId) {
    const interval = this.activeGames.get(gameId);
    if (interval) {
      clearInterval(interval);
      this.activeGames.delete(gameId);
      console.log(`⏹️ Stopped auto-calling for game: ${gameId}`);
    }
  }

  async completeGame(gameId) {
    try {
      const game = await Game.findById(gameId);
      if (!game) return;

      game.status = 'completed';
      game.completedAt = new Date();
      await game.save();

      // Broadcast game completed
      this.io.to(`game_${gameId}`).emit('game_completed', {
        game,
        message: 'Game completed! Thank you for playing! 🎊',
      });

      console.log(`✅ Game completed: ${game.title}`);
    } catch (error) {
      console.error('Error completing game:', error);
    }
  }

  // Manual controls
  async pauseGame(gameId) {
    this.stopAutoCalling(gameId);
    const game = await Game.findById(gameId);
    if (game) {
      this.io.to(`game_${gameId}`).emit('game_paused', {
        message: 'Game paused by admin',
      });
    }
  }

  async resumeGame(gameId) {
    const game = await Game.findById(gameId);
    if (game && game.status === 'live') {
      this.startAutoCalling(gameId);
      this.io.to(`game_${gameId}`).emit('game_resumed', {
        message: 'Game resumed!',
      });
    }
  }

  setCallingSpeed(speed) {
    // speed: 'slow' = 8s, 'medium' = 5s, 'fast' = 3s
    const speeds = {
      slow: 8000,
      medium: 5000,
      fast: 3000,
    };
    this.callingSpeed = speeds[speed] || 5000;
    console.log(`⏱️ Calling speed set to: ${speed} (${this.callingSpeed}ms)`);
  }
}

module.exports = GameScheduler;
