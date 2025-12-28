const router = require("express").Router();
const PaymentHistory = require("../models/PaymentHistory");
const { HTTP_STATUS } = require("../constants");

/**
 * GET PAYMENT HISTORY BY BOOKING
 * Returns all payment transactions for a specific booking
 */
router.get("/booking/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const payments = await PaymentHistory.find({ bookingId })
      .sort({ createdAt: -1 })
      .populate("recordedBy", "firstName lastName")
      .lean();

    console.log(`✅ Found ${payments.length} payment(s) for booking ${bookingId}`);

    res.status(HTTP_STATUS.OK).json(payments);
  } catch (error) {
    console.error("❌ Error fetching payment history by booking:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch payment history",
      error: error.message,
    });
  }
});

/**
 * GET PAYMENT HISTORY BY CUSTOMER
 * Returns all payment transactions made by a customer
 */
router.get("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const payments = await PaymentHistory.find({ customerId })
      .sort({ createdAt: -1 })
      .populate("bookingId", "startDate endDate totalPrice")
      .populate("listingId", "title")
      .lean();

    console.log(`✅ Found ${payments.length} payment(s) by customer ${customerId}`);

    res.status(HTTP_STATUS.OK).json(payments);
  } catch (error) {
    console.error("❌ Error fetching payment history by customer:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch payment history",
      error: error.message,
    });
  }
});

/**
 * GET PAYMENT HISTORY BY HOST
 * Returns all payments received by a host
 */
router.get("/host/:hostId", async (req, res) => {
  try {
    const { hostId } = req.params;

    const payments = await PaymentHistory.find({ hostId })
      .sort({ createdAt: -1 })
      .populate("bookingId", "startDate endDate totalPrice")
      .populate("customerId", "firstName lastName email")
      .populate("listingId", "title")
      .lean();

    console.log(`✅ Found ${payments.length} payment(s) for host ${hostId}`);

    res.status(HTTP_STATUS.OK).json(payments);
  } catch (error) {
    console.error("❌ Error fetching payment history by host:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch payment history",
      error: error.message,
    });
  }
});

/**
 * GET PAYMENT STATISTICS FOR HOST
 * Returns aggregated payment stats (total, by method, by status)
 */
router.get("/host/:hostId/stats", async (req, res) => {
  try {
    const { hostId } = req.params;
    const { startDate, endDate } = req.query;

    const matchQuery = { hostId };

    // Optional date range filter
    if (startDate || endDate) {
      matchQuery.paidAt = {};
      if (startDate) matchQuery.paidAt.$gte = new Date(startDate);
      if (endDate) matchQuery.paidAt.$lte = new Date(endDate);
    }

    // Aggregate statistics
    const stats = await PaymentHistory.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          // Total by status
          byStatus: [
            { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } }
          ],
          // Total by method
          byMethod: [
            { $group: { _id: "$method", total: { $sum: "$amount" }, count: { $sum: 1 } } }
          ],
          // Total by type
          byType: [
            { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } }
          ],
          // Overall total
          overall: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] } },
                totalTransactions: { $sum: 1 },
                avgTransaction: { $avg: "$amount" }
              }
            }
          ]
        }
      }
    ]);

    console.log(`✅ Generated payment stats for host ${hostId}`);

    res.status(HTTP_STATUS.OK).json(stats[0]);
  } catch (error) {
    console.error("❌ Error generating payment stats:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to generate payment statistics",
      error: error.message,
    });
  }
});

/**
 * GET TOTAL PAID FOR BOOKING
 * Returns total amount paid for a specific booking
 */
router.get("/booking/:bookingId/total", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const total = await PaymentHistory.getTotalPaidForBooking(bookingId);

    console.log(`✅ Total paid for booking ${bookingId}: ${total} VND`);

    res.status(HTTP_STATUS.OK).json({
      bookingId,
      totalPaid: total,
      formattedTotal: total.toLocaleString('vi-VN')
    });
  } catch (error) {
    console.error("❌ Error calculating total paid:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to calculate total paid",
      error: error.message,
    });
  }
});

module.exports = router;

