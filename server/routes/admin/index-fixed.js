const router = require("express").Router();

// Test route - NO AUTH REQUIRED (for debugging)
router.get("/test", (req, res) => {
    console.log("✅ /admin/test route hit!");
    res.json({
        success: true,
        message: "Admin routes are working!",
        timestamp: new Date().toISOString()
    });
});

// Load dependencies AFTER test route
const {verifyAdmin} = require("../../middleware/admin/adminAuth");
const {
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    getAdminStats,
} = require("../../controllers/admin/userController");

// Protected routes - ALL require admin authentication
router.get("/stats", verifyAdmin, getAdminStats);
router.get("/users", verifyAdmin, getAllUsers);
router.get("/users/:id", verifyAdmin, getUserById);
router.patch("/users/:id/role", verifyAdmin, updateUserRole);
router.delete("/users/:id", deleteUser);

module.exports = router;

