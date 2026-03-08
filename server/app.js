require("dotenv").config();

const express = require("express");
const cors = require("cors");
const logger = require("./utils/logger");

// Middleware
const { authenticateToken, isAdmin } = require("./middleware/auth");
const { authLimiter, paymentLimiter, apiLimiter } = require("./middleware/rateLimiter");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { upload } = require("./services/cloudinaryService");

// Create Express app
const app = express();

// Override console to add timestamps
logger.overrideConsole();

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// CORS — whitelist production + dev origins
const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:3000",
    "http://localhost:3001",
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, server-to-server)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`CORS policy: origin ${origin} not allowed`));
        },
        credentials: true,
    })
);

// Body parsing
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || "50mb";
app.use(express.json({ limit: MAX_FILE_SIZE }));
app.use(express.urlencoded({ limit: MAX_FILE_SIZE, extended: true }));
app.use(express.static("public"));

// General rate limit for all API routes
app.use(apiLimiter);

// ============================================
// PUBLIC ROUTES (no auth required)
// ============================================

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Rento Server is running",
        timestamp: new Date().toISOString(),
    });
});

// Auth routes (login, register, etc.) — with stricter rate limit
app.use("/auth", authLimiter, require("./routes/auth"));

// Public listing/search routes (read-only)
app.use("/listing", require("./routes/listing"));
app.use("/search", require("./routes/search"));
app.use("/static-data", require("./routes/staticData"));

// VNPay callback routes — must be public (VNPay server calls these)
// Note: individual callback endpoints in payment routes handle their own verification
app.use("/payment", paymentLimiter, require("./routes/payment"));

// ============================================
// PROTECTED ROUTES (auth required)
// ============================================

// Upload endpoint
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

// Booking routes
app.use("/booking", authenticateToken, require("./routes/booking"));
app.use("/entire-place-booking", authenticateToken, require("./routes/entirePlaceBooking"));
app.use("/booking-intent", authenticateToken, require("./routes/bookingIntent"));
app.use("/concurrent-booking", authenticateToken, require("./routes/concurrentBooking"));

// Room Rental routes (Process 2)
app.use("/room-rental", authenticateToken, require("./routes/roomRental"));
app.use("/room-rental-advanced", authenticateToken, require("./routes/roomRentalAdvanced"));

// Roommate Matching routes (Process 3)
app.use("/roommate", authenticateToken, require("./routes/roommate"));

// User routes
app.use("/user", authenticateToken, require("./routes/user"));
app.use("/profile", authenticateToken, require("./routes/hostProfile"));

// Messaging
app.use("/messages", authenticateToken, require("./routes/messages"));

// Notifications
app.use("/notifications", authenticateToken, require("./routes/notification"));

// Reviews
app.use("/reviews", authenticateToken, require("./routes/review"));
app.use("/host-reviews", require("./routes/hostReviews")); // public — view host reviews

// Booking History
app.use("/history", authenticateToken, require("./routes/bookingHistory"));

// Payment History & Reminders
app.use("/payment-history", authenticateToken, require("./routes/paymentHistory"));
app.use("/payment-reminder", authenticateToken, require("./routes/paymentReminder"));

// Property Management
app.use("/properties", authenticateToken, require("./routes/propertyManagement"));
app.use("/calendar", authenticateToken, require("./routes/calendar"));

// FCM (Push Notifications)
app.use("/fcm", authenticateToken, require("./routes/fcm"));

// Identity Verification
try {
    const identityVerificationRoutes = require("./routes/identityVerification");
    app.use("/identity-verification", authenticateToken, identityVerificationRoutes);
    logger.success("Identity Verification route loaded");
} catch (error) {
    logger.error("Failed to load Identity Verification route:", error.message);
}

// Static data management (admin-facing, auth required)
app.use("/categories", authenticateToken, require("./routes/categories"));
app.use("/property-types", authenticateToken, require("./routes/propertyTypes"));
app.use("/facilities", authenticateToken, require("./routes/facilities"));
app.use("/user-categories", authenticateToken, require("./routes/userCategories"));
app.use("/user-property-types", authenticateToken, require("./routes/userPropertyTypes"));
app.use("/user-facilities", authenticateToken, require("./routes/userFacilities"));

// Host profile — public view
app.use("/host", require("./routes/hostProfile"));

// ============================================
// ADMIN ROUTES (auth + admin role required)
// ============================================
try {
    const adminRoutes = require("./routes/admin/index-verbose");
    app.use("/admin", authenticateToken, isAdmin, adminRoutes);
    logger.success("Admin routes loaded successfully");
} catch (error) {
    logger.error("Failed to load admin routes:", error);
}

// ============================================
// ERROR HANDLING
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
