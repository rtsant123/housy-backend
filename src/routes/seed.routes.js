const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Game = require('../models/Game');
const League = require('../models/League');
const Ticket = require('../models/Ticket');

const generateHousieTicket = () => {
  const ticket = Array(3).fill(null).map(() => Array(9).fill(null));

  // Column ranges for Housie
  const columnRanges = [
    [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
    [50, 59], [60, 69], [70, 79], [80, 90]
  ];

  // Generate numbers for each column
  for (let col = 0; col < 9; col++) {
    const [min, max] = columnRanges[col];
    const numbersInCol = col === 8 ? 3 : Math.floor(Math.random() * 2) + 1;

    const numbers = [];
    while (numbers.length < numbersInCol) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!numbers.includes(num)) numbers.push(num);
    }
    numbers.sort((a, b) => a - b);

    for (let i = 0; i < numbersInCol && i < 3; i++) {
      ticket[i][col] = numbers[i];
    }
  }

  // Ensure each row has exactly 5 numbers
  for (let row = 0; row < 3; row++) {
    const count = ticket[row].filter(n => n !== null).length;

    if (count < 5) {
      const emptyCols = [];
      for (let col = 0; col < 9; col++) {
        if (ticket[row][col] === null) emptyCols.push(col);
      }

      const toFill = emptyCols.slice(0, 5 - count);
      for (const col of toFill) {
        const [min, max] = columnRanges[col];
        let num;
        do {
          num = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (ticket.some(r => r.includes(num)));
        ticket[row][col] = num;
      }
    } else if (count > 5) {
      const filledCols = [];
      for (let col = 0; col < 9; col++) {
        if (ticket[row][col] !== null) filledCols.push(col);
      }

      const toRemove = filledCols.slice(0, count - 5);
      for (const col of toRemove) {
        ticket[row][col] = null;
      }
    }
  }

  return ticket;
};

router.post('/seed-database', async (req, res) => {
  try {
    // Clear existing data (except admin)
    await Game.deleteMany({});
    await League.deleteMany({});
    await Ticket.deleteMany({});

    // Create test users
    const testUsers = [];
    for (let i = 1; i <= 5; i++) {
      try {
        const user = await User.create({
          name: `Test User ${i}`,
          phone: `+91888888888${i}`,
          email: `user${i}@test.com`,
          password: 'test123',
          balance: 5000,
        });
        testUsers.push(user);
      } catch (err) {
        // User might already exist
        const user = await User.findOne({ phone: `+91888888888${i}` });
        if (user) testUsers.push(user);
      }
    }

    // Get admin user (or use first test user as creator)
    const admin = await User.findOne({ phone: '+919876543210' }) || testUsers[0];

    // Create sample games
    const now = new Date();
    const games = [];

    // Live game
    const liveGame = await Game.create({
      title: '🔴 Live Game - Morning Jackpot',
      entryFee: 100,
      prizePool: 50000,
      maxSpots: 500,
      filledSpots: 245,
      scheduledTime: new Date(now.getTime() - 10 * 60000),
      deadline: new Date(now.getTime() + 1 * 60 * 60000),
      status: 'live',
      calledNumbers: [5, 12, 23, 34, 45, 56, 67, 78, 89, 7, 18],
      createdBy: admin._id,
    });
    games.push(liveGame);

    // Upcoming games
    const upcomingGames = [
      {
        title: '⏰ Afternoon Special',
        entryFee: 50,
        prizePool: 25000,
        maxSpots: 500,
        filledSpots: 120,
        scheduledTime: new Date(now.getTime() + 2 * 60 * 60000),
        deadline: new Date(now.getTime() + 1.5 * 60 * 60000),
        status: 'upcoming',
        createdBy: admin._id,
      },
      {
        title: '🌟 Evening Mega Jackpot',
        entryFee: 200,
        prizePool: 100000,
        maxSpots: 500,
        filledSpots: 350,
        scheduledTime: new Date(now.getTime() + 6 * 60 * 60000),
        deadline: new Date(now.getTime() + 5.5 * 60 * 60000),
        status: 'upcoming',
        createdBy: admin._id,
      },
      {
        title: '🌙 Night Express',
        entryFee: 75,
        prizePool: 30000,
        maxSpots: 400,
        filledSpots: 85,
        scheduledTime: new Date(now.getTime() + 12 * 60 * 60000),
        deadline: new Date(now.getTime() + 11.5 * 60 * 60000),
        status: 'upcoming',
        createdBy: admin._id,
      },
    ];

    for (const gameData of upcomingGames) {
      const game = await Game.create(gameData);
      games.push(game);
    }

    // Completed game
    const completedGame = await Game.create({
      title: '✅ Morning Rush (Completed)',
      entryFee: 100,
      prizePool: 50000,
      maxSpots: 500,
      filledSpots: 500,
      scheduledTime: new Date(now.getTime() - 24 * 60 * 60000),
      deadline: new Date(now.getTime() - 24.5 * 60 * 60000),
      status: 'completed',
      createdBy: admin._id,
      completedAt: new Date(now.getTime() - 23 * 60 * 60000),
    });
    games.push(completedGame);

    // Create leagues
    const leagues = [];

    const publicLeague = await League.create({
      gameId: games[1]._id, // Link to first upcoming game
      type: 'public',
      creatorId: testUsers[0]?._id,
      entryFee: 50,
      maxParticipants: 100,
      participants: testUsers.slice(0, 3).map(u => u._id),
      status: 'open',
    });
    leagues.push(publicLeague);

    const privateLeague = await League.create({
      gameId: games[2]._id, // Link to second upcoming game
      type: 'private',
      creatorId: testUsers[0]?._id,
      leagueCode: 'FRIENDS123',
      entryFee: 100,
      maxParticipants: 50,
      participants: testUsers.slice(0, 2).map(u => u._id),
      status: 'open',
    });
    leagues.push(privateLeague);

    // Create tickets for live game and league
    const tickets = [];
    for (let i = 0; i < Math.min(3, testUsers.length); i++) {
      const ticket = await Ticket.create({
        userId: testUsers[i]._id,
        gameId: liveGame._id,
        leagueId: publicLeague._id,
        numbers: generateHousieTicket(),
        price: liveGame.entryFee,
        markedNumbers: i === 0 ? [5, 12, 23] : [],
      });
      tickets.push(ticket);
    }

    res.json({
      success: true,
      message: 'Database seeded successfully!',
      data: {
        users: testUsers.length,
        games: games.length,
        leagues: leagues.length,
        tickets: tickets.length,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding database',
      error: error.message,
    });
  }
});

module.exports = router;
