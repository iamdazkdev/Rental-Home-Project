require("dotenv").config();

const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const logger = require("./utils/logger");
const { initChatSocket } = require("./sockets/chatSocket");

const app = require("./app");

const server = http.createServer(app);

// ── SOCKET.IO ─────────────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:3000",
    "http://localhost:3001",
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        methods: ["GET", "POST"],
        credentials: true,
    },
});

app.set("io", io);
initChatSocket(io);

// ── DATABASE + SERVER START ───────────────────────────────────────────────────
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
                const fcmService = require("./services/fcm.service");
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
            const { startPaymentReminderScheduler } = require("./services/paymentReminder.service");
            const { startMonthlyRentScheduler } = require("./services/monthlyRent.service");
            const { startLockCleanupJob } = require("./services/lockCleanup.service");

            startPaymentReminderScheduler();
            startMonthlyRentScheduler();
            startLockCleanupJob();
        });
    })
    .catch((error) => {
        logger.error(`Error connecting to database: ${error.message}`);
    });
