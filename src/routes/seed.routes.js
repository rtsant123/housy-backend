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

    // Create sample games
    const now = new Date();
    const games = [];

    // Live game
    const liveGame = await Game.create({
      title: '🔴 Live Game - Morning Jackpot',
      description: 'Join now! Game in progress with ₹50,000 prize pool',
      entryFee: 100,
      prizePool: 50000,
      maxPlayers: 500,
      currentPlayers: 245,
      scheduledAt: new Date(now.getTime() - 10 * 60000),
      status: 'live',
      calledNumbers: [5, 12, 23, 34, 45, 56, 67, 78, 89, 7, 18],
      prizes: {
        earlyFive: 5000,
        topLine: 8000,
        middleLine: 8000,
        bottomLine: 8000,
        fullHouse: 20000,
      },
    });
    games.push(liveGame);

    // Upcoming games
    const upcomingGames = [
      {
        title: '⏰ Afternoon Special',
        description: 'Big prizes! Entry fee only ₹50',
        entryFee: 50,
        prizePool: 25000,
        maxPlayers: 500,
        currentPlayers: 120,
        scheduledAt: new Date(now.getTime() + 2 * 60 * 60000),
        status: 'upcoming',
        prizes: {
          earlyFive: 2500,
          topLine: 5000,
          middleLine: 5000,
          bottomLine: 5000,
          fullHouse: 7500,
        },
      },
      {
        title: '🌟 Evening Mega Jackpot',
        description: '₹1 Lakh prize pool! Limited seats',
        entryFee: 200,
        prizePool: 100000,
        maxPlayers: 500,
        currentPlayers: 350,
        scheduledAt: new Date(now.getTime() + 6 * 60 * 60000),
        status: 'upcoming',
        prizes: {
          earlyFive: 10000,
          topLine: 20000,
          middleLine: 20000,
          bottomLine: 20000,
          fullHouse: 30000,
        },
      },
      {
        title: '🌙 Night Express',
        description: 'Quick game with instant prizes',
        entryFee: 75,
        prizePool: 30000,
        maxPlayers: 400,
        currentPlayers: 85,
        scheduledAt: new Date(now.getTime() + 12 * 60 * 60000),
        status: 'upcoming',
        prizes: {
          earlyFive: 3000,
          topLine: 6000,
          middleLine: 6000,
          bottomLine: 6000,
          fullHouse: 9000,
        },
      },
    ];

    for (const gameData of upcomingGames) {
      const game = await Game.create(gameData);
      games.push(game);
    }

    // Completed game
    const completedGame = await Game.create({
      title: '✅ Morning Rush (Completed)',
      description: 'Yesterday\'s game - Check results',
      entryFee: 100,
      prizePool: 50000,
      maxPlayers: 500,
      currentPlayers: 500,
      scheduledAt: new Date(now.getTime() - 24 * 60 * 60000),
      status: 'completed',
      winners: {
        earlyFive: testUsers[0]?._id,
        topLine: testUsers[1]?._id,
        middleLine: testUsers[2]?._id,
        bottomLine: testUsers[3]?._id,
        fullHouse: testUsers[4]?._id,
      },
      prizes: {
        earlyFive: 5000,
        topLine: 10000,
        middleLine: 10000,
        bottomLine: 10000,
        fullHouse: 15000,
      },
    });
    games.push(completedGame);

    // Create leagues
    const leagues = [];

    const publicLeague = await League.create({
      name: 'Weekend Warriors',
      description: 'Open to all! Join and compete for top prizes',
      creatorId: testUsers[0]?._id,
      type: 'public',
      entryFee: 50,
      maxMembers: 100,
      members: testUsers.slice(0, 3).map(u => u._id),
      prizeDistribution: {
        first: 5000,
        second: 3000,
        third: 2000,
      },
      startDate: new Date(now.getTime() + 24 * 60 * 60000),
      endDate: new Date(now.getTime() + 3 * 24 * 60 * 60000),
    });
    leagues.push(publicLeague);

    const privateLeague = await League.create({
      name: 'Friends Circle',
      description: 'Private league for close friends',
      creatorId: testUsers[0]?._id,
      type: 'private',
      leagueCode: 'FRIENDS123',
      entryFee: 100,
      maxMembers: 50,
      members: testUsers.slice(0, 2).map(u => u._id),
      prizeDistribution: {
        first: 3000,
        second: 2000,
        third: 1000,
      },
      startDate: new Date(now.getTime() + 24 * 60 * 60000),
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60000),
    });
    leagues.push(privateLeague);

    // Create tickets for live game
    const tickets = [];
    for (let i = 0; i < Math.min(3, testUsers.length); i++) {
      const ticket = await Ticket.create({
        userId: testUsers[i]._id,
        gameId: liveGame._id,
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
