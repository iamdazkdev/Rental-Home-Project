const {
    checkListingAvailability,
    createBookingIntent,
    getBookingIntent,
    getBookingIntentByTempOrderId,
    confirmPaymentAndCreateBooking,
    cancelBookingIntent,
    getUserActiveIntent,
    extendIntentLock,
} = require("../services/concurrentBooking.service");

const checkAvailability = async (req, res) => {
    const { listingId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: "startDate and endDate are required" });
    }

    const availability = await checkListingAvailability(listingId, startDate, endDate);
    res.json({
        success: true,
        available: availability.available,
        reason: availability.reason,
        message: availability.available
            ? "Listing is available for the selected dates"
            : availability.reason === "LISTING_ALREADY_BOOKED"
              ? "This listing is already booked for the selected dates"
              : "This listing is currently being reserved by another user",
    });
};

const createIntent = async (req, res) => {
    const {
        customerId, hostId, listingId, startDate, endDate, totalPrice,
        paymentMethod, paymentType, paymentAmount, depositPercentage,
        depositAmount, remainingAmount, bookingType, lockDurationMinutes,
    } = req.body;

    if (!customerId || !hostId || !listingId || !startDate || !endDate || !totalPrice) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const existingIntent = await getUserActiveIntent(customerId, listingId);
    if (existingIntent) {
        return res.json({
            success: true,
            message: "You already have an active reservation for this listing",
            intent: existingIntent,
            intentId: existingIntent.intentId,
            tempOrderId: existingIntent.tempOrderId,
            expiresAt: existingIntent.expiresAt,
            isExisting: true,
        });
    }

    const result = await createBookingIntent(
        {
            customerId, hostId, listingId, startDate, endDate, totalPrice,
            paymentMethod: paymentMethod || "vnpay",
            paymentType: paymentType || "full",
            paymentAmount: paymentAmount || totalPrice,
            depositPercentage: depositPercentage || 0,
            depositAmount: depositAmount || 0,
            remainingAmount: remainingAmount || 0,
            bookingType: bookingType || "entire_place",
        },
        lockDurationMinutes
    );

    if (!result.success) return res.status(409).json(result);
    res.status(201).json(result);
};

const getIntent = async (req, res) => {
    const intent = await getBookingIntent(req.params.intentId);
    if (!intent) return res.status(404).json({ success: false, message: "Booking intent not found" });
    res.json({ success: true, intent });
};

const getIntentByTempOrderId = async (req, res) => {
    const intent = await getBookingIntentByTempOrderId(req.params.tempOrderId);
    if (!intent) return res.status(404).json({ success: false, message: "Booking intent not found" });
    res.json({ success: true, intent });
};

const confirmIntent = async (req, res) => {
    const result = await confirmPaymentAndCreateBooking(req.params.intentId, req.body.transactionId);
    if (!result.success) {
        const statusCode = result.error === "INTENT_NOT_FOUND" ? 404 : 400;
        return res.status(statusCode).json(result);
    }
    res.json({ success: true, message: "Booking confirmed successfully", booking: result.booking, intent: result.intent });
};

const cancelIntent = async (req, res) => {
    const result = await cancelBookingIntent(req.params.intentId, req.body.reason);
    if (!result.success) return res.status(400).json(result);
    res.json({ success: true, message: "Booking intent cancelled successfully", intent: result.intent });
};

const extendLock = async (req, res) => {
    const result = await extendIntentLock(req.params.intentId, req.body.additionalMinutes || 5);
    if (!result.success) return res.status(400).json(result);
    res.json({ success: true, message: "Lock extended successfully", newExpiresAt: result.newExpiresAt, intent: result.intent });
};

const getActiveIntent = async (req, res) => {
    const { customerId, listingId } = req.params;
    const intent = await getUserActiveIntent(customerId, listingId);
    res.json({ success: true, hasActiveIntent: intent !== null, intent });
};

module.exports = {
    checkAvailability,
    createIntent,
    getIntent,
    getIntentByTempOrderId,
    confirmIntent,
    cancelIntent,
    extendLock,
    getActiveIntent,
};
