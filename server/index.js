const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
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
const userRoutes = require("./routes/user.js");
const notificationRoutes = require("./routes/notification.js");
const reviewRoutes = require("./routes/review.js");
const bookingHistoryRoutes = require("./routes/bookingHistory.js");
const propertyManagementRoutes = require("./routes/propertyManagement.js");
const hostProfileRoutes = require("./routes/hostProfile.js");
const searchRoutes = require("./routes/search.js");
const hostReviewsRoutes = require("./routes/hostReviews.js");
const messageRoutes = require("./routes/messages.js");
// Middleware
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE;
app.use(cors());
app.use(express.json({ limit: MAX_FILE_SIZE }));
app.use(express.urlencoded({ limit: MAX_FILE_SIZE, extended: true }));
app.use(express.static("public"));

// Health check endpoint for Railway
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Dream Nest Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/auth", authRoutes);
app.use("/listing", listingRoutes);
app.use("/booking", bookingRoutes);
app.use("/user", userRoutes);
app.use("/notifications", notificationRoutes);
app.use("/reviews", reviewRoutes);
app.use("/history", bookingHistoryRoutes);
app.use("/properties", propertyManagementRoutes);
app.use("/host", hostProfileRoutes);
app.use("/search", searchRoutes);
app.use("/host-reviews", hostReviewsRoutes);
app.use("/messages", messageRoutes);

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
      console.log(`🚀 Server running on http://${HOST}:${PORT}`);
      console.log(`💬 Socket.io enabled for real-time chat`);
    });
  })
  .catch((error) => {
    console.log(`Error connecting to database: ${error.message}`);
  });
