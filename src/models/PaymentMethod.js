const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['upi', 'bankTransfer', 'paytm', 'phonePe', 'googlePay'],
      required: true,
    },
    details: {
      type: String,
      required: true, // UPI ID, Account Number, etc.
    },
    qrCodeUrl: {
      type: String, // URL to QR code image for UPI payments
    },
    instructions: {
      type: String,
      default: '', // Instructions for users on how to pay
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    minAmount: {
      type: Number,
      default: 10,
      min: 0,
    },
    maxAmount: {
      type: Number,
      default: 100000,
      min: 0,
    },
    processingTime: {
      type: String,
      default: '5-10 minutes', // Expected time for admin to process
    },
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
paymentMethodSchema.index({ isActive: 1 });

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod;
