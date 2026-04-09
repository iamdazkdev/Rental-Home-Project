const BookingIntent = require("../models/BookingIntent");
const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const {v4: uuidv4} = require("uuid");
const {BOOKING_INTENT_TIMEOUT_MINUTES} = require("../config/bookingIntentConfig");

const LOCK_TIMEOUT_MINUTES = BOOKING_INTENT_TIMEOUT_MINUTES;

const releaseExpiredLocks = async () => {
    return await BookingIntent.releaseExpiredLocks();
};

const createBookingIntent = async (data) => {
    const { customerId, hostId, listingId, bookingType, startDate, endDate, totalPrice } = data;
    const { paymentMethod, paymentType, paymentAmount, depositPercentage, depositAmount, remainingAmount } = data;

    const listing = await Listing.findById(listingId);
    if (!listing) {
        const error = new Error("Listing not found");
        error.statusCode = 404;
        throw error;
    }

    const existingBooking = await Booking.findOne({
        listingId: listingId,
        bookingStatus: {$in: ["pending", "approved", "checked_in"]},
        $or: [
            {startDate: {$lte: endDate}, endDate: {$gte: startDate}}
        ]
    });

    if (existingBooking) {
        const error = new Error("This listing is already booked for the selected dates");
        error.statusCode = 409;
        error.conflictType = "existing_booking";
        throw error;
    }

    const existingLock = await BookingIntent.getActiveLock(listingId, startDate, endDate);

    if (existingLock && existingLock.customerId.toString() !== customerId) {
        const remainingSeconds = Math.ceil((existingLock.expiresAt - new Date()) / 1000);
        const error = new Error("This listing is currently being reserved by another user");
        error.statusCode = 409;
        error.conflictType = "locked_by_other";
        error.retryAfterSeconds = remainingSeconds;
        throw error;
    }

    if (existingLock && existingLock.customerId.toString() === customerId) {
        return { bookingIntent: existingLock, isExisting: true };
    }

    const intentId = `INTENT_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const tempOrderId = `TEMP_${Date.now()}_${uuidv4().slice(0, 10)}`;
    const expiresAt = new Date(Date.now() + LOCK_TIMEOUT_MINUTES * 60 * 1000);

    const bookingIntent = new BookingIntent({
        intentId,
        tempOrderId,
        customerId,
        hostId,
        listingId,
        bookingType: bookingType || "entire_place",
        startDate,
        endDate,
        totalPrice,
        status: "locked",
        paymentMethod: paymentMethod || "vnpay",
        paymentType: paymentType || "full",
        paymentAmount: paymentAmount || totalPrice,
        depositPercentage: depositPercentage || 0,
        depositAmount: depositAmount || 0,
        remainingAmount: remainingAmount || 0,
        lockedAt: new Date(),
        expiresAt,
    });

    await bookingIntent.save();
    return { bookingIntent, isExisting: false, expiresIn: LOCK_TIMEOUT_MINUTES * 60 };
};

const checkAvailability = async (listingId, startDate, endDate, userId) => {
    const existingBooking = await Booking.findOne({
        listingId: listingId,
        bookingStatus: {$in: ["pending", "approved", "checked_in"]},
        $or: [
            {startDate: {$lte: endDate}, endDate: {$gte: startDate}}
        ]
    });

    if (existingBooking) {
        return { available: false, reason: "already_booked", message: "This listing is already booked for the selected dates" };
    }

    const activeLock = await BookingIntent.getActiveLock(listingId, startDate, endDate);

    if (activeLock) {
        const isOwnLock = userId && activeLock.customerId.toString() === userId;
        const remainingSeconds = Math.ceil((activeLock.expiresAt - new Date()) / 1000);

        return {
            available: isOwnLock, // Available if it's user's own lock
            reason: isOwnLock ? "own_lock" : "locked_by_other",
            message: isOwnLock
                ? "You have an active reservation for this listing"
                : "This listing is currently being reserved by another user",
            retryAfterSeconds: isOwnLock ? null : remainingSeconds,
            bookingIntent: isOwnLock ? activeLock : null,
        };
    }

    return { available: true, message: "Listing is available for booking" };
};

const getByTempOrderId = async (tempOrderId) => {
    const bookingIntent = await BookingIntent.findOne({tempOrderId})
        .populate("customerId", "firstName lastName email")
        .populate("listingId", "title");

    if (!bookingIntent) {
        const error = new Error("Booking intent not found");
        error.statusCode = 404;
        throw error;
    }
    return bookingIntent;
};

const getById = async (intentId) => {
    const bookingIntent = await BookingIntent.findOne({intentId})
            .populate("customerId", "firstName lastName email profileImagePath")
            .populate("hostId", "firstName lastName email profileImagePath")
            .populate("listingId", "title listingPhotoPaths price");

    if (!bookingIntent) {
        const error = new Error("Booking intent not found");
        error.statusCode = 404;
        throw error;
    }

    if (bookingIntent.status === "locked" && bookingIntent.expiresAt < new Date()) {
        bookingIntent.status = "expired";
        bookingIntent.failureReason = "Lock expired";
        await bookingIntent.save();
    }
    return bookingIntent;
};

const cancelIntent = async (intentId, userId, reason) => {
    const bookingIntent = await BookingIntent.findOne({intentId});

    if (!bookingIntent) {
        const error = new Error("Booking intent not found");
        error.statusCode = 404;
        throw error;
    }

    if (bookingIntent.customerId.toString() !== userId) {
        const error = new Error("You are not authorized to cancel this booking intent");
        error.statusCode = 403;
        throw error;
    }

    if (bookingIntent.status !== "locked") {
        const error = new Error(`Cannot cancel booking intent with status: ${bookingIntent.status}`);
        error.statusCode = 400;
        throw error;
    }

    await bookingIntent.cancel(reason || "User cancelled");
    return bookingIntent;
};

const confirmIntent = async (intentId, transactionId) => {
    const bookingIntent = await BookingIntent.findOne({intentId});

    if (!bookingIntent) {
        const error = new Error("Booking intent not found");
        error.statusCode = 404;
        throw error;
    }

    if (bookingIntent.status !== "locked") {
        const error = new Error(`Cannot confirm booking intent with status: ${bookingIntent.status}`);
        error.statusCode = 400;
        throw error;
    }

    if (bookingIntent.expiresAt < new Date()) {
        await bookingIntent.fail("Lock expired before payment confirmation");
        const error = new Error("Booking lock has expired. Please start the booking process again.");
        error.statusCode = 400;
        throw error;
    }

    const booking = new Booking({
        customerId: bookingIntent.customerId,
        hostId: bookingIntent.hostId,
        listingId: bookingIntent.listingId,
        startDate: bookingIntent.startDate,
        endDate: bookingIntent.endDate,
        totalPrice: bookingIntent.totalPrice,
        finalTotalPrice: bookingIntent.totalPrice,
        bookingStatus: bookingIntent.paymentType === "full" ? "approved" : "pending",
        paymentStatus: bookingIntent.paymentType === "cash" ? "unpaid" :
            bookingIntent.paymentType === "deposit" ? "partially_paid" : "paid",
        paymentMethod: bookingIntent.paymentMethod,
        paymentType: bookingIntent.paymentType,
        depositPercentage: bookingIntent.depositPercentage,
        depositAmount: bookingIntent.depositAmount,
        remainingAmount: bookingIntent.remainingAmount,
        paidAmount: bookingIntent.paymentType === "cash" ? 0 : bookingIntent.paymentAmount,
        transactionId: transactionId || null,
        paidAt: bookingIntent.paymentType !== "cash" ? new Date() : null,
        approvedAt: bookingIntent.paymentType === "full" ? new Date() : null,
        paymentHistory: bookingIntent.paymentType !== "cash" ? [{
            amount: bookingIntent.paymentAmount,
            method: bookingIntent.paymentMethod,
            status: "paid",
            transactionId: transactionId,
            type: bookingIntent.paymentType,
            paidAt: new Date(),
            notes: bookingIntent.paymentType === "full"
                ? "Full payment via VNPay"
                : `Deposit payment (${bookingIntent.depositPercentage}%) via VNPay`,
        }] : [],
    });

    await booking.save();
    await bookingIntent.confirmPayment(transactionId, booking._id);

    return { booking, bookingIntent };
};

const getActiveUserIntents = async (userId) => {
    return await BookingIntent.find({
        customerId: userId,
        status: "locked",
        expiresAt: {$gt: new Date()},
    })
    .populate("listingId", "title listingPhotoPaths price")
    .sort({createdAt: -1});
};

module.exports = {
  releaseExpiredLocks,
  createBookingIntent,
  checkAvailability,
  getByTempOrderId,
  getById,
  cancelIntent,
  confirmIntent,
  getActiveUserIntents
};
