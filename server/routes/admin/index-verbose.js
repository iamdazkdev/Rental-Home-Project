const express = require("express");
const router = express.Router();

console.log("📝 Admin routes module loading...");

// Test route - NO AUTH
router.get("/test", (req, res) => {
    console.log("✅ /admin/test hit!");
    res.json({
        success: true,
        message: "Admin routes are working!",
        timestamp: new Date().toISOString()
    });
});

console.log("✅ Test route registered");

// Load middleware
const {verifyAdmin} = require("../../middleware/admin/adminAuth");
console.log("✅ Middleware loaded");

// Load controller
const {
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    getAdminStats,
} = require("../../controllers/admin/userController");
console.log("✅ Controller loaded");

// Protected routes
router.get("/stats", verifyAdmin, getAdminStats);
router.get("/users", verifyAdmin, getAllUsers);
router.get("/users/:id", verifyAdmin, getUserById);
router.patch("/users/:id/role", verifyAdmin, updateUserRole);
router.delete("/users/:id", verifyAdmin, deleteUser);

console.log("✅ All routes registered");
console.log("✅ Admin routes module ready!\n");

module.exports = router;

