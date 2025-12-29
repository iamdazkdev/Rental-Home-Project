const mongoose = require("mongoose");

const RoommateRequestSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoommatePost",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    respondedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for queries
RoommateRequestSchema.index({ postId: 1, status: 1 });
RoommateRequestSchema.index({ receiverId: 1, status: 1 });
RoommateRequestSchema.index({ senderId: 1, postId: 1 });

// Prevent duplicate requests
RoommateRequestSchema.index(
  { senderId: 1, postId: 1 },
  { unique: true }
);

const RoommateRequest = mongoose.model("RoommateRequest", RoommateRequestSchema);

module.exports = RoommateRequest;

