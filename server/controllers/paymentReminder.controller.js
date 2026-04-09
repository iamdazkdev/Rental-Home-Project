const paymentReminderService = require("../services/paymentReminder.service");
const vnpayService = require("../services/vnpayService");
const { HTTP_STATUS } = require("../constants");

const vnpayCallback = async (req, res) => {
    const vnpParams = req.query;
    const isValid = vnpayService.verifyReturnUrl(vnpParams);

    if (!isValid) {
        return res.redirect(`${process.env.CLIENT_URL}/payment-reminder-result?success=false&message=Invalid payment signature`);
    }

    const responseCode = vnpParams.vnp_ResponseCode;
    const orderId = vnpParams.vnp_TxnRef;
    const amount = parseInt(vnpParams.vnp_Amount) / 100;
    const transactionId = vnpParams.vnp_TransactionNo;

    const parts = orderId.split("_");
    const bookingId = parts[1];

    const booking = await paymentReminderService.findBooking(bookingId);

    if (!booking) {
        return res.redirect(`${process.env.CLIENT_URL}/payment-reminder-result?success=false&message=Booking not found`);
    }

    if (responseCode === "00") {
        booking.paymentType = "full";
        booking.paidAmount = booking.finalTotalPrice;
        booking.remainingAmount = 0;
        booking.paymentStatus = "paid";
        booking.paidAt = new Date();
        booking.transactionId = transactionId;
        booking.confirmPaymentMethod = "vnpay";

        if (booking.bookingStatus === "pending") {
            booking.bookingStatus = "approved";
            booking.approvedAt = new Date();
        }

        booking.paymentHistory.push({
            amount,
            method: "vnpay",
            status: "paid",
            transactionId,
            type: "remaining",
            paidAt: new Date(),
            notes: "Remaining payment via VNPay - Auto-approved",
        });

        await paymentReminderService.saveBooking(booking);

        await paymentReminderService.createPaymentHistory({
            bookingId: booking._id,
            userId: booking.customerId,
            amount,
            paymentMethod: "vnpay",
            paymentType: "remaining",
            status: "completed",
            transactionId,
            description: `Remaining payment for booking ${bookingId.slice(-8)}`,
        });

        await paymentReminderService.createNotification({
            userId: booking.hostId,
            type: "booking_approved",
            bookingId: booking._id,
            title: "Full Payment Received - Booking Auto-Approved",
            message: `Guest has completed full payment (${amount.toLocaleString('vi-VN')} VND remaining) via VNPay. The booking has been automatically approved.`,
            isRead: false,
        });

        return res.redirect(`${process.env.CLIENT_URL}/payment-reminder-result?success=true&bookingId=${bookingId}&amount=${amount}`);
    } else {
        return res.redirect(`${process.env.CLIENT_URL}/payment-reminder-result?success=false&message=Payment failed&code=${responseCode}`);
    }
};

const getBookingDetails = async (req, res) => {
    const booking = await paymentReminderService.findBookingPopulated(req.params.bookingId);

    if (!booking) {
        const error = new Error("Booking not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
    }

    if (booking.paymentType !== "deposit" || booking.remainingAmount <= 0) {
        const error = new Error("This booking does not require additional payment");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
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
};

const confirmCash = async (req, res) => {
    const booking = await paymentReminderService.findBooking(req.params.bookingId);

    if (!booking) {
        const error = new Error("Booking not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
    }

    booking.cashPaymentConfirmed = true;
    booking.cashPaymentConfirmedAt = new Date();
    booking.confirmPaymentMethod = "cash";
    await paymentReminderService.saveBooking(booking);

    await paymentReminderService.createNotification({
        userId: booking.hostId,
        type: "payment_reminder",
        bookingId: booking._id,
        title: "Guest Will Pay Cash at Check-in",
        message: `Guest has confirmed they will pay the remaining ${booking.remainingAmount.toLocaleString('vi-VN')} VND in cash at check-in.`,
        isRead: false,
    });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Cash payment confirmed. Please pay the remaining amount at check-in.",
        booking,
    });
};

const payVnpay = async (req, res) => {
    const booking = await paymentReminderService.findBookingPopulated(req.params.bookingId);

    if (!booking) {
        const error = new Error("Booking not found");
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
    }

    if (booking.remainingAmount <= 0) {
        const error = new Error("No remaining amount to pay");
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
    }

    const orderInfo = `Remaining payment - Booking ${booking._id.toString().slice(-8)}`;
    const paymentUrl = vnpayService.createPaymentUrl({
        amount: booking.remainingAmount,
        orderId: `REMAINING_${booking._id}_${Date.now()}`,
        orderInfo,
        ipAddr: req.body.ipAddr || req.ip,
        returnUrl: `${process.env.API_BASE_URL || 'http://localhost:3001'}/payment-reminder/vnpay-callback`,
    });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        paymentUrl,
        amount: booking.remainingAmount,
        bookingId: booking._id,
    });
};

module.exports = {
    vnpayCallback,
    getBookingDetails,
    confirmCash,
    payVnpay
};
