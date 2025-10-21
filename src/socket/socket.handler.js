// Socket.io event handler for real-time game functionality

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Join a game room
    socket.on('join_game', ({ gameId, userId }) => {
      socket.join(`game_${gameId}`);
      console.log(`User ${userId} joined game ${gameId}`);

      // Notify others in the room
      socket.to(`game_${gameId}`).emit('player_joined', {
        userId,
        message: 'A new player has joined',
      });
    });

    // Leave a game room
    socket.on('leave_game', ({ gameId, userId }) => {
      socket.leave(`game_${gameId}`);
      console.log(`User ${userId} left game ${gameId}`);
    });

    // Number called event (from server to clients)
    // This would be triggered by the automated calling service
    socket.on('call_number', ({ gameId, number, language }) => {
      io.to(`game_${gameId}`).emit('number_called', {
        number,
        language,
        timestamp: new Date(),
      });
    });

    // Pattern declared by a player
    socket.on('declare_pattern', async ({ gameId, leagueId, ticketId, pattern, userId }) => {
      console.log(`Pattern declared: ${pattern} by ${userId} in game ${gameId}`);

      // Emit to all players in the game
      io.to(`game_${gameId}`).emit('pattern_declared', {
        gameId,
        leagueId,
        ticketId,
        pattern,
        userId,
        timestamp: new Date(),
      });

      // Server should validate the declaration and update the database
      // Then emit the winner announcement if valid
    });

    // Winner announcement
    socket.on('announce_winner', ({ gameId, leagueId, pattern, winner }) => {
      io.to(`game_${gameId}`).emit('winner_announced', {
        leagueId,
        pattern,
        winner,
        timestamp: new Date(),
      });
    });

    // Game ended
    socket.on('end_game', ({ gameId, results }) => {
      io.to(`game_${gameId}`).emit('game_ended', {
        gameId,
        results,
        timestamp: new Date(),
      });
    });

    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Helper function to emit number to a specific game
  io.emitNumberToGame = (gameId, number, language = 'english') => {
    io.to(`game_${gameId}`).emit('number_called', {
      number,
      language,
      timestamp: new Date(),
    });
  };

  // Helper function to announce winner
  io.announceWinner = (gameId, pattern, winner) => {
    io.to(`game_${gameId}`).emit('winner_announced', {
      pattern,
      winner,
      timestamp: new Date(),
    });
  };

  // Helper function to end game
  io.endGame = (gameId, results) => {
    io.to(`game_${gameId}`).emit('game_ended', {
      gameId,
      results,
      timestamp: new Date(),
    });
  };
};
