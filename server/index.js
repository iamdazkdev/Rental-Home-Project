const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/auth.js");
const listingRoutes = require("./routes/listing.js");
const bookingRoutes = require("./routes/booking.js");
const userRoutes = require("./routes/user.js");
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

// ENV VARIABLES
const PORT = process.env.PORT;
const DB_NAME = process.env.DB_NAME;

//MONGODB CONNECTION
mongoose
  .connect(process.env.MONGO_URL, { dbName: DB_NAME })
  .then(() => {
    const HOST = process.env.HOST || "localhost";
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  })
  .catch((error) => {
    console.log(`Error connecting to database: ${error.message}`);
  });
