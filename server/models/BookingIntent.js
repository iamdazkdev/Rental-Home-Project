const mongoose = require("mongoose");

/**
 * BookingIntent Model (v3.0)
 * Implements temporary reservation/locking mechanism for concurrent booking handling
 *
 * Purpose:
 * - Prevents overbooking when multiple users try to book the same listing
 * - Holds a temporary lock while user proceeds with payment
 * - Auto-expires to release lock if payment not completed
 *
 * Status Flow:
 * LOCKED -> PAID (success) or EXPIRED (timeout) or CANCELLED (user cancelled)
 */
const BookingIntentSchema = new mongoose.Schema(
  {
    intentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Alternative ID for VNPay transactions
    tempOrderId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    // Booking type: 'entire_place' or 'room_rental'
    bookingType: {
      type: String,
      enum: ["entire_place", "room_rental"],
      default: "entire_place",
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    // Intent status for concurrency control
    status: {
      type: String,
      enum: ["locked", "paid", "expired", "cancelled", "failed"],
      default: "locked",
    },
    // Payment details
    paymentMethod: {
      type: String,
      enum: ["vnpay", "cash"],
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["full", "deposit", "cash"],
      required: true,
    },
    paymentAmount: {
      type: Number,
      required: true,
    },
    depositPercentage: {
      type: Number,
      default: 0,
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    // Lock timing
    lockedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    // Completion tracking
    paidAt: {
      type: Date,
      default: null,
    },
    transactionId: {
      type: String,
      default: null,
    },
    // Created booking reference (after successful payment)
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    // Error tracking
    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries (avoiding duplicates with schema-level index: true)
BookingIntentSchema.index({ listingId: 1, status: 1 });
BookingIntentSchema.index({ customerId: 1, status: 1 });
BookingIntentSchema.index({ status: 1, expiresAt: 1 });

// Note: intentId, tempOrderId, and expiresAt already have indexes from schema definition

// Static method to check if listing is locked
BookingIntentSchema.statics.isListingLocked = async function(listingId, startDate, endDate) {
  const now = new Date();
  const lockedIntent = await this.findOne({
    listingId: listingId,
    status: "locked",
    expiresAt: { $gt: now },
    $or: [
      // Date ranges overlap
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  });
  return lockedIntent !== null;
};

// Static method to get active lock for a listing
BookingIntentSchema.statics.getActiveLock = async function(listingId, startDate, endDate) {
  const now = new Date();
  return await this.findOne({
    listingId: listingId,
    status: "locked",
    expiresAt: { $gt: now },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  });
};

// Static method to release expired locks
BookingIntentSchema.statics.releaseExpiredLocks = async function() {
  const now = new Date();
  const result = await this.updateMany(
    {
      status: "locked",
      expiresAt: { $lte: now }
    },
    {
      $set: {
        status: "expired",
        failureReason: "Lock expired - payment not completed in time"
      }
    }
  );
  return result.modifiedCount;
};

// Instance method to confirm payment
BookingIntentSchema.methods.confirmPayment = async function(transactionId, bookingId) {
  this.status = "paid";
  this.paidAt = new Date();
  this.transactionId = transactionId;
  this.bookingId = bookingId;
  return await this.save();
};

// Instance method to cancel
BookingIntentSchema.methods.cancel = async function(reason = "User cancelled") {
  this.status = "cancelled";
  this.failureReason = reason;
  return await this.save();
};

// Instance method to mark as failed
BookingIntentSchema.methods.fail = async function(reason) {
  this.status = "failed";
  this.failureReason = reason;
  return await this.save();
};

const BookingIntent = mongoose.model("BookingIntent", BookingIntentSchema);

module.exports = BookingIntent;

