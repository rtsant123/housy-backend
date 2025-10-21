const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
    leagueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'League',
      required: true,
    },
    // 3x9 grid - Each row is an array of 9 numbers (null for empty cells)
    numbers: {
      type: [[Number]],
      required: true,
      validate: {
        validator: function (grid) {
          // Must be 3 rows
          if (grid.length !== 3) return false;

          // Each row must have 9 columns
          for (let row of grid) {
            if (row.length !== 9) return false;

            // Count non-null numbers in row
            const count = row.filter(n => n !== null).length;
            if (count !== 5) return false; // Each row must have exactly 5 numbers
          }

          // Collect all numbers and check for duplicates
          const allNumbers = [];
          for (let row of grid) {
            for (let num of row) {
              if (num !== null) {
                if (allNumbers.includes(num)) return false; // Duplicate found
                allNumbers.push(num);
              }
            }
          }

          return allNumbers.length === 15; // Total 15 numbers
        },
        message: 'Invalid ticket structure',
      },
    },
    markedNumbers: {
      type: [Number],
      default: [],
    },
    patterns: {
      earlyFive: {
        type: Boolean,
        default: false,
      },
      topLine: {
        type: Boolean,
        default: false,
      },
      middleLine: {
        type: Boolean,
        default: false,
      },
      bottomLine: {
        type: Boolean,
        default: false,
      },
      fullHouse: {
        type: Boolean,
        default: false,
      },
    },
    patternTimes: {
      earlyFive: Date,
      topLine: Date,
      middleLine: Date,
      bottomLine: Date,
      fullHouse: Date,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Get all numbers from ticket (excluding nulls)
ticketSchema.methods.getAllNumbers = function () {
  const numbers = [];
  for (let row of this.numbers) {
    for (let num of row) {
      if (num !== null) {
        numbers.push(num);
      }
    }
  }
  return numbers;
};

// Check if ticket has a specific number
ticketSchema.methods.hasNumber = function (number) {
  return this.getAllNumbers().includes(number);
};

// Mark a number on the ticket
ticketSchema.methods.markNumber = function (number) {
  if (this.hasNumber(number) && !this.markedNumbers.includes(number)) {
    this.markedNumbers.push(number);
  }
};

// Check if a specific pattern is complete
ticketSchema.methods.checkPattern = function (pattern) {
  switch (pattern) {
    case 'earlyFive':
      return this.markedNumbers.length >= 5;

    case 'topLine':
      return this.isLineComplete(0);

    case 'middleLine':
      return this.isLineComplete(1);

    case 'bottomLine':
      return this.isLineComplete(2);

    case 'fullHouse':
      return this.markedNumbers.length === 15;

    default:
      return false;
  }
};

// Check if a specific row is complete
ticketSchema.methods.isLineComplete = function (rowIndex) {
  const row = this.numbers[rowIndex];
  const rowNumbers = row.filter(n => n !== null);
  return rowNumbers.every(n => this.markedNumbers.includes(n));
};

// Indexes
ticketSchema.index({ userId: 1 });
ticketSchema.index({ gameId: 1 });
ticketSchema.index({ leagueId: 1 });
ticketSchema.index({ userId: 1, gameId: 1, leagueId: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
