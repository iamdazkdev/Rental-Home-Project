const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendPasswordResetEmail } = require("../services/email.service");

// Validation logic has been moved to validators/auth.validator.js

// ============================================
// REGISTER
// ============================================
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword } = req.body;
        const profileImage = req.file;

        // Input validation is handled by Zod middleware

        if (!profileImage) {
            return res.status(400).json({
                success: false,
                message: "Profile image is required.",
            });
        }

        // Check duplicate email
        const existingUser = await User.findOne({
            email: { $regex: new RegExp(`^${email}$`, "i") },
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const newUser = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            profileImagePath: profileImage.path,
        });

        await newUser.save();

        res.status(201).json({
            success: true,
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

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                details: Object.values(error.errors).map((e) => e.message),
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error. Please try again later.",
            ...(process.env.NODE_ENV === "development" && { error: error.message }),
        });
    }
};

// ============================================
// LOGIN
// ============================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation is handled by Zod middleware

        // Find user
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${email}$`, "i") },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        // Validate password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        // Generate JWT token
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET not configured");
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Return user data (no password!)
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                profileImagePath: user.profileImagePath,
                role: user.role || "user",
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again later.",
            ...(process.env.NODE_ENV === "development" && { error: error.message }),
        });
    }
};

// ============================================
// FORGOT PASSWORD
// ============================================
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Input validation is handled by Zod middleware

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: "No account found with this email address" });
        }

        // Generate reset token (includes password in secret to invalidate on password change)
        const resetToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET + user.password,
            { expiresIn: "1h" }
        );

        const resetLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        try {
            const emailResult = await sendPasswordResetEmail(email, resetLink, user.firstName);

            res.status(200).json({
                success: true,
                message: "Password reset instructions have been sent to your email address",
                ...(process.env.NODE_ENV === "development" && { resetLink, token: resetToken, previewUrl: emailResult.previewUrl }),
            });
        } catch (emailError) {
            console.error("Failed to send reset email:", emailError);
            res.status(200).json({
                success: true,
                message: "If an account with this email exists, password reset instructions have been sent",
                ...(process.env.NODE_ENV === "development" && { error: "Email service failed", resetLink, token: resetToken }),
            });
        }
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again later.",
            ...(process.env.NODE_ENV === "development" && { error: error.message }),
        });
    }
};

// ============================================
// VERIFY RESET TOKEN
// ============================================
const verifyResetToken = async (req, res) => {
    try {
        const { token, email } = req.query;

        if (!token || !email) {
            return res.status(400).json({ success: false, message: "Token and email are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        try {
            jwt.verify(token, process.env.JWT_SECRET + user.password);
            res.status(200).json({ success: true, message: "Token is valid" });
        } catch (tokenError) {
            if (tokenError.name === "TokenExpiredError") {
                return res.status(401).json({ success: false, message: "Reset token has expired. Please request a new one." });
            }
            return res.status(401).json({ success: false, message: "Invalid reset token" });
        }
    } catch (error) {
        console.error("Verify token error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again later.",
            ...(process.env.NODE_ENV === "development" && { error: error.message }),
        });
    }
};

// ============================================
// RESET PASSWORD
// ============================================
const resetPassword = async (req, res) => {
    try {
        const { token, email, password } = req.body;

        // Input validation is handled by Zod middleware

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET + user.password);

            if (decoded.userId !== user._id.toString() || decoded.email !== user.email) {
                return res.status(401).json({ success: false, message: "Invalid reset token" });
            }
        } catch (tokenError) {
            if (tokenError.name === "TokenExpiredError") {
                return res.status(401).json({ success: false, message: "Reset token has expired. Please request a new one." });
            }
            return res.status(401).json({ success: false, message: "Invalid reset token" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);
        await User.findByIdAndUpdate(user._id, { password: hashedPassword });

        res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now login with your new password.",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again later.",
            ...(process.env.NODE_ENV === "development" && { error: error.message }),
        });
    }
};

module.exports = {
    register,
    login,
    forgotPassword,
    verifyResetToken,
    resetPassword,
};
