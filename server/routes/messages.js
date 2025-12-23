const router = require("express").Router();
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { HTTP_STATUS } = require("../constants");

// GET ALL CONVERSATIONS FOR USER
router.get("/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.warn("⚠️ Invalid userId in conversations request:", userId);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Valid userId is required",
        conversations: [],
      });
    }

    console.log("📞 Fetching conversations for user:", userId);

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "firstName lastName profileImagePath")
      .populate("listingId", "title listingPhotoPaths")
      .populate("lastMessageSenderId", "firstName lastName")
      .sort({ lastMessageAt: -1 });

    console.log("✅ Found", conversations.length, "conversations for user:", userId);

    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId
      );

      return {
        _id: conv._id,
        conversationId: Conversation.getConversationId(
          conv.participants[0]._id,
          conv.participants[1]._id,
          conv.listingId?._id
        ),
        otherUser: otherParticipant,
        listing: conv.listingId,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        lastMessageSenderId: conv.lastMessageSenderId,
        unreadCount: conv.unreadCount?.get(userId.toString()) || 0,
      };
    });

    res.status(HTTP_STATUS.OK).json(formattedConversations);
  } catch (err) {
    console.error("❌ Error fetching conversations:", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch conversations",
      error: err.message,
    });
  }
});

// GET MESSAGES IN A CONVERSATION
router.get("/messages/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;

    // Validate inputs
    if (!conversationId || conversationId === 'undefined') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Valid conversationId is required",
        messages: [],
      });
    }

    console.log("📨 Fetching messages for conversation:", conversationId);

    const messages = await Message.find({ conversationId })
      .populate("senderId", "firstName lastName profileImagePath")
      .populate("receiverId", "firstName lastName profileImagePath")
      .sort({ createdAt: 1 });

    console.log("✅ Found", messages.length, "messages");

    // Mark messages as read
    if (userId && userId !== 'undefined') {
      await Message.updateMany(
        {
          conversationId,
          receiverId: userId,
          isRead: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        }
      );

      // Update conversation unread count
      const conversation = await Conversation.findOne({
        participants: userId,
      });
      if (conversation) {
        conversation.unreadCount.set(userId.toString(), 0);
        await conversation.save();
      }
    }

    res.status(HTTP_STATUS.OK).json(messages);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch messages",
      error: err.message,
    });
  }
});

// SEND MESSAGE
router.post("/messages", async (req, res) => {
  try {
    const { senderId, receiverId, listingId, message, messageType = "text" } = req.body;

    if (!senderId || !receiverId || !message) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Missing required fields",
      });
    }

    // Generate conversation ID
    const conversationId = Conversation.getConversationId(senderId, receiverId, listingId);

    // Create message
    const newMessage = new Message({
      conversationId,
      senderId,
      receiverId,
      listingId: listingId || null,
      message,
      messageType,
    });

    await newMessage.save();

    // Populate message
    await newMessage.populate("senderId", "firstName lastName profileImagePath");
    await newMessage.populate("receiverId", "firstName lastName profileImagePath");

    // Update or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      listingId: listingId || null,
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, receiverId],
        listingId: listingId || null,
        lastMessage: message,
        lastMessageAt: new Date(),
        lastMessageSenderId: senderId,
        unreadCount: {
          [receiverId]: 1,
        },
      });
    } else {
      conversation.lastMessage = message;
      conversation.lastMessageAt = new Date();
      conversation.lastMessageSenderId = senderId;

      const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
      conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
    }

    await conversation.save();

    res.status(HTTP_STATUS.CREATED).json({
      message: newMessage,
      conversation,
    });
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to send message",
      error: err.message,
    });
  }
});

// GET UNREAD MESSAGE COUNT
router.get("/unread/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(HTTP_STATUS.OK).json({ totalUnread: 0 });
    }

    const conversations = await Conversation.find({
      participants: userId,
    });

    let totalUnread = 0;
    conversations.forEach((conv) => {
      const unread = conv.unreadCount.get(userId.toString()) || 0;
      totalUnread += unread;
    });

    res.status(HTTP_STATUS.OK).json({ totalUnread });
  } catch (err) {
    console.error("❌ Error fetching unread count:", err);
    res.status(HTTP_STATUS.OK).json({ totalUnread: 0 });
  }
});

// MARK CONVERSATION AS READ
router.patch("/conversations/:conversationId/read", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    const conversation = await Conversation.findOne({
      participants: userId,
    });

    if (conversation) {
      conversation.unreadCount.set(userId.toString(), 0);
      await conversation.save();
    }

    res.status(HTTP_STATUS.OK).json({ message: "Marked as read" });
  } catch (err) {
    console.error("❌ Error marking as read:", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to mark as read",
      error: err.message,
    });
  }
});

module.exports = router;

