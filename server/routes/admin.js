const router = require("express").Router();
const User = require("../models/User");
const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const PaymentHistory = require("../models/PaymentHistory");
const { HTTP_STATUS } = require("../constants");

/**
 * MIDDLEWARE: Check if user is admin
 */
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.body.adminId || req.query.adminId || req.params.adminId;

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: "Admin ID required",
      });
    }

    const user = await User.findById(userId);

    if (!user || user.role !== "admin") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: "Access denied. Admin only.",
      });
    }

    next();
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Error checking admin status",
      error: error.message,
    });
  }
};

/**
 * GET SYSTEM STATISTICS
 */
router.get("/stats/:adminId", isAdmin, async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) }
    });

    // Total listings
    const totalListings = await Listing.countDocuments();
    const activeListings = await Listing.countDocuments({ isActive: true });

    // Total bookings
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ bookingStatus: "pending" });
    const approvedBookings = await Booking.countDocuments({ bookingStatus: "approved" });
    const completedBookings = await Booking.countDocuments({ bookingStatus: "completed" });

    // Revenue statistics
    const payments = await PaymentHistory.find({ status: "paid" });
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const paymentsThisMonth = await PaymentHistory.find({
      status: "paid",
      paidAt: { $gte: new Date(new Date().setDate(1)) }
    });
    const revenueThisMonth = paymentsThisMonth.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Top hosts by listings
    const topHosts = await Listing.aggregate([
      { $group: { _id: "$creator", listingCount: { $sum: 1 } } },
      { $sort: { listingCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "hostInfo"
        }
      },
      { $unwind: "$hostInfo" },
      {
        $project: {
          hostId: "$_id",
          listingCount: 1,
          hostName: { $concat: ["$hostInfo.firstName", " ", "$hostInfo.lastName"] },
          email: "$hostInfo.email"
        }
      }
    ]);

    // Recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("customerId", "firstName lastName email")
      .populate("listingId", "title");

    console.log("✅ Admin stats retrieved successfully");

    res.status(HTTP_STATUS.OK).json({
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
      },
      listings: {
        total: totalListings,
        active: activeListings,
        inactive: totalListings - activeListings,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        approved: approvedBookings,
        completed: completedBookings,
      },
      revenue: {
        total: totalRevenue,
        thisMonth: revenueThisMonth,
        transactionCount: payments.length,
      },
      topHosts,
      recentBookings,
    });
  } catch (error) {
    console.error("❌ Error fetching admin stats:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

/**
 * GET ALL USERS (with pagination)
 */
router.get("/users/:adminId", isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", role = "" } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    console.log(`✅ Retrieved ${users.length} users`);

    res.status(HTTP_STATUS.OK).json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});

/**
 * UPDATE USER ROLE (admin can promote/demote users)
 */
router.patch("/users/:adminId/:userId/role", isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Invalid role. Must be 'user' or 'admin'",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "User not found",
      });
    }

    console.log(`✅ User ${user.email} role updated to ${role}`);

    res.status(HTTP_STATUS.OK).json({
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    console.error("❌ Error updating user role:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update user role",
      error: error.message,
    });
  }
});

/**
 * DELETE USER (soft delete - can implement hard delete if needed)
 */
router.delete("/users/:adminId/:userId", isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // You can implement soft delete by adding isDeleted field
    // Or hard delete as below
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "User not found",
      });
    }

    console.log(`🗑️  User ${user.email} deleted`);

    res.status(HTTP_STATUS.OK).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to delete user",
      error: error.message,
    });
  }
});

/**
 * GET ALL LISTINGS (admin view)
 */
router.get("/listings/:adminId", isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = "" } = req.query;

    const query = {};
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    const listings = await Listing.find(query)
      .populate("creator", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Listing.countDocuments(query);

    console.log(`✅ Retrieved ${listings.length} listings`);

    res.status(HTTP_STATUS.OK).json({
      listings,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching listings:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch listings",
      error: error.message,
    });
  }
});

/**
 * DELETE LISTING
 */
router.delete("/listings/:adminId/:listingId", isAdmin, async (req, res) => {
  try {
    const { listingId } = req.params;

    const listing = await Listing.findByIdAndDelete(listingId);

    if (!listing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Listing not found",
      });
    }

    console.log(`🗑️  Listing ${listing.title} deleted`);

    res.status(HTTP_STATUS.OK).json({
      message: "Listing deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting listing:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to delete listing",
      error: error.message,
    });
  }
});

/**
 * TOGGLE LISTING STATUS
 */
router.patch("/listings/:adminId/:listingId/toggle", isAdmin, async (req, res) => {
  try {
    const { listingId } = req.params;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Listing not found",
      });
    }

    listing.isActive = !listing.isActive;
    await listing.save();

    console.log(`✅ Listing ${listing.title} is now ${listing.isActive ? 'active' : 'inactive'}`);

    res.status(HTTP_STATUS.OK).json({
      message: `Listing ${listing.isActive ? 'activated' : 'deactivated'} successfully`,
      listing,
    });
  } catch (error) {
    console.error("❌ Error toggling listing:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to toggle listing",
      error: error.message,
    });
  }
});

module.exports = router;

