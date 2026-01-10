const jwt = require("jsonwebtoken");
const User = require("../../models/User");

const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin privileges required",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("❌ Admin auth error:", error);
        res.status(500).json({
            success: false,
            message: "Authentication error",
        });
    }
};

module.exports = {verifyAdmin};