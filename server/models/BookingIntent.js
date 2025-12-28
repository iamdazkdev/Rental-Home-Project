const mongoose = require("mongoose");

/**
 * BookingIntent Model (v2.0)
 * Temporary record created before VNPay redirect
 * Prevents race conditions and stores payment details
 * Auto-expires after 30 minutes
 */
const BookingIntentSchema = new mongoose.Schema(
  {
    tempOrderId: {
      type: String,
      required: true,
      unique: true,
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
    paymentMethod: {
      type: String,
      enum: ["vnpay"],
      required: true,
      default: "vnpay",
    },
    paymentType: {
      type: String,
      enum: ["full", "deposit"],
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
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index - MongoDB will auto-delete after expiresAt
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BookingIntentSchema.index({ tempOrderId: 1 });
BookingIntentSchema.index({ expiresAt: 1 });
BookingIntentSchema.index({ customerId: 1 });

const BookingIntent = mongoose.model("BookingIntent", BookingIntentSchema);

module.exports = BookingIntent;

