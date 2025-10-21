const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
    type: {
      type: String,
      enum: ['public', 'private'],
      required: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    entryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 2,
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    callingSpeed: {
      type: String,
      enum: ['slow', 'medium', 'fast'],
      default: 'medium',
    },
    callingInterval: {
      type: Number,
      default: 5000, // milliseconds
    },
    language: {
      type: String,
      enum: ['english', 'hindi'],
      default: 'english',
    },
    leagueCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    prizeDistribution: {
      winnerPercentage: {
        type: Number,
        default: 0.80, // 80%
      },
      platformPercentage: {
        type: Number,
        default: 0.20, // 20% for public, 10% for private
      },
      creatorPercentage: {
        type: Number,
        default: 0, // 10% for private leagues
      },
    },
    status: {
      type: String,
      enum: ['open', 'full', 'live', 'completed'],
      default: 'open',
    },
    calledNumbers: {
      type: [Number],
      default: [],
    },
    winners: {
      earlyFive: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
        prize: Number,
        declaredAt: Date,
      }],
      topLine: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
        prize: Number,
        declaredAt: Date,
      }],
      middleLine: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
        prize: Number,
        declaredAt: Date,
      }],
      bottomLine: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
        prize: Number,
        declaredAt: Date,
      }],
      fullHouse: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
        prize: Number,
        declaredAt: Date,
      }],
    },
    startTime: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Generate unique league code for private leagues
leagueSchema.pre('save', function (next) {
  if (this.type === 'private' && !this.leagueCode) {
    this.leagueCode = generateLeagueCode();
  }

  // Set prize distribution based on league type
  if (this.type === 'private') {
    this.prizeDistribution.platformPercentage = 0.10;
    this.prizeDistribution.creatorPercentage = 0.10;
  }

  // Update status based on participants
  if (this.participants.length >= this.maxParticipants) {
    this.status = 'full';
  }

  next();
});

// Generate random league code
function generateLeagueCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Indexes
leagueSchema.index({ gameId: 1, type: 1 });
leagueSchema.index({ leagueCode: 1 });
leagueSchema.index({ creatorId: 1 });
leagueSchema.index({ status: 1 });

// Virtual for total prize pool
leagueSchema.virtual('totalPrizePool').get(function () {
  return this.entryFee * this.participants.length;
});

// Check if league is joinable
leagueSchema.methods.isJoinable = function () {
  return this.status === 'open' && this.participants.length < this.maxParticipants;
};

const League = mongoose.model('League', leagueSchema);

module.exports = League;
