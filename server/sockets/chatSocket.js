const logger = require("../utils/logger");

const onlineUsers = new Map();

const initChatSocket = (io) => {
    io.onlineUsers = onlineUsers;

    io.on("connection", (socket) => {
        logger.socket("User connected:", socket.id);

        socket.on("user_online", (userId) => {
            onlineUsers.set(userId, socket.id);
            logger.socket(`User ${userId} is online (${socket.id})`);
            socket.broadcast.emit("user_status_change", { userId, status: "online" });
        });

        socket.on("send_message", async (data) => {
            const { receiverId, message } = data;
            logger.message("Message from", data.senderId, "to", receiverId);
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive_message", message);
                io.to(receiverSocketId).emit("new_message_notification", {
                    senderId: data.senderId,
                    conversationId: message.conversationId,
                });
            }
        });

        socket.on("typing", ({ receiverId, isTyping, conversationId }) => {
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("user_typing", { conversationId, isTyping });
            }
        });

        socket.on("disconnect", () => {
            logger.socket("User disconnected:", socket.id);
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    socket.broadcast.emit("user_status_change", { userId, status: "offline" });
                    logger.socket(`User ${userId} went offline`);
                    break;
                }
            }
        });
    });
};

module.exports = { initChatSocket };
