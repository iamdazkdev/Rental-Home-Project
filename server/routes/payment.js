const router = require("express").Router();
const Booking = require("../models/Booking");
const PendingBooking = require("../models/PendingBooking");
const PaymentHistory = require("../models/PaymentHistory");
const { HTTP_STATUS } = require("../constants");
const vnpayService = require("../services/vnpayService");

/**
 * CREATE VNPAY PAYMENT URL
 * Stores booking data in PendingBooking collection and generates payment URL
 * Booking will be created only after successful payment
 */
router.post("/create-payment-url", async (req, res) => {
  try {
    console.log("📥 Received create-payment-url request:", {
      hasTempOrderId: !!req.body.tempOrderId,
      hasBookingData: !!req.body.bookingData,
      hasAmount: !!req.body.amount,
      hasReturnUrl: !!req.body.returnUrl,
      returnUrlValue: req.body.returnUrl, // ✅ Show actual value
    });

    const { tempOrderId: providedTempOrderId, bookingData, amount, orderInfo, ipAddr, returnUrl } = req.body;

    // NEW FLOW: If tempOrderId is provided, use existing BookingIntent
    if (providedTempOrderId) {
      console.log("🔄 Using existing BookingIntent:", providedTempOrderId);

      if (!amount || amount <= 0) {
        console.error("❌ Invalid amount:", amount);
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: "Valid amount is required",
        });
      }

      // Use the provided tempOrderId (which is the intentId from BookingIntent)
      const paymentParams = {
        orderId: providedTempOrderId,
        amount,
        orderInfo: orderInfo || `Payment - ${providedTempOrderId}`,
        orderType: 'billpayment',
        locale: 'vn',
        ipAddr: ipAddr || req.ip || '127.0.0.1',
        bankCode: '',
        returnUrl: returnUrl, // ✅ Pass custom returnUrl from mobile or web
      };

      const paymentUrl = vnpayService.createPaymentUrl(paymentParams);

      console.log(`✅ VNPay payment URL created for BookingIntent ${providedTempOrderId} (Amount: ${amount.toLocaleString()} VND)`);

      return res.status(HTTP_STATUS.OK).json({
        paymentUrl,
        tempOrderId: providedTempOrderId,
        amount: amount,
      });
    }

    // OLD FLOW: If bookingData is provided, create PendingBooking (for backward compatibility)
    if (!bookingData) {
      console.error("❌ Missing both tempOrderId and bookingData in request");
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Either tempOrderId or bookingData is required",
      });
    }

    if (!amount || amount <= 0) {
      console.error("❌ Invalid amount:", amount);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Valid amount is required",
      });
    }

    // Generate a temporary order ID
    const tempOrderId = `TEMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log("📦 Creating pending booking in database:", {
      tempOrderId,
      customerId: bookingData.customerId,
      hostId: bookingData.hostId,
      listingId: bookingData.listingId,
      paymentMethod: bookingData.paymentMethod,
      totalPrice: bookingData.totalPrice,
    });

    // Store pending booking in database
    const pendingBooking = new PendingBooking({
      tempOrderId,
      customerId: bookingData.customerId,
      hostId: bookingData.hostId,
      listingId: bookingData.listingId,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      totalPrice: bookingData.totalPrice,
      paymentMethod: bookingData.paymentMethod,
      depositPercentage: bookingData.depositPercentage || 0,
      depositAmount: bookingData.depositAmount || 0,
      paymentAmount: amount,
      status: "pending_payment",
    });

    await pendingBooking.save();
    console.log(`✅ Pending booking saved to database (expires in 30 minutes)`);

    // Determine order info based on payment type
    const isDeposit = bookingData.paymentMethod === 'vnpay_deposit';
    const finalOrderInfo = isDeposit
      ? `Dat coc ${bookingData.depositPercentage}% - Booking ${tempOrderId}`
      : `Thanh toan dat phong - Booking ${tempOrderId}`;

    const paymentParams = {
      orderId: tempOrderId,
      amount, // Amount is already in VND from client
      orderInfo: finalOrderInfo,
      orderType: 'billpayment',
      locale: 'vn',
      ipAddr: ipAddr || req.ip || '127.0.0.1',
      bankCode: '', // Leave empty for user to select bank
      returnUrl: returnUrl, // ✅ Pass custom returnUrl if provided
    };

    // Create payment URL
    const paymentUrl = vnpayService.createPaymentUrl(paymentParams);

    console.log(`✅ VNPay payment URL created with temp order ${tempOrderId} (Amount: ${amount.toLocaleString()} VND)`);
    console.log(`⏳ Booking will be created after successful payment`);

    res.status(HTTP_STATUS.OK).json({
      paymentUrl,
      tempOrderId: tempOrderId,
      amount: amount,
    });
  } catch (error) {
    console.error("❌ Error creating VNPay payment URL:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to create payment URL",
      error: error.message,
    });
  }
});

/**
 * VNPAY RETURN URL
 * Handle redirect from VNPay after payment
 * Creates booking only on successful payment
 */
router.get("/vnpay-return", async (req, res) => {
  try {
    const vnp_Params = req.query;

    console.log("📥 VNPay return params received:", vnp_Params);

    // Extract temp order ID from params
    const tempOrderId = vnp_Params.vnp_TxnRef || vnp_Params.orderId;

    if (!tempOrderId) {
      console.error("❌ No order ID in VNPay return params");
      return res.redirect(
        `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/result?status=error&message=Missing order ID`
      );
    }

    // Retrieve pending booking from database
    const pendingBooking = await PendingBooking.findOne({
      tempOrderId,
      status: "pending_payment"
    });

    if (!pendingBooking) {
      console.error(`❌ Pending booking not found or already processed: ${tempOrderId}`);
      return res.redirect(
        `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/result?status=error&message=Booking data not found or expired`
      );
    }

    // Verify payment signature (in production, verify the signature properly)
    const verifyResult = vnpayService.verifyReturnUrl(vnp_Params);
    const isPaymentSuccessful = verifyResult.isValid && vnpayService.isSuccessful(verifyResult.rspCode);

    console.log(`💳 Payment verification: ${isPaymentSuccessful ? 'SUCCESS' : 'FAILED'}`);

    if (isPaymentSuccessful) {
      // Payment successful - create actual booking
      console.log(`✅ Payment successful, creating booking now...`);

      // Determine payment method (map vnpay_full/vnpay_deposit to vnpay)
      let paymentMethod = "vnpay";
      if (pendingBooking.paymentMethod === "cash") {
        paymentMethod = "cash";
      }

      // Determine payment status based on payment method
      let paymentStatus = "paid";
      if (pendingBooking.paymentMethod === "vnpay_deposit") {
        paymentStatus = "partially_paid";
      }

      const transactionNo = vnp_Params.vnp_TransactionNo || `DEMO_${Date.now()}`;

      // Determine payment type for history
      let paymentType = "full";
      let remainingAmount = 0;
      let remainingDueDate = null;

      if (pendingBooking.paymentMethod === "vnpay_deposit") {
        paymentType = "deposit";
        remainingAmount = pendingBooking.totalPrice - pendingBooking.depositAmount;
        remainingDueDate = new Date(pendingBooking.startDate); // Due at check-in
      } else if (pendingBooking.paymentMethod === "cash") {
        paymentType = "cash";
      }

      // Determine booking status
      // If full payment via VNPay → auto-approve (no host approval needed)
      let bookingStatus = "pending";
      let legacyStatus = "pending";
      let approvedAt = null;

      if (paymentType === "full" && paymentMethod === "vnpay") {
        bookingStatus = "approved"; // ✅ Auto-approved for full VNPay payment
        legacyStatus = "accepted";  // For backward compatibility
        approvedAt = new Date();
        console.log(`🎉 Auto-approving booking (Full payment via VNPay)`);
      }

      // Create payment history entry
      const paymentHistoryEntry = {
        amount: pendingBooking.paymentAmount,
        method: paymentMethod,
        status: "paid",
        transactionId: transactionNo,
        type: paymentType,
        paidAt: new Date(),
        notes: paymentType === "deposit"
          ? `Deposit payment (${pendingBooking.depositPercentage}%) via VNPay`
          : paymentType === "cash"
          ? "Cash payment on arrival"
          : "Full payment via VNPay - Auto-approved",
      };

      // Create the actual booking
      const newBooking = new Booking({
        customerId: pendingBooking.customerId,
        hostId: pendingBooking.hostId,
        listingId: pendingBooking.listingId,
        startDate: pendingBooking.startDate,
        endDate: pendingBooking.endDate,
        totalPrice: pendingBooking.totalPrice,
        finalTotalPrice: pendingBooking.totalPrice,
        paymentMethod: paymentMethod, // ✅ FIXED: Use mapped value (vnpay or cash)
        paymentType: paymentType, // ✅ FIXED: Add required paymentType field
        depositPercentage: pendingBooking.depositPercentage || 0,
        depositAmount: pendingBooking.depositAmount || 0,
        paymentStatus: paymentStatus,
        bookingStatus: bookingStatus, // ✅ "approved" for full VNPay, "pending" otherwise
        status: legacyStatus, // ✅ "accepted" for full VNPay, "pending" otherwise (backward compatibility)
        approvedAt: approvedAt, // ✅ Set approval timestamp for auto-approved bookings
        paymentIntentId: transactionNo,
        paidAt: new Date(),
        // Add payment history
        paymentHistory: [paymentHistoryEntry],
        remainingAmount: remainingAmount,
        remainingDueDate: remainingDueDate,
      });

      const savedBooking = await newBooking.save();
      const bookingId = savedBooking._id.toString();

      console.log(`✅ Booking ${bookingId} created with payment status: ${paymentStatus}, booking status: ${bookingStatus}`);

      // DUAL-WRITE: Save to standalone PaymentHistory collection
      try {
        const paymentHistoryDoc = new PaymentHistory({
          bookingId: savedBooking._id,
          customerId: pendingBooking.customerId,
          hostId: pendingBooking.hostId,
          listingId: pendingBooking.listingId,
          amount: pendingBooking.paymentAmount,
          method: "vnpay",
          status: "paid",
          transactionId: transactionNo,
          type: paymentType,
          paidAt: new Date(),
          notes: paymentType === "deposit"
            ? `Deposit payment (${pendingBooking.depositPercentage}%) via VNPay`
            : "Full payment via VNPay",
          vnpayData: {
            vnp_TransactionNo: vnp_Params.vnp_TransactionNo,
            vnp_BankCode: vnp_Params.vnp_BankCode,
            vnp_CardType: vnp_Params.vnp_CardType,
            vnp_OrderInfo: vnp_Params.vnp_OrderInfo,
            vnp_PayDate: vnp_Params.vnp_PayDate,
          }
        });

        await paymentHistoryDoc.save();
        console.log(`✅ Payment history saved to standalone collection: ${paymentHistoryDoc._id}`);
      } catch (historyError) {
        console.error("⚠️ Failed to save to PaymentHistory collection (non-critical):", historyError);
        // Don't fail the booking if history save fails
      }

      // Update pending booking status to converted
      await PendingBooking.findByIdAndUpdate(pendingBooking._id, {
        status: "converted",
      });

      console.log(`✅ Pending booking ${tempOrderId} marked as converted`);

      // Redirect to success page
      return res.redirect(
        `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/result?status=success&bookingId=${bookingId}&transactionNo=${transactionNo}&paymentStatus=${paymentStatus}`
      );
    } else {
      // Payment failed
      console.log(`❌ Payment failed or cancelled for temp order ${tempOrderId}`);

      // Update pending booking status to expired
      await PendingBooking.findByIdAndUpdate(pendingBooking._id, {
        status: "expired",
      });

      // Redirect to failure page
      return res.redirect(
        `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/result?status=failed&message=Payment failed or cancelled`
      );
    }

  } catch (error) {
    console.error("❌ Error handling VNPay return:", error);
    return res.redirect(
      `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/result?status=error&message=${encodeURIComponent(error.message)}`
    );
  }
});

/**
 * VNPAY IPN (Instant Payment Notification)
 * Handle server-to-server notification from VNPay
 * Creates booking on successful payment
 */
router.post("/vnpay-ipn", async (req, res) => {
  try {
    const vnp_Params = req.query;

    console.log("📥 VNPay IPN received:", vnp_Params);

    // Verify signature
    const verifyResult = vnpayService.verifyIpn(vnp_Params);

    if (!verifyResult.isValid) {
      console.error("❌ Invalid signature from VNPay IPN");
      return res.status(HTTP_STATUS.OK).json({
        RspCode: "97",
        Message: "Invalid Signature",
      });
    }

    const tempOrderId = verifyResult.orderId;

    // Retrieve pending booking from database
    const pendingBooking = await PendingBooking.findOne({
      tempOrderId,
      status: "pending_payment"
    });

    if (!pendingBooking) {
      console.error(`❌ Pending booking not found or already processed: ${tempOrderId}`);
      return res.status(HTTP_STATUS.OK).json({
        RspCode: "01",
        Message: "Order not found",
      });
    }

    // Create booking if payment successful
    if (vnpayService.isSuccessful(verifyResult.rspCode)) {
      // Determine payment method (map vnpay_full/vnpay_deposit to vnpay)
      let paymentMethod = "vnpay";
      if (pendingBooking.paymentMethod === "cash") {
        paymentMethod = "cash";
      }

      // Determine payment status based on payment method
      let paymentStatus = "paid";
      if (pendingBooking.paymentMethod === "vnpay_deposit") {
        paymentStatus = "partially_paid";
      }

      // Determine payment type
      let paymentType = "full";
      let remainingAmount = 0;
      let remainingDueDate = null;

      if (pendingBooking.paymentMethod === "vnpay_deposit") {
        paymentType = "deposit";
        remainingAmount = pendingBooking.totalPrice - pendingBooking.depositAmount;
        remainingDueDate = new Date(pendingBooking.startDate);
      } else if (pendingBooking.paymentMethod === "cash") {
        paymentType = "cash";
      }

      // Determine booking status
      // If full payment via VNPay → auto-approve (no host approval needed)
      let bookingStatus = "pending";
      let legacyStatus = "pending";
      let approvedAt = null;

      if (paymentType === "full" && paymentMethod === "vnpay") {
        bookingStatus = "approved"; // ✅ Auto-approved for full VNPay payment
        legacyStatus = "accepted";  // For backward compatibility
        approvedAt = new Date();
        console.log(`🎉 Auto-approving booking via IPN (Full payment via VNPay)`);
      }

      const newBooking = new Booking({
        customerId: pendingBooking.customerId,
        hostId: pendingBooking.hostId,
        listingId: pendingBooking.listingId,
        startDate: pendingBooking.startDate,
        endDate: pendingBooking.endDate,
        totalPrice: pendingBooking.totalPrice,
        finalTotalPrice: pendingBooking.totalPrice,
        paymentMethod: paymentMethod, // ✅ FIXED: Use mapped value
        paymentType: paymentType, // ✅ FIXED: Add required field
        depositPercentage: pendingBooking.depositPercentage || 0,
        depositAmount: pendingBooking.depositAmount || 0,
        paymentStatus: paymentStatus,
        bookingStatus: bookingStatus, // ✅ "approved" for full VNPay, "pending" otherwise
        status: legacyStatus, // ✅ "accepted" for full VNPay, "pending" otherwise
        approvedAt: approvedAt, // ✅ Set approval timestamp for auto-approved bookings
        paymentIntentId: verifyResult.transactionNo,
        paidAt: new Date(),
        remainingAmount: remainingAmount,
        remainingDueDate: remainingDueDate,
      });

      const savedBooking = await newBooking.save();

      console.log(`✅ Booking ${savedBooking._id} created via IPN with payment status: ${paymentStatus}, booking status: ${bookingStatus}`);

      // Update pending booking status to converted
      await PendingBooking.findByIdAndUpdate(pendingBooking._id, {
        status: "converted",
      });

      return res.status(HTTP_STATUS.OK).json({
        RspCode: "00",
        Message: "Confirm Success",
      });
    } else {
      console.log(`❌ Payment failed for temp order ${tempOrderId} via IPN`);

      // Update pending booking status to expired
      await PendingBooking.findByIdAndUpdate(pendingBooking._id, {
        status: "expired",
      });

      return res.status(HTTP_STATUS.OK).json({
        RspCode: "00",
        Message: "Confirm Success",
      });
    }
  } catch (error) {
    console.error("❌ Error handling VNPay IPN:", error);
    return res.status(HTTP_STATUS.OK).json({
      RspCode: "99",
      Message: "Unknown error",
    });
  }
});

/**
 * GET PAYMENT STATUS
 * Check the payment status of a booking
 */
router.get("/status/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("listingId", "title")
      .populate("customerId", "firstName lastName");

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Booking not found",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      bookingId: booking._id,
      paymentStatus: booking.paymentStatus || "unpaid",
      paymentIntentId: booking.paymentIntentId,
      paidAt: booking.paidAt,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.finalTotalPrice || booking.totalPrice,
      depositAmount: booking.depositAmount || 0,
      depositPercentage: booking.depositPercentage || 0,
      paymentMethod: booking.paymentMethod || "unknown",
      listing: booking.listingId,
      customer: booking.customerId,
    });
  } catch (error) {
    console.error("❌ Error getting payment status:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to get payment status",
      error: error.message,
    });
  }
});

/**
 * GET TRANSACTION INFO
 * Query transaction information from VNPay
 */
router.post("/query-transaction", async (req, res) => {
  try {
    const { orderId } = req.body;

    // This would require VNPay Query API implementation
    // For now, we'll just return the booking status
    const booking = await Booking.findById(orderId);

    if (!booking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Transaction not found",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      orderId: booking._id,
      amount: booking.finalTotalPrice,
      paymentStatus: booking.paymentStatus,
      transactionNo: booking.paymentIntentId,
      paidAt: booking.paidAt,
    });
  } catch (error) {
    console.error("❌ Error querying transaction:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to query transaction",
      error: error.message,
    });
  }
});

/**
 * CLEANUP EXPIRED PENDING BOOKINGS
 * Manual cleanup endpoint (MongoDB TTL should handle this automatically)
 */
router.post("/cleanup-expired", async (req, res) => {
  try {
    const result = await PendingBooking.deleteMany({
      status: "pending_payment",
      expiresAt: { $lt: new Date() }
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} expired pending bookings`);

    res.status(HTTP_STATUS.OK).json({
      message: "Cleanup successful",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Error cleaning up expired bookings:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to cleanup expired bookings",
      error: error.message,
    });
  }
});

/**
 * GET PENDING BOOKING STATUS
 * Check if a pending booking still exists and is valid
 */
router.get("/pending/:tempOrderId", async (req, res) => {
  try {
    const { tempOrderId } = req.params;

    const pendingBooking = await PendingBooking.findOne({ tempOrderId })
      .populate("listingId", "title")
      .populate("customerId", "firstName lastName");

    if (!pendingBooking) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Pending booking not found or expired",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      tempOrderId: pendingBooking.tempOrderId,
      status: pendingBooking.status,
      paymentAmount: pendingBooking.paymentAmount,
      paymentMethod: pendingBooking.paymentMethod,
      expiresAt: pendingBooking.expiresAt,
      listing: pendingBooking.listingId,
      customer: pendingBooking.customerId,
    });
  } catch (error) {
    console.error("❌ Error getting pending booking:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to get pending booking",
      error: error.message,
    });
  }
});

module.exports = router;

