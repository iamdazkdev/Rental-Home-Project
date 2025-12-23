const router = require("express").Router();
const Booking = require("../models/Booking");
const { HTTP_STATUS } = require("../constants");

// GET USER BOOKING HISTORY (Guest perspective)
router.get("/user/:userId/history", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { customerId: userId };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Get bookings with populated data
    const bookings = await Booking.find(query)
      .populate("customerId", "firstName lastName email profileImagePath")
      .populate("hostId", "firstName lastName email profileImagePath")
      .populate("listingId", "title city province country listingPhotoPaths price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Booking.countDocuments(query);

    // Calculate statistics
    const stats = await Booking.aggregate([
      { $match: { customerId: userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalSpent: { $sum: "$finalTotalPrice" },
        },
      },
    ]);

    // Calculate total spent
    const totalSpent = await Booking.aggregate([
      {
        $match: {
          customerId: userId,
          status: { $in: ["accepted", "completed", "checked_out"] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$finalTotalPrice", "$totalPrice"] } },
        },
      },
    ]);

    res.status(HTTP_STATUS.OK).json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      statistics: {
        byStatus: stats,
        totalSpent: totalSpent[0]?.total || 0,
        totalBookings: total,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching user booking history:", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch booking history",
      error: err.message,
    });
  }
});

// GET HOST BOOKING HISTORY (Host perspective)
router.get("/host/:hostId/history", async (req, res) => {
  try {
    const { hostId } = req.params;
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { hostId };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Get bookings with populated data
    const bookings = await Booking.find(query)
      .populate("customerId", "firstName lastName email profileImagePath")
      .populate("hostId", "firstName lastName email profileImagePath")
      .populate("listingId", "title city province country listingPhotoPaths price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Booking.countDocuments(query);

    // Calculate statistics
    const stats = await Booking.aggregate([
      { $match: { hostId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalEarnings: { $sum: "$finalTotalPrice" },
        },
      },
    ]);

    // Calculate total earnings
    const totalEarnings = await Booking.aggregate([
      {
        $match: {
          hostId,
          status: { $in: ["accepted", "completed", "checked_out"] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$finalTotalPrice", "$totalPrice"] } },
        },
      },
    ]);

    // Monthly earnings (last 12 months)
    const monthlyEarnings = await Booking.aggregate([
      {
        $match: {
          hostId,
          status: { $in: ["accepted", "completed", "checked_out"] },
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          earnings: { $sum: { $ifNull: ["$finalTotalPrice", "$totalPrice"] } },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.status(HTTP_STATUS.OK).json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      statistics: {
        byStatus: stats,
        totalEarnings: totalEarnings[0]?.total || 0,
        totalBookings: total,
        monthlyEarnings,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching host booking history:", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch booking history",
      error: err.message,
    });
  }
});

// GET SINGLE BOOKING DETAILS
router.get("/booking/:bookingId/details", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("customerId", "firstName lastName email profileImagePath")
      .populate("hostId", "firstName lastName email profileImagePath")
      .populate("listingId");

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Booking not found",
      });
    }

    res.status(HTTP_STATUS.OK).json(booking);
  } catch (err) {
    console.error("❌ Error fetching booking details:", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch booking details",
      error: err.message,
    });
  }
});

module.exports = router;

