const mongoose = require("mongoose");

const PendingBookingSchema = new mongoose.Schema(
  {
    tempOrderId: {
      type: String,
      required: true,
      unique: true,
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
      enum: ["vnpay_full", "vnpay_deposit", "cash"],
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
    paymentAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending_payment", "expired", "converted"],
      default: "pending_payment",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
PendingBookingSchema.index({ customerId: 1, status: 1 });
// Note: tempOrderId already has unique index from unique: true declaration above
PendingBookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index - MongoDB will auto-delete expired documents

const PendingBooking = mongoose.model("PendingBooking", PendingBookingSchema);

module.exports = PendingBooking;

