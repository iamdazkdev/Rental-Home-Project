const paymentService = require("../services/payment.service");
const vnpayService = require("../services/vnpay.service");
const { HTTP_STATUS } = require("../constants");

const createPaymentUrl = async (req, res) => {
    const { tempOrderId: providedTempOrderId, bookingData, amount, orderInfo, ipAddr, returnUrl } = req.body;

    if (providedTempOrderId) {
        const paymentParams = {
            orderId: providedTempOrderId,
            amount: amount,
            orderInfo: orderInfo || `Payment - ${providedTempOrderId}`,
            orderType: 'billpayment',
            locale: 'vn',
            ipAddr: ipAddr || req.ip || '127.0.0.1',
            bankCode: '',
            returnUrl: returnUrl,
        };

        const paymentUrl = vnpayService.createPaymentUrl(paymentParams);
        return res.status(HTTP_STATUS.OK).json({ paymentUrl, tempOrderId: providedTempOrderId, amount });
    }

    const tempOrderId = `TEMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await paymentService.savePendingBooking({
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

    const isDeposit = bookingData.paymentMethod === 'vnpay_deposit';
    const finalOrderInfo = isDeposit
        ? `Dat coc ${bookingData.depositPercentage}% - Booking ${tempOrderId}`
        : `Thanh toan dat phong - Booking ${tempOrderId}`;

    const paymentParams = {
        orderId: tempOrderId,
        amount,
        orderInfo: finalOrderInfo,
        orderType: 'billpayment',
        locale: 'vn',
        ipAddr: ipAddr || req.ip || '127.0.0.1',
        bankCode: '',
        returnUrl: returnUrl,
    };

    const paymentUrl = vnpayService.createPaymentUrl(paymentParams);

    res.status(HTTP_STATUS.OK).json({ paymentUrl, tempOrderId, amount });
};

const vnpayReturn = async (req, res) => {
    const vnp_Params = req.query;
    const tempOrderId = vnp_Params.vnp_TxnRef || vnp_Params.orderId;

    if (!tempOrderId) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/result?status=error&message=Missing order ID`);
    }

    const pendingBooking = await paymentService.findPendingBooking({ tempOrderId, status: "pending_payment" });

    if (!pendingBooking) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/result?status=error&message=Booking data not found or expired`);
    }

    const verifyResult = vnpayService.verifyReturnUrl(vnp_Params);
    const isPaymentSuccessful = verifyResult.isValid && vnpayService.isSuccessful(verifyResult.rspCode);

    if (isPaymentSuccessful) {
        let paymentMethod = pendingBooking.paymentMethod === "cash" ? "cash" : "vnpay";
        let paymentStatus = pendingBooking.paymentMethod === "vnpay_deposit" ? "partially_paid" : "paid";
        const transactionNo = vnp_Params.vnp_TransactionNo || `DEMO_${Date.now()}`;
        
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

        let bookingStatus = "pending";
        let legacyStatus = "pending";
        let approvedAt = null;

        if (paymentType === "full" && paymentMethod === "vnpay") {
            bookingStatus = "approved";
            legacyStatus = "accepted";
            approvedAt = new Date();
        }

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

        const savedBooking = await paymentService.createBooking({
            customerId: pendingBooking.customerId,
            hostId: pendingBooking.hostId,
            listingId: pendingBooking.listingId,
            startDate: pendingBooking.startDate,
            endDate: pendingBooking.endDate,
            totalPrice: pendingBooking.totalPrice,
            finalTotalPrice: pendingBooking.totalPrice,
            paymentMethod: paymentMethod,
            paymentType: paymentType,
            depositPercentage: pendingBooking.depositPercentage || 0,
            depositAmount: pendingBooking.depositAmount || 0,
            paymentStatus: paymentStatus,
            bookingStatus: bookingStatus,
            status: legacyStatus,
            approvedAt: approvedAt,
            paymentIntentId: transactionNo,
            paidAt: new Date(),
            paymentHistory: [paymentHistoryEntry],
            remainingAmount: remainingAmount,
            remainingDueDate: remainingDueDate,
        });

        try {
            await paymentService.savePaymentHistory({
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
                notes: paymentType === "deposit" ? `Deposit payment via VNPay` : "Full payment via VNPay",
                vnpayData: { vnp_TransactionNo: vnp_Params.vnp_TransactionNo }
            });
        } catch (e) {}

        await paymentService.updatePendingBooking(pendingBooking._id, { status: "converted" });

        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/result?status=success&bookingId=${savedBooking._id}&transactionNo=${transactionNo}&paymentStatus=${paymentStatus}`);
    } else {
        await paymentService.updatePendingBooking(pendingBooking._id, { status: "expired" });
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/result?status=failed&message=Payment failed or cancelled`);
    }
};

const vnpayIpn = async (req, res) => {
    const vnp_Params = req.query;
    const verifyResult = vnpayService.verifyIpn(vnp_Params);

    if (!verifyResult.isValid) {
        return res.status(HTTP_STATUS.OK).json({ RspCode: "97", Message: "Invalid Signature" });
    }

    const tempOrderId = verifyResult.orderId;
    const pendingBooking = await paymentService.findPendingBooking({ tempOrderId, status: "pending_payment" });

    if (!pendingBooking) {
        return res.status(HTTP_STATUS.OK).json({ RspCode: "01", Message: "Order not found" });
    }

    if (vnpayService.isSuccessful(verifyResult.rspCode)) {
        let paymentMethod = pendingBooking.paymentMethod === "cash" ? "cash" : "vnpay";
        let paymentStatus = pendingBooking.paymentMethod === "vnpay_deposit" ? "partially_paid" : "paid";
        
        let paymentType = "full";
        let remainingAmount = 0;

        if (pendingBooking.paymentMethod === "vnpay_deposit") {
            paymentType = "deposit";
            remainingAmount = pendingBooking.totalPrice - pendingBooking.depositAmount;
        } else if (pendingBooking.paymentMethod === "cash") {
            paymentType = "cash";
        }

        let bookingStatus = "pending";
        let legacyStatus = "pending";
        let approvedAt = null;

        if (paymentType === "full" && paymentMethod === "vnpay") {
            bookingStatus = "approved";
            legacyStatus = "accepted";
            approvedAt = new Date();
        }

        await paymentService.createBooking({
            customerId: pendingBooking.customerId,
            hostId: pendingBooking.hostId,
            listingId: pendingBooking.listingId,
            startDate: pendingBooking.startDate,
            endDate: pendingBooking.endDate,
            totalPrice: pendingBooking.totalPrice,
            finalTotalPrice: pendingBooking.totalPrice,
            paymentMethod,
            paymentType,
            depositPercentage: pendingBooking.depositPercentage || 0,
            depositAmount: pendingBooking.depositAmount || 0,
            paymentStatus,
            bookingStatus,
            status: legacyStatus,
            approvedAt,
            paymentIntentId: verifyResult.transactionNo,
            paidAt: new Date(),
            remainingAmount,
        });

        await paymentService.updatePendingBooking(pendingBooking._id, { status: "converted" });
        return res.status(HTTP_STATUS.OK).json({ RspCode: "00", Message: "Confirm Success" });
    } else {
        await paymentService.updatePendingBooking(pendingBooking._id, { status: "expired" });
        return res.status(HTTP_STATUS.OK).json({ RspCode: "00", Message: "Confirm Success" });
    }
};

const getStatus = async (req, res) => {
    const booking = await paymentService.findBookingById(req.params.bookingId, [
        { path: "listingId", select: "title" },
        { path: "customerId", select: "firstName lastName" }
    ]);

    if (!booking) {
        const error = new Error('Booking not found');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
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
};

const queryTransaction = async (req, res) => {
    const booking = await paymentService.findBookingById(req.body.orderId);
    if (!booking) {
        const error = new Error('Transaction not found');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
    }

    res.status(HTTP_STATUS.OK).json({
        orderId: booking._id,
        amount: booking.finalTotalPrice,
        paymentStatus: booking.paymentStatus,
        transactionNo: booking.paymentIntentId,
        paidAt: booking.paidAt,
    });
};

const cleanupExpired = async (req, res) => {
    const result = await paymentService.cleanupExpiredPendingBookings();
    res.status(HTTP_STATUS.OK).json({
        message: "Cleanup successful",
        deletedCount: result.deletedCount,
    });
};

const getPendingBooking = async (req, res) => {
    const pendingBooking = await paymentService.findPendingBooking({ tempOrderId: req.params.tempOrderId });
    
    if (!pendingBooking) {
        const error = new Error('Pending booking not found or expired');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
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
};

module.exports = {
    createPaymentUrl,
    vnpayReturn,
    vnpayIpn,
    getStatus,
    queryTransaction,
    cleanupExpired,
    getPendingBooking
};
