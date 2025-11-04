const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/auth.js");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Routes
app.use("/auth", authRoutes);

/*
MONGODB CONNECTION
*/
const PORT = 3001;
mongoose
  .connect(process.env.MONGO_URL, { dbName: "rental-home-db" })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.log(`Error connecting to database: ${error.message}`);
  });
