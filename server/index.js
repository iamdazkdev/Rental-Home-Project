require("dotenv").config();

const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const logger = require("./utils/logger");

// Import the configured Express app
const app = require("./app");

// Create HTTP server
const server = http.createServer(app);

// ============================================
// SOCKET.IO SETUP
// ============================================
const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:3000",
    "http://localhost:3001",
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Make io available to routes
app.set("io", io);

// Online users tracking
const onlineUsers = new Map();
io.onlineUsers = onlineUsers;

io.on("connection", (socket) => {
    logger.socket("User connected:", socket.id);

    // User comes online
    socket.on("user_online", (userId) => {
        onlineUsers.set(userId, socket.id);
        logger.socket(`User ${userId} is online (${socket.id})`);

        socket.broadcast.emit("user_status_change", {
            userId,
            status: "online",
        });
    });

    // Send message
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

    // Typing indicator
    socket.on("typing", ({ receiverId, isTyping, conversationId }) => {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("user_typing", {
                conversationId,
                isTyping,
            });
        }
    });

    // User disconnect
    socket.on("disconnect", () => {
        logger.socket("User disconnected:", socket.id);

        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                socket.broadcast.emit("user_status_change", {
                    userId,
                    status: "offline",
                });
                logger.socket(`User ${userId} went offline`);
                break;
            }
        }
    });
});

// ============================================
// DATABASE + SERVER START
// ============================================
const PORT = process.env.PORT || 3001;
const DB_NAME = process.env.DB_NAME;
const HOST = process.env.HOST || "0.0.0.0";

mongoose
    .connect(process.env.MONGO_URL, { dbName: DB_NAME })
    .then(() => {
        server.listen(PORT, HOST, () => {
            logger.success(`Server running on http://${HOST}:${PORT}`);
            logger.socket("Socket.io enabled for real-time chat");

            // Initialize FCM
            try {
                const fcmService = require("./services/fcmService");
                let serviceAccount = null;
                try {
                    serviceAccount = require("./config/firebase-service-account.json");
                    logger.info("Service account JSON file found");
                } catch (err) {
                    logger.info("No service account JSON file (will use env vars if available)");
                }
                fcmService.initialize(serviceAccount);
            } catch (error) {
                logger.warn("⚠️ FCM initialization failed:", error.message);
                logger.warn("   Push notifications will not work");
            }

            // Start schedulers
            const { startPaymentReminderScheduler } = require("./services/paymentReminderService");
            const { startMonthlyRentScheduler } = require("./services/monthlyRentScheduler");
            const { startLockCleanupJob } = require("./services/lockCleanupService");

            startPaymentReminderScheduler();
            startMonthlyRentScheduler();
            startLockCleanupJob();
        });
    })
    .catch((error) => {
        logger.error(`Error connecting to database: ${error.message}`);
    });
