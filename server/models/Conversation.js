const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }],
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      default: null,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastMessageSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for finding conversations
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

// Helper method to get conversation ID
ConversationSchema.statics.getConversationId = function(userId1, userId2, listingId = null) {
  const sortedIds = [userId1, userId2].sort();
  return listingId
    ? `${sortedIds[0]}_${sortedIds[1]}_${listingId}`
    : `${sortedIds[0]}_${sortedIds[1]}`;
};

const Conversation = mongoose.model("Conversation", ConversationSchema);
module.exports = Conversation;

