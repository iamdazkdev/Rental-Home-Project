const adminService = require("../services/admin.service");
const { HTTP_STATUS } = require("../constants");
const User = require("../models/User");

const isAdmin = async (req, res, next) => {
    try {
        const userId = req.body.adminId || req.query.adminId || req.params.adminId;
        if (!userId) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Admin ID required" });
        }
        const user = await User.findById(userId);
        if (!user || user.role !== "admin") {
            return res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Access denied. Admin only." });
        }
        next();
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Error checking admin status", error: error.message });
    }
};

const getStats = async (req, res) => {
    const stats = await adminService.getStats();
    res.status(HTTP_STATUS.OK).json(stats);
};

const getUsers = async (req, res) => {
    const { page = 1, limit = 20, search = "", role = "" } = req.query;
    const result = await adminService.getUsers(page, limit, search, role);
    res.status(HTTP_STATUS.OK).json(result);
};

const updateUserRole = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    const user = await adminService.updateUserRole(userId, role);
    if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
    }
    res.status(HTTP_STATUS.OK).json({ message: "User role updated successfully", user });
};

const deleteUser = async (req, res) => {
    const { userId } = req.params;
    const user = await adminService.deleteUser(userId);
    if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
    }
    res.status(HTTP_STATUS.OK).json({ message: "User deleted successfully" });
};

const getListings = async (req, res) => {
    const { page = 1, limit = 20, status = "" } = req.query;
    const result = await adminService.getListings(page, limit, status);
    res.status(HTTP_STATUS.OK).json(result);
};

const deleteListing = async (req, res) => {
    const { listingId } = req.params;
    const listing = await adminService.deleteListing(listingId);
    if (!listing) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Listing not found" });
    }
    res.status(HTTP_STATUS.OK).json({ message: "Listing deleted successfully" });
};

const toggleListing = async (req, res) => {
    const { listingId } = req.params;
    const listing = await adminService.toggleListing(listingId);
    if (!listing) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Listing not found" });
    }
    res.status(HTTP_STATUS.OK).json({ message: `Listing ${listing.isActive ? 'activated' : 'deactivated'} successfully`, listing });
};

module.exports = {
    isAdmin,
    getStats,
    getUsers,
    updateUserRole,
    deleteUser,
    getListings,
    deleteListing,
    toggleListing
};
