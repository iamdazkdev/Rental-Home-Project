const mongoose = require("mongoose");

const RoommateMatchSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoommatePost",
      required: true,
      index: true,
    },
    userAId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userBId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoommateRequest",
      required: true,
    },
    matchedAt: {
      type: Date,
      default: Date.now,
    },
    // Optional: track if users are still connected
    connectionStatus: {
      type: String,
      enum: ["ACTIVE", "DISCONNECTED"],
      default: "ACTIVE",
    },
    disconnectedAt: {
      type: Date,
    },
    // Optional: notes about the match
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RoommateMatchSchema.index({ userAId: 1, userBId: 1 });
RoommateMatchSchema.index({ postId: 1 }, { unique: true });

const RoommateMatch = mongoose.model("RoommateMatch", RoommateMatchSchema);

module.exports = RoommateMatch;

