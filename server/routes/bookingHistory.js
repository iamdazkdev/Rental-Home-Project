const router = require("express").Router();
const Booking = require("../models/Booking");
const { HTTP_STATUS } = require("../constants");

// GET USER BOOKING HISTORY (Guest perspective - Completed/Cancelled/Rejected bookings only)
router.get("/user/:userId/history", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build query - Only show COMPLETED/CANCELLED/REJECTED/EXPIRED/CHECKED_OUT bookings
    const completedStatuses = ["rejected", "cancelled", "checked_out", "completed", "expired"];
    const query = {
      customerId: userId,
      bookingStatus: { $in: completedStatuses }
    };

    // Filter by specific status if provided
    if (status) {
      query.bookingStatus = status;
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

    // Calculate statistics (only for completed bookings)
    const stats = await Booking.aggregate([
      {
        $match: {
          customerId: userId,
          bookingStatus: { $in: completedStatuses }
        }
      },
      {
        $group: {
          _id: "$bookingStatus",
          count: { $sum: 1 },
          totalSpent: { $sum: "$finalTotalPrice" },
        },
      },
    ]);

    // Calculate total spent - based on ACTUAL PAID AMOUNT
    // Include:
    // 1. Completed/checked_out bookings: full amount
    // 2. Cancelled bookings: deposit amount if paid
    // 3. Any booking where paidAmount > 0
    const totalSpent = await Booking.aggregate([
      {
        $match: {
          customerId: userId,
          bookingStatus: { $in: completedStatuses },
          // Only count if actually paid something
          $or: [
            { paidAmount: { $gt: 0 } }, // Has paid amount
            { paymentStatus: { $in: ["paid", "partially_paid"] } }, // Or payment confirmed
          ]
        }
      },
      {
        $group: {
          _id: null,
          // Sum actual paid amount (not finalTotalPrice)
          total: {
            $sum: {
              $cond: [
                { $gt: ["$paidAmount", 0] },
                "$paidAmount", // Use paidAmount if > 0
                { $ifNull: ["$finalTotalPrice", "$totalPrice"] } // Fallback to total
              ]
            }
          },
        },
      },
    ]);

    console.log(`✅ Fetched ${bookings.length} history bookings for user ${userId}`);

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

// GET HOST BOOKING HISTORY (Host perspective - Completed/Cancelled/Rejected bookings only)
router.get("/host/:hostId/history", async (req, res) => {
  try {
    const { hostId } = req.params;
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build query - Only show COMPLETED/CANCELLED/REJECTED/EXPIRED/CHECKED_OUT bookings
    const completedStatuses = ["rejected", "cancelled", "checked_out", "completed", "expired"];
    const query = {
      hostId,
      bookingStatus: { $in: completedStatuses }
    };

    // Filter by specific status if provided
    if (status) {
      query.bookingStatus = status;
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

    // Calculate statistics (only for completed bookings)
    const stats = await Booking.aggregate([
      {
        $match: {
          hostId,
          bookingStatus: { $in: completedStatuses }
        }
      },
      {
        $group: {
          _id: "$bookingStatus",
          count: { $sum: 1 },
          totalEarnings: { $sum: "$finalTotalPrice" },
        },
      },
    ]);

    console.log(`✅ Fetched ${bookings.length} history bookings for host ${hostId}`);

    // Calculate total earnings
    // Only count earnings from:
    // 1. Bookings that are checked_out or completed
    // 2. VNPay payments (already paid) OR Cash payments (only if checked_out/completed)
    const totalEarnings = await Booking.aggregate([
      {
        $match: {
          hostId,
          bookingStatus: { $in: ["checked_out", "completed"] },
          $or: [
            { paymentMethod: "vnpay", paymentStatus: "paid" },
            { paymentMethod: "vnpay", paymentStatus: "partially_paid" },
            { paymentMethod: "cash", bookingStatus: { $in: ["checked_out", "completed"] } }
          ]
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
    // Same logic: only count confirmed revenue
    const monthlyEarnings = await Booking.aggregate([
      {
        $match: {
          hostId,
          bookingStatus: { $in: ["checked_out", "completed"] },
          $or: [
            { paymentMethod: "vnpay", paymentStatus: "paid" },
            { paymentMethod: "vnpay", paymentStatus: "partially_paid" },
            { paymentMethod: "cash", bookingStatus: { $in: ["checked_out", "completed"] } }
          ],
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

