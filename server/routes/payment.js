const router = require("express").Router();
const Booking = require("../models/Booking");
const { HTTP_STATUS } = require("../constants");
const vnpayService = require("../services/vnpayService");

/**
 * CREATE VNPAY PAYMENT URL
 * Creates a booking first, then generates payment URL
 */
router.post("/create-payment-url", async (req, res) => {
  try {
    console.log("📥 Received create-payment-url request:", {
      hasBookingData: !!req.body.bookingData,
      hasAmount: !!req.body.amount,
      bookingDataKeys: req.body.bookingData ? Object.keys(req.body.bookingData) : [],
    });

    const { bookingData, amount, ipAddr } = req.body;

    if (!bookingData) {
      console.error("❌ Missing bookingData in request");
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Booking data is required",
      });
    }

    if (!amount || amount <= 0) {
      console.error("❌ Invalid amount:", amount);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Valid amount is required",
      });
    }

    // Step 1: Create booking first
    console.log("📤 Creating booking before payment...", {
      customerId: bookingData.customerId,
      hostId: bookingData.hostId,
      listingId: bookingData.listingId,
      paymentMethod: bookingData.paymentMethod,
      totalPrice: bookingData.totalPrice,
    });

    const newBooking = new Booking({
      customerId: bookingData.customerId,
      hostId: bookingData.hostId,
      listingId: bookingData.listingId,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      totalPrice: bookingData.totalPrice,
      finalTotalPrice: bookingData.totalPrice, // Set same as totalPrice initially
      paymentMethod: bookingData.paymentMethod,
      depositPercentage: bookingData.depositPercentage || 0,
      depositAmount: bookingData.depositAmount || 0,
      paymentStatus: 'pending', // Pending until payment completes
      status: 'pending',
    });

    const savedBooking = await newBooking.save();
    console.log(`✅ Booking created with ID: ${savedBooking._id} (status: pending payment)`);

    // Step 2: Populate booking for order info
    const booking = await Booking.findById(savedBooking._id)
      .populate("listingId", "title")
      .populate("customerId", "firstName lastName email");

    // Step 3: Generate payment URL
    const orderId = booking._id.toString();

    // Determine order info based on payment type
    const isDeposit = bookingData.paymentMethod === 'vnpay_deposit';
    const orderInfo = isDeposit
      ? `Dat coc ${bookingData.depositPercentage}% - ${booking.listingId?.title || 'Unknown'} - ${booking.customerId?.firstName} ${booking.customerId?.lastName}`
      : `Thanh toan dat phong ${booking.listingId?.title || 'Unknown'} - ${booking.customerId?.firstName} ${booking.customerId?.lastName}`;

    const paymentParams = {
      orderId,
      amount, // Amount is already in VND from client
      orderInfo,
      orderType: 'billpayment',
      locale: 'vn',
      ipAddr: ipAddr || req.ip || '127.0.0.1',
      bankCode: '', // Leave empty for user to select bank
    };

    // Create payment URL
    const paymentUrl = vnpayService.createPaymentUrl(paymentParams);

    console.log(`✅ VNPay payment URL created for booking ${orderId} (Amount: ${amount.toLocaleString()} VND)`);

    res.status(HTTP_STATUS.OK).json({
      paymentUrl,
      bookingId: orderId,
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
 */
router.get("/vnpay-return", async (req, res) => {
  try {
    const vnp_Params = req.query;

    console.log("📥 VNPay return params received:", vnp_Params);

    // Verify signature
    const verifyResult = vnpayService.verifyReturnUrl(vnp_Params);

    if (!verifyResult.isValid) {
      console.error("❌ Invalid signature from VNPay");
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/result?status=error&message=Invalid signature`);
    }

    // Check response code
    const isSuccess = vnpayService.isSuccessful(verifyResult.rspCode);
    const bookingId = verifyResult.orderId;

    if (isSuccess) {
      // Get booking to check payment method
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        console.error(`❌ Booking ${bookingId} not found after payment`);
        return res.redirect(
          `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/result?status=error&message=Booking not found`
        );
      }

      // Determine payment status based on payment method
      let paymentStatus = "paid";
      if (booking.paymentMethod === "vnpay_deposit") {
        paymentStatus = "partially_paid"; // Deposit paid, remaining to be paid on check-in
      }

      // Update booking status to confirmed and paid
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: paymentStatus,
        status: 'accepted', // Auto-accept since paid
        paymentIntentId: verifyResult.transactionNo,
        paidAt: new Date(),
      });

      console.log(`✅ Booking ${bookingId} confirmed with payment status: ${paymentStatus}`);

      // Redirect to success page
      return res.redirect(
        `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/result?status=success&bookingId=${bookingId}&transactionNo=${verifyResult.transactionNo}&paymentStatus=${paymentStatus}`
      );
    } else {
      console.log(`❌ Payment failed for booking ${bookingId}: ${verifyResult.message}`);

      // Payment failed or cancelled - Delete the booking
      await Booking.findByIdAndDelete(bookingId);
      console.log(`🗑️ Booking ${bookingId} deleted due to payment failure/cancellation`);

      // Redirect to failure page
      return res.redirect(
        `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/result?status=failed&message=${encodeURIComponent(verifyResult.message)}`
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

    const bookingId = verifyResult.orderId;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.error(`❌ Booking not found: ${bookingId}`);
      return res.status(HTTP_STATUS.OK).json({
        RspCode: "01",
        Message: "Order not found",
      });
    }

    // Check if already confirmed
    if (booking.paymentStatus === "paid") {
      console.log(`⚠️ Booking ${bookingId} already confirmed`);
      return res.status(HTTP_STATUS.OK).json({
        RspCode: "02",
        Message: "Order already confirmed",
      });
    }

    // Check amount
    if (booking.finalTotalPrice !== verifyResult.amount) {
      console.error(`❌ Invalid amount for booking ${bookingId}`);
      return res.status(HTTP_STATUS.OK).json({
        RspCode: "04",
        Message: "Invalid amount",
      });
    }

    // Update booking if payment successful
    if (vnpayService.isSuccessful(verifyResult.rspCode)) {
      // Determine payment status based on payment method
      let paymentStatus = "paid";
      if (booking.paymentMethod === "vnpay_deposit") {
        paymentStatus = "partially_paid";
      }

      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: paymentStatus,
        status: 'accepted', // Auto-accept since paid
        paymentIntentId: verifyResult.transactionNo,
        paidAt: new Date(),
      });

      console.log(`✅ Booking ${bookingId} confirmed via IPN with status: ${paymentStatus}`);

      return res.status(HTTP_STATUS.OK).json({
        RspCode: "00",
        Message: "Confirm Success",
      });
    } else {
      console.log(`❌ Payment failed for booking ${bookingId} via IPN`);

      // Delete the booking if payment failed
      await Booking.findByIdAndDelete(bookingId);
      console.log(`🗑️ Booking ${bookingId} deleted via IPN due to payment failure`);

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
      totalPrice: booking.finalTotalPrice,
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

module.exports = router;

