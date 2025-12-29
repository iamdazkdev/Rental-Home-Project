require('dotenv').config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
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

// Import services
const { startPaymentReminderScheduler } = require("./services/paymentReminderService");
const { startMonthlyRentScheduler } = require("./services/monthlyRentScheduler");
const { startLockCleanupJob } = require("./services/lockCleanupService");
const { upload } = require("./services/cloudinaryService");

// Middleware
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE;
app.use(cors());
app.use(express.json({ limit: MAX_FILE_SIZE }));
app.use(express.urlencoded({ limit: MAX_FILE_SIZE, extended: true }));
app.use(express.static("public"));

// Upload endpoint for general image uploads
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    console.log("✅ Image uploaded to Cloudinary:", req.file.path);

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: req.file.path,
    });
  } catch (error) {
    console.error("❌ Error uploading image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload image",
      error: error.message,
    });
  }
});

// Health check endpoint for Railway
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Rento Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/auth", authRoutes);
app.use("/listing", listingRoutes);
app.use("/booking", bookingRoutes);
app.use("/entire-place-booking", entirePlaceBookingRoutes); // New route for Entire Place Rental
app.use("/room-rental", require("./routes/roomRental")); // Room Rental (Process 2) - Core
app.use("/room-rental-advanced", require("./routes/roomRentalAdvanced")); // Room Rental (Process 2) - Advanced
app.use("/roommate", require("./routes/roommate")); // Roommate Matching (Process 3) - NO PAYMENT, NO BOOKING
app.use("/user", userRoutes);
app.use("/notifications", notificationRoutes);
app.use("/reviews", reviewRoutes);
app.use("/history", bookingHistoryRoutes);
app.use("/properties", propertyManagementRoutes);
app.use("/host", hostProfileRoutes);
app.use("/search", searchRoutes);
app.use("/host-reviews", hostReviewsRoutes);
app.use("/messages", messageRoutes);
app.use("/payment", paymentRoutes);
app.use("/payment-reminder", paymentReminderRoutes);
app.use("/payment-history", require("./routes/paymentHistory"));
app.use("/booking-intent", require("./routes/bookingIntent")); // Booking Intent for concurrent booking
app.use("/concurrent-booking", require("./routes/concurrentBooking")); // Concurrent Booking Handling

// Identity verification route - IMPORTANT for Shared Room & Roommate
try {
  const identityVerificationRoutes = require("./routes/identityVerification");
  app.use("/identity-verification", identityVerificationRoutes);
  console.log("✅ Identity Verification route loaded successfully");
} catch (error) {
  console.error("❌ Failed to load Identity Verification route:", error.message);
}

app.use("/static-data", staticDataRoutes); // Static data API (categories, types, facilities)
// Global templates (admin manages)
app.use("/categories", require("./routes/categories"));
app.use("/property-types", require("./routes/propertyTypes"));
app.use("/facilities", require("./routes/facilities"));
// User-specific data (each user manages their own)
app.use("/user-categories", require("./routes/userCategories"));
app.use("/user-property-types", require("./routes/userPropertyTypes"));
app.use("/user-facilities", require("./routes/userFacilities"));
// Admin routes
app.use("/admin", require("./routes/admin"));

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
  console.error("🔥 Global error handler:", err);

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

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // User comes online
  socket.on("user_online", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} is online (${socket.id})`);

    // Broadcast to all users that this user is online
    socket.broadcast.emit("user_status_change", {
      userId,
      status: "online",
    });
  });

  // Send message
  socket.on("send_message", async (data) => {
    const { receiverId, message } = data;
    console.log("💬 Message from", data.senderId, "to", receiverId);

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
    console.log("❌ User disconnected:", socket.id);

    // Find and remove user from online users
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);

        // Broadcast to all users that this user is offline
        socket.broadcast.emit("user_status_change", {
          userId,
          status: "offline",
        });

        console.log(`👤 User ${userId} went offline`);
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
  .connect(process.env.MONGO_URL, { dbName: DB_NAME })
  .then(() => {
    const HOST = process.env.HOST || "localhost";
    server.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on https://${HOST}:${PORT}`);
      console.log(`💬 Socket.io enabled for real-time chat`);

      // Start payment reminder scheduler
      startPaymentReminderScheduler();

      // Start monthly rent scheduler (for Room Rental)
      startMonthlyRentScheduler();

      // Start booking lock cleanup job (for Concurrent Booking Handling)
      startLockCleanupJob();
    });
  })
  .catch((error) => {
    console.log(`Error connecting to database: ${error.message}`);
  });
