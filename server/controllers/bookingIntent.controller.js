const bookingIntentService = require("../services/bookingIntent.service");

const releaseExpiredLocks = async (req, res) => {
    const releasedCount = await bookingIntentService.releaseExpiredLocks();
    res.status(200).json({
        success: true,
        message: `Released ${releasedCount} expired locks`,
        releasedCount,
    });
};

const createIntent = async (req, res) => {
    const result = await bookingIntentService.createBookingIntent(req.body);
    if (result.isExisting) {
        return res.status(200).json({
            success: true,
            message: "You already have an active reservation for this listing",
            bookingIntent: result.bookingIntent,
            isExisting: true,
        });
    }
    
    res.status(201).json({
        success: true,
        message: "Booking intent created successfully",
        bookingIntent: result.bookingIntent,
        expiresIn: result.expiresIn,
    });
};

const checkAvailability = async (req, res) => {
    const {listingId} = req.params;
    const {startDate, endDate, userId} = req.query;
    
    const result = await bookingIntentService.checkAvailability(listingId, startDate, endDate, userId);
    res.status(200).json({
        success: true,
        ...result
    });
};

const getByTempOrderId = async (req, res) => {
    const bookingIntent = await bookingIntentService.getByTempOrderId(req.params.tempOrderId);
    res.status(200).json({ success: true, bookingIntent });
};

const getById = async (req, res) => {
    const bookingIntent = await bookingIntentService.getById(req.params.intentId);
    res.status(200).json({ success: true, bookingIntent });
};

const cancelIntent = async (req, res) => {
    const {userId, reason} = req.body;
    const bookingIntent = await bookingIntentService.cancelIntent(req.params.intentId, userId, reason);
    res.status(200).json({
        success: true,
        message: "Booking intent cancelled successfully",
        bookingIntent,
    });
};

const confirmIntent = async (req, res) => {
    const {transactionId} = req.body;
    const result = await bookingIntentService.confirmIntent(req.params.intentId, transactionId);
    res.status(200).json({
        success: true,
        message: "Booking confirmed successfully",
        booking: result.booking,
        bookingIntent: result.bookingIntent,
    });
};

const getActiveUserIntents = async (req, res) => {
    const bookingIntents = await bookingIntentService.getActiveUserIntents(req.params.userId);
    res.status(200).json({ success: true, bookingIntents });
};

module.exports = {
  releaseExpiredLocks,
  createIntent,
  checkAvailability,
  getByTempOrderId,
  getById,
  cancelIntent,
  confirmIntent,
  getActiveUserIntents
};
