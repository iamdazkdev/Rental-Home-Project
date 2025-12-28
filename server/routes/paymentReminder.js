const router = require("express").Router();
const Booking = require("../models/Booking");
const PaymentHistory = require("../models/PaymentHistory");
const Notification = require("../models/Notification");
const VNPayService = require("../services/vnpayService");
const { HTTP_STATUS } = require("../constants");

/**
 * ⚠️ IMPORTANT: Specific routes MUST come BEFORE parameterized routes
 * This prevents Express from treating "vnpay-callback" as a bookingId
 */

/**
 * GET VNPay Payment Callback Handler
 * Route: /api/payment-reminder/vnpay-callback
 * ⚠️ MUST be before /:bookingId route
 */
router.get("/vnpay-callback", async (req, res) => {
  try {
    console.log("📥 VNPay remaining payment callback received");

    const vnpParams = req.query;
    console.log("🔍 VNPay params:", JSON.stringify(vnpParams, null, 2));

    // Verify signature
    const isValid = VNPayService.verifyReturnUrl(vnpParams);

    if (!isValid) {
      console.error("❌ Invalid VNPay signature");
      return res.redirect(
        `${process.env.CLIENT_URL}/payment-reminder-result?success=false&message=Invalid payment signature`
      );
    }

    const responseCode = vnpParams.vnp_ResponseCode;
    const orderId = vnpParams.vnp_TxnRef; // Format: REMAINING_{bookingId}_{timestamp}
    const amount = parseInt(vnpParams.vnp_Amount) / 100; // VNPay returns amount * 100
    const transactionId = vnpParams.vnp_TransactionNo;

    console.log("🔍 Parsing orderId:", orderId);

    // Extract booking ID from orderId
    const parts = orderId.split("_");
    console.log("🔍 Split parts:", parts);

    const bookingId = parts[1];
    console.log("🔍 Extracted bookingId:", bookingId);

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.error(`❌ Booking not found: ${bookingId}`);
      console.error(`❌ OrderId was: ${orderId}`);
      console.error(`❌ Split result: ${JSON.stringify(parts)}`);
      return res.redirect(
        `${process.env.CLIENT_URL}/payment-reminder-result?success=false&message=Booking not found`
      );
    }

    // Check if payment was successful
    if (responseCode === "00") {
      console.log(`✅ Payment successful for booking ${bookingId}`);

      // Update booking payment status
      booking.paymentType = "full"; // Change from "deposit" to "full"
      booking.paidAmount = booking.finalTotalPrice; // Now fully paid
      booking.remainingAmount = 0;
      booking.paymentStatus = "paid";
      booking.paidAt = new Date();
      booking.transactionId = transactionId;
      booking.confirmPaymentMethod = "vnpay"; // Track that they paid via VNPay

      // ✅ AUTO-APPROVE: Same as full payment flow
      if (booking.bookingStatus === "pending") {
        booking.bookingStatus = "approved";
        booking.approvedAt = new Date();
        console.log(`✅ Booking ${bookingId} auto-approved after full payment via VNPay`);
      }

      // Add to payment history
      booking.paymentHistory.push({
        amount,
        method: "vnpay",
        status: "paid",
        transactionId,
        type: "remaining",
        paidAt: new Date(),
        notes: "Remaining payment via VNPay - Auto-approved",
      });

      await booking.save();

      // Create PaymentHistory record
      await PaymentHistory.create({
        bookingId: booking._id,
        userId: booking.customerId,
        amount,
        paymentMethod: "vnpay",
        paymentType: "remaining",
        status: "completed",
        transactionId,
        description: `Remaining payment for booking ${bookingId.slice(-8)}`,
      });

      // Notify host about payment and auto-approval
      await Notification.create({
        userId: booking.hostId,
        type: "booking_approved",
        bookingId: booking._id,
        title: "Full Payment Received - Booking Auto-Approved",
        message: `Guest has completed full payment (${amount.toLocaleString('vi-VN')} VND remaining) via VNPay. The booking has been automatically approved.`,
        isRead: false,
      });

      console.log(`✅ Booking ${bookingId} now fully paid and auto-approved`);

      return res.redirect(
        `${process.env.CLIENT_URL}/payment-reminder-result?success=true&bookingId=${bookingId}&amount=${amount}`
      );
    } else {
      console.log(`❌ Payment failed for booking ${bookingId} - Response code: ${responseCode}`);

      return res.redirect(
        `${process.env.CLIENT_URL}/payment-reminder-result?success=false&message=Payment failed&code=${responseCode}`
      );
    }
  } catch (error) {
    console.error("❌ Error in VNPay callback:", error);
    return res.redirect(
      `${process.env.CLIENT_URL}/payment-reminder-result?success=false&message=Payment processing error`
    );
  }
});

/**
 * GET Booking Details for Payment Reminder
 * Route: /api/payment-reminder/:bookingId
 */
router.get("/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("customerId", "firstName lastName email profileImagePath")
      .populate("hostId", "firstName lastName email profileImagePath")
      .populate("listingId", "title city province country listingPhotoPaths price");

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify this is a deposit booking with remaining payment
    if (booking.paymentType !== "deposit" || booking.remainingAmount <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "This booking does not require additional payment",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      booking: {
        _id: booking._id,
        listingId: booking.listingId,
        customerId: booking.customerId,
        hostId: booking.hostId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        finalTotalPrice: booking.finalTotalPrice,
        depositAmount: booking.depositAmount,
        remainingAmount: booking.remainingAmount,
        paidAmount: booking.paidAmount,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
        paymentMethod: booking.paymentMethod,
        paymentType: booking.paymentType,
      },
    });
  } catch (error) {
    console.error("Error fetching payment reminder details:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch booking details",
      error: error.message,
    });
  }
});

/**
 * POST Confirm Cash Payment
 * Route: /api/payment-reminder/:bookingId/confirm-cash
 */
router.post("/:bookingId/confirm-cash", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Update booking - guest confirms they will pay cash at check-in
    booking.cashPaymentConfirmed = true;
    booking.cashPaymentConfirmedAt = new Date();
    booking.confirmPaymentMethod = "cash"; // NEW: Track confirmation method
    await booking.save();

    // Create notification for host
    await Notification.create({
      userId: booking.hostId,
      type: "payment_reminder",
      bookingId: booking._id,
      title: "Guest Will Pay Cash at Check-in",
      message: `Guest has confirmed they will pay the remaining ${booking.remainingAmount.toLocaleString('vi-VN')} VND in cash at check-in.`,
      isRead: false,
    });

    console.log(`✅ Cash payment confirmed for booking ${bookingId}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Cash payment confirmed. Please pay the remaining amount at check-in.",
      booking,
    });
  } catch (error) {
    console.error("Error confirming cash payment:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to confirm cash payment",
      error: error.message,
    });
  }
});

/**
 * POST Pay Remaining Amount via VNPay
 * Route: /api/payment-reminder/:bookingId/pay-vnpay
 */
router.post("/:bookingId/pay-vnpay", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { ipAddr } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate("listingId", "title");

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.remainingAmount <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "No remaining amount to pay",
      });
    }

    // Create VNPay payment URL for remaining amount
    const orderInfo = `Remaining payment - Booking ${bookingId.slice(-8)}`;
    const paymentUrl = VNPayService.createPaymentUrl({
      amount: booking.remainingAmount,
      orderId: `REMAINING_${bookingId}_${Date.now()}`,
      orderInfo,
      ipAddr: ipAddr || req.ip,
      returnUrl: `${process.env.API_BASE_URL || 'http://localhost:3001'}/payment-reminder/vnpay-callback`,
    });

    console.log(`💳 VNPay payment URL created for remaining payment: ${booking.remainingAmount} VND`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      paymentUrl,
      amount: booking.remainingAmount,
      bookingId: booking._id,
    });
  } catch (error) {
    console.error("Error creating VNPay payment:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to create payment",
      error: error.message,
    });
  }
});


module.exports = router;

