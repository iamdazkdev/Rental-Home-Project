const messageService = require("../services/message.service");
const Conversation = require("../models/Conversation");
const { HTTP_STATUS } = require("../constants");

const getConversations = async (req, res) => {
    const { userId } = req.params;
    const conversations = await messageService.getConversations(userId);

    const formattedConversations = conversations.map((conv) => {
        const otherParticipant = conv.participants.find((p) => p._id.toString() !== userId);
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
};

const getMessages = async (req, res) => {
    const { conversationId } = req.params;
    const { userId } = req.query;

    const messages = await messageService.getMessages(conversationId);

    if (userId) {
        await messageService.markMessagesAsRead(conversationId, userId);
    }

    res.status(HTTP_STATUS.OK).json(messages);
};

const sendMessage = async (req, res) => {
    const { senderId, receiverId, listingId, message, messageType = "text" } = req.body;
    const conversationId = Conversation.getConversationId(senderId, receiverId, listingId);

    const newMessage = await messageService.saveMessage({
        conversationId,
        senderId,
        receiverId,
        listingId: listingId || null,
        message,
        messageType,
    });

    const conversation = await messageService.findOrCreateConversation(senderId, receiverId, listingId, message);

    res.status(HTTP_STATUS.CREATED).json({
        message: newMessage,
        conversation,
    });
};

const getUnreadCount = async (req, res) => {
    const { userId } = req.params;
    const totalUnread = await messageService.getUnreadCount(userId);
    res.status(HTTP_STATUS.OK).json({ totalUnread });
};

const markAsRead = async (req, res) => {
    const { conversationId } = req.params;
    const { userId } = req.body;
    
    await messageService.markMessagesAsRead(conversationId, userId);
    res.status(HTTP_STATUS.OK).json({ message: "Marked as read" });
};

module.exports = {
    getConversations,
    getMessages,
    sendMessage,
    getUnreadCount,
    markAsRead
};
