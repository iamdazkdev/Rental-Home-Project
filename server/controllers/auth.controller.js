const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendPasswordResetEmail } = require("../services/emailService");

// ============================================
// VALIDATION HELPERS
// ============================================

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

// ============================================
// REGISTER
// ============================================
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword } = req.body;
        const profileImage = req.file;

        // Input validation
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
        }

        if (firstName.trim().length < 2 || lastName.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "First name and last name must be at least 2 characters long.",
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address.",
            });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match.",
            });
        }

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

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address.",
            });
        }

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

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ success: false, message: "Please provide a valid email address" });
        }

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

        if (!token || !email || !password) {
            return res.status(400).json({ success: false, message: "Token, email, and new password are required" });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ success: false, message: "Please provide a valid email address" });
        }

        // FIX: Use same validation as registration (was only checking length >= 6)
        if (!validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
            });
        }

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
