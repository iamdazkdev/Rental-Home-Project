const Booking = require("../models/Booking");
const PaymentHistory = require("../models/PaymentHistory");
const PendingBooking = require("../models/PendingBooking");

/**
 * Create a booking from a successful VNPay payment.
 * Extracted from duplicate logic in vnpay-return and vnpay-ipn handlers.
 *
 * @param {Object} pendingBooking - The PendingBooking document
 * @param {Object} vnpayData - VNPay transaction data
 * @param {string} vnpayData.transactionNo - VNPay transaction number
 * @param {Object} [vnpayData.vnpParams] - Raw VNPay response params (for payment history)
 * @returns {Promise<{booking: Object, paymentStatus: string, bookingStatus: string}>}
 */
const createBookingFromPayment = async (pendingBooking, vnpayData) => {
    const { transactionNo, vnpParams = {} } = vnpayData;

    // 1. Determine payment method (map vnpay_full/vnpay_deposit to vnpay)
    let paymentMethod = "vnpay";
    if (pendingBooking.paymentMethod === "cash") {
        paymentMethod = "cash";
    }

    // 2. Determine payment status
    let paymentStatus = "paid";
    if (pendingBooking.paymentMethod === "vnpay_deposit") {
        paymentStatus = "partially_paid";
    }

    // 3. Determine payment type and remaining amount
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

    // 4. Determine booking status
    // Full VNPay payment → auto-approve (no host approval needed)
    let bookingStatus = "pending";
    let legacyStatus = "pending";
    let approvedAt = null;

    if (paymentType === "full" && paymentMethod === "vnpay") {
        bookingStatus = "approved";
        legacyStatus = "accepted";
        approvedAt = new Date();
        console.log(`🎉 Auto-approving booking (Full payment via VNPay)`);
    }

    // 5. Create payment history entry
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

    // 6. Create the actual booking
    const newBooking = new Booking({
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
        paymentIntentId: transactionNo,
        paidAt: new Date(),
        paymentHistory: [paymentHistoryEntry],
        remainingAmount,
        remainingDueDate,
    });

    const savedBooking = await newBooking.save();
    console.log(`✅ Booking ${savedBooking._id} created | payment: ${paymentStatus} | status: ${bookingStatus}`);

    // 7. Save to standalone PaymentHistory collection (non-critical)
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
                vnp_TransactionNo: vnpParams.vnp_TransactionNo,
                vnp_BankCode: vnpParams.vnp_BankCode,
                vnp_CardType: vnpParams.vnp_CardType,
                vnp_OrderInfo: vnpParams.vnp_OrderInfo,
                vnp_PayDate: vnpParams.vnp_PayDate,
            },
        });
        await paymentHistoryDoc.save();
        console.log(`✅ Payment history saved: ${paymentHistoryDoc._id}`);
    } catch (historyError) {
        console.error("⚠️ Failed to save PaymentHistory (non-critical):", historyError.message);
    }

    // 8. Mark pending booking as converted
    await PendingBooking.findByIdAndUpdate(pendingBooking._id, {
        status: "converted",
    });

    return { booking: savedBooking, paymentStatus, bookingStatus };
};

module.exports = createBookingFromPayment;
