require('dotenv').config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const {Server} = require("socket.io");
const rateLimit = require("express-rate-limit");
const logger = require("./utils/logger");
const {authenticateToken, isAdmin} = require("./middleware/auth");

// Override console to add timestamps to all logs
logger.overrideConsole();

// Create HTTP server
const server = http.createServer(app);

// CORS Configuration - Whitelist allowed origins
const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3001",
    // Add mobile deep link schemes and production URLs here
].filter(Boolean);

// Setup Socket.io with CORS whitelist
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, etc.)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Import routes
const authRoutes = require("./routes/auth.js");
const listingRoutes = require("./routes/listing.js");
const bookingRoutes = require("./routes/booking.js");
const entirePlaceBookingRoutes = require("./routes/entirePlaceBooking.js");
const userRoutes = require("./routes/user.js");
const notificationRoutes = require("./routes/notification.js");
const reviewRoutes = require("./routes/review.js");
const bookingHistoryRoutes = require("./routes/bookingHistory.js");
const propertyManagementRoutes = require("./routes/propertyManagement.js");
const hostProfileRoutes = require("./routes/hostProfile.js");
const searchRoutes = require("./routes/search.js");
const hostReviewsRoutes = require("./routes/hostReviews.js");
const messageRoutes = require("./routes/messages.js");
const paymentRoutes = require("./routes/payment.js");
const paymentReminderRoutes = require("./routes/paymentReminder.js");
const staticDataRoutes = require("./routes/staticData.js");
const calendarRoutes = require("./routes/calendar.js");
const fcmRoutes = require("./routes/fcm.js");

// Import services
const {startPaymentReminderScheduler} = require("./services/paymentReminderService");
const {startMonthlyRentScheduler} = require("./services/monthlyRentScheduler");
const {startLockCleanupJob} = require("./services/lockCleanupService");
const {upload} = require("./services/cloudinaryService");

// Middleware
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE;
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));
app.use(express.json({limit: MAX_FILE_SIZE}));
app.use(express.urlencoded({limit: MAX_FILE_SIZE, extended: true}));
app.use(express.static("public"));

// ============================================
// Rate Limiting
// ============================================

// Auth rate limiter: max 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Payment rate limiter: max 20 requests per 15 minutes per IP
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: "Too many payment requests. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiter: max 200 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply general rate limiter to all API routes
app.use(apiLimiter);

// Upload endpoint for general image uploads (protected)
app.post("/upload", authenticateToken, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        logger.upload("Image uploaded to Cloudinary:", req.file.path);

        res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            imageUrl: req.file.path,
        });
    } catch (error) {
        logger.error("Error uploading image:", error);
        res.status(500).json({
            success: false,
            message: "Failed to upload image",
            error: error.message,
        });
    }
});

// Health check endpoint for Railway (public)
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Rento Server is running",
        timestamp: new Date().toISOString(),
    });
});

// ============================================
// Routes
// ============================================

// --- PUBLIC ROUTES (no auth required) ---
app.use("/auth", authLimiter, authRoutes);
app.use("/listing", listingRoutes); // GET is public, POST/PUT/DELETE protected inside route
app.use("/search", searchRoutes);
app.use("/host-reviews", hostReviewsRoutes); // Public reviews
app.use("/static-data", staticDataRoutes);
// Global templates (public read, admin manages writes)
app.use("/categories", require("./routes/categories"));
app.use("/property-types", require("./routes/propertyTypes"));
app.use("/facilities", require("./routes/facilities"));

// --- SEMI-PUBLIC ROUTES (specific endpoints public, rest protected) ---
// VNPay callback routes must be public (VNPay server redirects/calls these)
app.get("/payment/vnpay-return", paymentRoutes);
app.post("/payment/vnpay-ipn", paymentRoutes);

// --- PROTECTED ROUTES (auth required) ---

// Admin Routes
try {
    const adminRoutes = require("./routes/admin/index-verbose");
    app.use("/admin", authenticateToken, isAdmin, adminRoutes);
    logger.success("Admin routes loaded successfully");
} catch (error) {
    logger.error("Failed to load admin routes:");
    logger.error(error);
}

// Booking & Payment (protected + rate limited)
app.use("/booking", authenticateToken, bookingRoutes);
app.use("/entire-place-booking", authenticateToken, entirePlaceBookingRoutes);
app.use("/payment", authenticateToken, paymentLimiter, paymentRoutes);
app.use("/payment-reminder", authenticateToken, paymentReminderRoutes);
app.use("/payment-history", authenticateToken, require("./routes/paymentHistory"));
app.use("/booking-intent", authenticateToken, require("./routes/bookingIntent"));
app.use("/concurrent-booking", authenticateToken, require("./routes/concurrentBooking"));

// Room Rental (protected)
app.use("/room-rental", authenticateToken, require("./routes/roomRental"));
app.use("/room-rental-advanced", authenticateToken, require("./routes/roomRentalAdvanced"));

// Roommate Matching (protected)
app.use("/roommate", authenticateToken, require("./routes/roommate"));

// User & Profile (protected)
app.use("/user", authenticateToken, userRoutes);
app.use("/host", authenticateToken, hostProfileRoutes);
app.use("/notifications", authenticateToken, notificationRoutes);
app.use("/reviews", authenticateToken, reviewRoutes);
app.use("/history", authenticateToken, bookingHistoryRoutes);
app.use("/properties", authenticateToken, propertyManagementRoutes);
app.use("/messages", authenticateToken, messageRoutes);
app.use("/calendar", authenticateToken, calendarRoutes);
app.use("/fcm", authenticateToken, fcmRoutes);

// Identity verification (protected)
try {
    const identityVerificationRoutes = require("./routes/identityVerification");
    app.use("/identity-verification", authenticateToken, identityVerificationRoutes);
    logger.success("Identity Verification route loaded successfully");
} catch (error) {
    logger.error("Failed to load Identity Verification route:", error.message);
}

// User-specific data (protected)
app.use("/user-categories", authenticateToken, require("./routes/userCategories"));
app.use("/user-property-types", authenticateToken, require("./routes/userPropertyTypes"));
app.use("/user-facilities", authenticateToken, require("./routes/userFacilities"));

// 404 handler - must be before global error handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.url}`,
        error: "Route not found",
    });
});

// Global error handler - must be after all routes
app.use((err, req, res, next) => {
    logger.error("Global error handler:", err);

    // Ensure we always return JSON, not HTML
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? {
            stack: err.stack,
            name: err.name,
        } : undefined,
    });
});

// Make io available to routes
app.set("io", io);

// Socket.io connection handling
const onlineUsers = new Map(); // userId -> socketId

// Make onlineUsers accessible from io instance
io.onlineUsers = onlineUsers;

io.on("connection", (socket) => {
    logger.socket("User connected:", socket.id);

    // User comes online
    socket.on("user_online", (userId) => {
        onlineUsers.set(userId, socket.id);
        logger.socket(`User ${userId} is online (${socket.id})`);

        // Broadcast to all users that this user is online
        socket.broadcast.emit("user_status_change", {
            userId,
            status: "online",
        });
    });

    // Send message
    socket.on("send_message", async (data) => {
        const {receiverId, message} = data;
        logger.message("Message from", data.senderId, "to", receiverId);

        // Send to receiver if online
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
    socket.on("typing", ({receiverId, isTyping, conversationId}) => {
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

        // Find and remove user from online users
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);

                // Broadcast to all users that this user is offline
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

// ENV VARIABLES
const PORT = process.env.PORT;
const DB_NAME = process.env.DB_NAME;

//MONGODB CONNECTION
mongoose
    .connect(process.env.MONGO_URL, {dbName: DB_NAME})
    .then(() => {
        const HOST = process.env.HOST || "0.0.0.0";
        server.listen(PORT, HOST, () => {
            logger.success(`Server running on http://${HOST}:${PORT}`);
            logger.socket("Socket.io enabled for real-time chat");

            // Initialize FCM (Firebase Cloud Messaging)
            try {
                const fcmService = require('./services/fcmService');

                // Try to load service account JSON file (local development)
                let serviceAccount = null;
                try {
                    serviceAccount = require('./config/firebase-service-account.json');
                    logger.info('Service account JSON file found');
                } catch (err) {
                    logger.info('No service account JSON file (will use env vars if available)');
                }

                fcmService.initialize(serviceAccount);
            } catch (error) {
                logger.warn('⚠️ FCM initialization failed:', error.message);
                logger.warn('   Push notifications will not work');
            }

            // Start payment reminder scheduler
            startPaymentReminderScheduler();

            // Start monthly rent scheduler (for Room Rental)
            startMonthlyRentScheduler();

            // Start booking lock cleanup job (for Concurrent Booking Handling)
            startLockCleanupJob();
        });
    })
    .catch((error) => {
        logger.error(`Error connecting to database: ${error.message}`);
    });
