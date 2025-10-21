const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Game title is required'],
      trim: true,
    },
    scheduledTime: {
      type: Date,
      required: [true, 'Scheduled time is required'],
    },
    entryFee: {
      type: Number,
      required: [true, 'Entry fee is required'],
      min: 0,
    },
    prizePool: {
      type: Number,
      required: [true, 'Prize pool is required'],
      min: 0,
    },
    maxSpots: {
      type: Number,
      required: [true, 'Max spots is required'],
      min: 1,
    },
    filledSpots: {
      type: Number,
      default: 0,
      min: 0,
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed', 'cancelled'],
      default: 'upcoming',
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
    prizeDistribution: {
      earlyFive: {
        type: Number,
        default: 0.10, // 10% of pool
      },
      topLine: {
        type: Number,
        default: 0.15, // 15% of pool
      },
      middleLine: {
        type: Number,
        default: 0.15, // 15% of pool
      },
      bottomLine: {
        type: Number,
        default: 0.15, // 15% of pool
      },
      fullHouse: {
        type: Number,
        default: 0.25, // 25% of pool
      },
    },
    startedAt: Date,
    completedAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
gameSchema.index({ status: 1, scheduledTime: 1 });
gameSchema.index({ createdBy: 1 });

// Virtual for available spots
gameSchema.virtual('availableSpots').get(function () {
  return this.maxSpots - this.filledSpots;
});

// Check if game is joinable
gameSchema.methods.isJoinable = function () {
  return (
    this.status === 'upcoming' &&
    this.filledSpots < this.maxSpots &&
    new Date() < this.deadline
  );
};

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
