const mongoose = require("mongoose");

/**
 * PaymentHistory Schema
 * Standalone schema for payment transactions (optional, for future scaling)
 * Currently embedded in Booking model, but can be migrated to separate collection
 */
const PaymentHistorySchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    // Transaction details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ["vnpay", "cash", "bank_transfer", "credit_card", "debit_card"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "cancelled"],
      default: "paid",
    },
    transactionId: {
      type: String,
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ["deposit", "partial", "full", "remaining", "refund", "adjustment"],
      required: true,
    },
    // Payment metadata
    paidAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
      maxlength: 500,
    },
    // For refunds
    refundedAt: {
      type: Date,
      default: null,
    },
    refundReason: {
      type: String,
      default: "",
    },
    // Recorded by (for manual payments)
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // VNPay specific fields
    vnpayData: {
      vnp_TransactionNo: String,
      vnp_BankCode: String,
      vnp_CardType: String,
      vnp_OrderInfo: String,
      vnp_PayDate: String,
    },
  },
  {
    timestamps: true,
    // Add indexes for common queries
    indexes: [
      { bookingId: 1, createdAt: -1 },
      { customerId: 1, createdAt: -1 },
      { hostId: 1, createdAt: -1 },
      { status: 1, createdAt: -1 },
    ],
  }
);

// Indexes
PaymentHistorySchema.index({ bookingId: 1, createdAt: -1 });
PaymentHistorySchema.index({ customerId: 1, createdAt: -1 });
PaymentHistorySchema.index({ hostId: 1, createdAt: -1 });
PaymentHistorySchema.index({ transactionId: 1 });

// Virtual for formatted amount
PaymentHistorySchema.virtual('formattedAmount').get(function() {
  return this.amount.toLocaleString('vi-VN');
});

// Instance methods
PaymentHistorySchema.methods.isSuccessful = function() {
  return this.status === 'paid';
};

PaymentHistorySchema.methods.isPending = function() {
  return this.status === 'pending';
};

PaymentHistorySchema.methods.isFailed = function() {
  return this.status === 'failed';
};

PaymentHistorySchema.methods.isRefunded = function() {
  return this.status === 'refunded';
};

// Static methods
PaymentHistorySchema.statics.getByBooking = async function(bookingId) {
  return this.find({ bookingId }).sort({ createdAt: -1 });
};

PaymentHistorySchema.statics.getByCustomer = async function(customerId) {
  return this.find({ customerId }).sort({ createdAt: -1 });
};

PaymentHistorySchema.statics.getByHost = async function(hostId) {
  return this.find({ hostId }).sort({ createdAt: -1 });
};

PaymentHistorySchema.statics.getTotalPaidForBooking = async function(bookingId) {
  const result = await this.aggregate([
    { $match: { bookingId: mongoose.Types.ObjectId(bookingId), status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
};

// Pre-save hook
PaymentHistorySchema.pre('save', function(next) {
  // Auto-set paidAt if status is 'paid' and paidAt is not set
  if (this.status === 'paid' && !this.paidAt) {
    this.paidAt = new Date();
  }
  next();
});

const PaymentHistory = mongoose.model("PaymentHistory", PaymentHistorySchema);

module.exports = PaymentHistory;

