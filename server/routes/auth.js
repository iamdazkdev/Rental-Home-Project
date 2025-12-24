const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

const User = require("../models/User");
const { sendPasswordResetEmail } = require("../services/emailService");
const { upload: cloudinaryUpload } = require("../services/cloudinaryService");

// Utility functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.access("public/uploads/");
  } catch (error) {
    await fs.mkdir("public/uploads/", { recursive: true });
  }
};

// Initialize upload directory
ensureUploadDir().catch(console.error);

/* Enhanced Multer setup for file uploads */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // Store uploaded files in 'public/uploads' directory
  },
  filename: function (req, file, cb) {
    // Generate unique filename to avoid conflicts
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, uniqueSuffix + fileExtension);
  },
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed!"));
  }
};

// Use Cloudinary upload (configured for profile images)
const upload = cloudinaryUpload;

/* REGISTER USER */
router.post("/register", (req, res, next) => {
  // Custom error handler for multer
  upload.single("profileImage")(req, res, (err) => {
    if (err) {
      console.error("❌ Multer upload error:", err.message);

      // Handle specific multer errors
      if (err.message.includes("Only image files are allowed")) {
        return res.status(400).json({
          message: "Invalid file type. Please upload an image file (JPEG, PNG, WebP, etc.)",
          error: err.message,
        });
      }

      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "File size too large. Maximum size is 10MB.",
        });
      }

      return res.status(400).json({
        message: "File upload error",
        error: err.message,
      });
    }

    // Continue to registration handler
    next();
  });
}, async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;
    const profileImage = req.file;

    console.log("📝 Registration attempt:", {
      email,
      hasImage: !!profileImage,
      imageInfo: profileImage ? {
        originalname: profileImage.originalname,
        mimetype: profileImage.mimetype,
        size: profileImage.size,
      } : null,
    });

    console.log(
      "Profile image upload result:",
      profileImage
        ? {
            originalname: profileImage.originalname,
            path: profileImage.path,
            publicId: profileImage.filename,
          }
        : "No image uploaded"
    );

    // Input validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        message: "All fields are required.",
        missing: {
          firstName: !firstName,
          lastName: !lastName,
          email: !email,
          password: !password,
          confirmPassword: !confirmPassword,
        },
      });
    }

    // Validate name fields
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      return res.status(400).json({
        message: "First name and last name must be at least 2 characters long.",
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    // Validate profile image
    if (!profileImage) {
      return res.status(400).json({
        message: "Profile image is required.",
      });
    }

    // Check if user already exists (case-insensitive email)
    const existingUser = await User.findOne({
      email: { $regex: new RegExp(email, "i") },
    });
    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // Hash password with higher salt rounds for better security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      profileImagePath: profileImage.path,
    });

    await newUser.save();

    // Return success response (don't include sensitive data)
    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle specific mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: Object.values(error.errors).map((e) => e.message),
      });
    }

    // Handle multer errors
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File size too large. Maximum size is 5MB.",
      });
    }

    if (error.message.includes("Only image files")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    // Generic server error
    res.status(500).json({
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/* LOGIN USER */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    // Find user (case-insensitive email)
    const user = await User.findOne({
      email: { $regex: new RegExp(email, "i") },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    // Delete password from user object before sending response
    delete user.password;
    // Return success response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImagePath: user.profileImagePath,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!validateEmail(email)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address" });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email address" });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET + user.password, // Include password in secret to invalidate token when password changes
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // Generate reset link
    const resetLink = `${
      process.env.CLIENT_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    try {
      // Send password reset email
      const emailResult = await sendPasswordResetEmail(
        email,
        resetLink,
        user.firstName
      );

      console.log("Password reset email sent successfully to:", email);

      res.status(200).json({
        message:
          "Password reset instructions have been sent to your email address",
        // In development, include additional info
        ...(process.env.NODE_ENV === "development" && {
          resetLink,
          token: resetToken,
          previewUrl: emailResult.previewUrl,
        }),
      });
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);

      // Still return success to user for security (don't reveal if email exists)
      res.status(200).json({
        message:
          "If an account with this email exists, password reset instructions have been sent",
        // In development, show the error and reset link
        ...(process.env.NODE_ENV === "development" && {
          error: "Email service failed",
          resetLink,
          token: resetToken,
        }),
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Verify Reset Token Route
router.get("/verify-reset-token", async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({ message: "Token and email are required" });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      // Verify token
      jwt.verify(token, process.env.JWT_SECRET + user.password);
      res.status(200).json({ message: "Token is valid" });
    } catch (tokenError) {
      if (tokenError.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Reset token has expired. Please request a new one.",
        });
      }
      return res.status(401).json({ message: "Invalid reset token" });
    }
  } catch (error) {
    console.error("Verify token error:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Reset Password Route
router.post("/reset-password", async (req, res) => {
  try {
    const { token, email, password } = req.body;

    // Validate input
    if (!token || !email || !password) {
      return res
        .status(400)
        .json({ message: "Token, email, and new password are required" });
    }

    if (!validateEmail(email)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET + user.password);

      // Ensure the token is for this user
      if (
        decoded.userId !== user._id.toString() ||
        decoded.email !== user.email
      ) {
        return res.status(401).json({ message: "Invalid reset token" });
      }
    } catch (tokenError) {
      if (tokenError.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Reset token has expired. Please request a new one.",
        });
      }
      return res.status(401).json({ message: "Invalid reset token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(
      parseInt(process.env.BCRYPT_ROUNDS) || 12
    );
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    res.status(200).json({
      message:
        "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
