const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
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
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "checked_out", "completed"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    // Checkout fields
    checkedOutAt: {
      type: Date,
      default: null,
    },
    isCheckedOut: {
      type: Boolean,
      default: false,
    },
    // Extension requests
    extensionRequests: [
      {
        requestedEndDate: String,
        additionalDays: Number,
        additionalPrice: Number,
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        approvedAt: Date,
        rejectedAt: Date,
        rejectionReason: String,
      },
    ],
    // Final dates after extensions
    finalEndDate: {
      type: String,
      default: null,
    },
    finalTotalPrice: {
      type: Number,
      default: null,
    },
    // Payment fields
    paymentMethod: {
      type: String,
      enum: ["vnpay_full", "vnpay_deposit", "cash"],
      default: "vnpay_full",
    },
    depositPercentage: {
      type: Number,
      default: 0,
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "partially_paid", "failed", "refunded"],
      default: "unpaid",
    },
    paymentIntentId: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    // Payment History - Track all payment transactions
    paymentHistory: [
      {
        amount: {
          type: Number,
          required: true,
        },
        method: {
          type: String,
          enum: ["vnpay", "cash", "bank_transfer"],
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "paid", "failed", "refunded"],
          default: "paid",
        },
        transactionId: {
          type: String,
          default: null,
        },
        type: {
          type: String,
          enum: ["deposit", "partial", "full", "remaining"],
          required: true,
        },
        paidAt: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          default: "",
        },
      },
    ],
    // Remaining payment tracking
    remainingAmount: {
      type: Number,
      default: 0,
    },
    remainingDueDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", BookingSchema);
module.exports = Booking;
