const mongoose = require('mongoose');
const User = require('../models/User');
const Game = require('../models/Game');
const League = require('../models/League');
const Ticket = require('../models/Ticket');
require('dotenv').config();

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
    const numbersInCol = col === 8 ? 3 : Math.floor(Math.random() * 2) + 1; // Last column always has 3

    const numbers = [];
    while (numbers.length < numbersInCol) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!numbers.includes(num)) numbers.push(num);
    }
    numbers.sort((a, b) => a - b);

    // Distribute in rows
    for (let i = 0; i < numbersInCol && i < 3; i++) {
      ticket[i][col] = numbers[i];
    }
  }

  // Ensure each row has exactly 5 numbers
  for (let row = 0; row < 3; row++) {
    const count = ticket[row].filter(n => n !== null).length;

    if (count < 5) {
      // Add numbers to empty cells
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
      // Remove extra numbers
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

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data (except admin)
    await Game.deleteMany({});
    await League.deleteMany({});
    await Ticket.deleteMany({});
    console.log('🗑️  Cleared existing data\n');

    // Create test users
    console.log('👥 Creating test users...');
    const testUsers = [];
    for (let i = 1; i <= 5; i++) {
      const user = await User.create({
        name: `Test User ${i}`,
        phone: `+91888888888${i}`,
        email: `user${i}@test.com`,
        password: 'test123',
        balance: 5000,
      });
      testUsers.push(user);
      console.log(`   ✓ Created ${user.name} (${user.phone})`);
    }
    console.log('');

    // Create sample games
    console.log('🎮 Creating sample games...');
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
      scheduledAt: new Date(now.getTime() - 10 * 60000), // Started 10 min ago
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
    console.log(`   ✓ ${liveGame.title}`);

    // Upcoming games
    const upcomingGames = [
      {
        title: '⏰ Afternoon Special',
        description: 'Big prizes! Entry fee only ₹50',
        entryFee: 50,
        prizePool: 25000,
        maxPlayers: 500,
        currentPlayers: 120,
        scheduledAt: new Date(now.getTime() + 2 * 60 * 60000), // 2 hours from now
        status: 'upcoming',
      },
      {
        title: '🌟 Evening Mega Jackpot',
        description: '₹1 Lakh prize pool! Limited seats',
        entryFee: 200,
        prizePool: 100000,
        maxPlayers: 500,
        currentPlayers: 350,
        scheduledAt: new Date(now.getTime() + 6 * 60 * 60000), // 6 hours from now
        status: 'upcoming',
      },
      {
        title: '🌙 Night Express',
        description: 'Quick game with instant prizes',
        entryFee: 75,
        prizePool: 30000,
        maxPlayers: 400,
        currentPlayers: 85,
        scheduledAt: new Date(now.getTime() + 12 * 60 * 60000), // 12 hours from now
        status: 'upcoming',
      },
    ];

    for (const gameData of upcomingGames) {
      const game = await Game.create(gameData);
      games.push(game);
      console.log(`   ✓ ${game.title}`);
    }

    // Completed game
    const completedGame = await Game.create({
      title: '✅ Morning Rush (Completed)',
      description: 'Yesterday\'s game - Check results',
      entryFee: 100,
      prizePool: 50000,
      maxPlayers: 500,
      currentPlayers: 500,
      scheduledAt: new Date(now.getTime() - 24 * 60 * 60000), // Yesterday
      status: 'completed',
      winners: {
        earlyFive: testUsers[0]._id,
        topLine: testUsers[1]._id,
        middleLine: testUsers[2]._id,
        bottomLine: testUsers[3]._id,
        fullHouse: testUsers[4]._id,
      },
    });
    games.push(completedGame);
    console.log(`   ✓ ${completedGame.title}\n`);

    // Create leagues
    console.log('🏆 Creating leagues...');
    const leagues = [];

    const publicLeague = await League.create({
      name: 'Weekend Warriors',
      description: 'Open to all! Join and compete for top prizes',
      creatorId: testUsers[0]._id,
      type: 'public',
      entryFee: 50,
      maxMembers: 100,
      members: [testUsers[0]._id, testUsers[1]._id, testUsers[2]._id],
      prizeDistribution: {
        first: 5000,
        second: 3000,
        third: 2000,
      },
      startDate: new Date(now.getTime() + 24 * 60 * 60000), // Tomorrow
      endDate: new Date(now.getTime() + 3 * 24 * 60 * 60000), // 3 days
    });
    leagues.push(publicLeague);
    console.log(`   ✓ ${publicLeague.name} (Public)`);

    const privateLeague = await League.create({
      name: 'Friends Circle',
      description: 'Private league for close friends',
      creatorId: testUsers[0]._id,
      type: 'private',
      code: 'FRIENDS123',
      entryFee: 100,
      maxMembers: 50,
      members: [testUsers[0]._id, testUsers[1]._id],
      prizeDistribution: {
        first: 3000,
        second: 2000,
        third: 1000,
      },
      startDate: new Date(now.getTime() + 24 * 60 * 60000),
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60000), // 7 days
    });
    leagues.push(privateLeague);
    console.log(`   ✓ ${privateLeague.name} (Private - Code: ${privateLeague.code})\n`);

    // Create tickets for live game
    console.log('🎫 Creating sample tickets...');
    for (let i = 0; i < 3; i++) {
      const ticket = await Ticket.create({
        userId: testUsers[i]._id,
        gameId: liveGame._id,
        numbers: generateHousieTicket(),
        price: liveGame.entryFee,
        markedNumbers: i === 0 ? [5, 12, 23] : [], // First user has marked some
      });
      console.log(`   ✓ Ticket for ${testUsers[i].name}`);
    }
    console.log('');

    console.log('✅ Database seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • ${testUsers.length} test users created`);
    console.log(`   • ${games.length} games created (1 live, 3 upcoming, 1 completed)`);
    console.log(`   • ${leagues.length} leagues created (1 public, 1 private)`);
    console.log(`   • 3 sample tickets created\n`);

    console.log('🔑 Test Credentials:');
    console.log('   Admin: 9876543210 / admin123');
    for (let i = 0; i < testUsers.length; i++) {
      console.log(`   User ${i + 1}: ${testUsers[i].phone.replace('+91', '')} / test123`);
    }
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
