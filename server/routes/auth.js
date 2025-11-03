const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const User = require("../models/User");

/* Multer setup for file uploads */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // Storage uploaded files in 'public/uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use original file name
    // const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });
/* REGISTER USER */
router.post("/register", upload.single("profileImage"), async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const profileImage = req.file;
    if (!profileImage) {
      return res.status(400).send("Profile image is required.");
    }
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !profileImage) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});
