const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

class MessageService {
    async getConversations(userId) {
        return await Conversation.find({ participants: userId })
            .populate("participants", "firstName lastName profileImagePath")
            .populate("listingId", "title listingPhotoPaths")
            .populate("lastMessageSenderId", "firstName lastName")
            .sort({ lastMessageAt: -1 });
    }

    async getMessages(conversationId) {
        return await Message.find({ conversationId })
            .populate("senderId", "firstName lastName profileImagePath")
            .populate("receiverId", "firstName lastName profileImagePath")
            .sort({ createdAt: 1 });
    }

    async markMessagesAsRead(conversationId, userId) {
        await Message.updateMany(
            { conversationId, receiverId: userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        const conversation = await Conversation.findOne({ participants: userId });
        if (conversation) {
            conversation.unreadCount.set(userId.toString(), 0);
            await conversation.save();
        }
    }

    async saveMessage(data) {
        const newMessage = new Message(data);
        await newMessage.save();
        
        await newMessage.populate("senderId", "firstName lastName profileImagePath");
        await newMessage.populate("receiverId", "firstName lastName profileImagePath");
        return newMessage;
    }

    async findOrCreateConversation(senderId, receiverId, listingId, message) {
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
                unreadCount: { [receiverId]: 1 },
            });
        } else {
            conversation.lastMessage = message;
            conversation.lastMessageAt = new Date();
            conversation.lastMessageSenderId = senderId;
            const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
            conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
        }

        await conversation.save();
        return conversation;
    }

    async getUnreadCount(userId) {
        const conversations = await Conversation.find({ participants: userId });
        let totalUnread = 0;
        conversations.forEach((conv) => {
            const unread = conv.unreadCount.get(userId.toString()) || 0;
            totalUnread += unread;
        });
        return totalUnread;
    }
}

module.exports = new MessageService();
