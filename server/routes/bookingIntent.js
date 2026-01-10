const router = require("express").Router();
const BookingIntent = require("../models/BookingIntent");
const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const {v4: uuidv4} = require("uuid");
const {BOOKING_INTENT_TIMEOUT_MINUTES, BOOKING_INTENT_TIMEOUT_MS} = require("../config/bookingIntentConfig");

// Lock timeout in minutes (from config - 30 minutes)
const LOCK_TIMEOUT_MINUTES = BOOKING_INTENT_TIMEOUT_MINUTES;

/**
 * Release expired locks (called by cron job)
 * POST /booking-intent/release-expired
 * NOTE: This route MUST be defined before any routes with :intentId param
 */
router.post("/release-expired", async (req, res) => {
    try {
        const releasedCount = await BookingIntent.releaseExpiredLocks();

        console.log(`🔓 Released ${releasedCount} expired booking intent locks`);

        res.status(200).json({
            success: true,
            message: `Released ${releasedCount} expired locks`,
            releasedCount,
        });
    } catch (error) {
        console.error("Error releasing expired locks:", error);
        res.status(500).json({
            success: false,
            message: "Failed to release expired locks",
            error: error.message,
        });
    }
});

/**
 * Create a booking intent (temporary lock)
 * POST /booking-intent/create
 */
router.post("/create", async (req, res) => {
    try {
        const {
            customerId,
            hostId,
            listingId,
            bookingType,
            startDate,
            endDate,
            totalPrice,
            paymentMethod,
            paymentType,
            paymentAmount,
            depositPercentage,
            depositAmount,
            remainingAmount,
        } = req.body;

        // Validate required fields
        if (!customerId || !hostId || !listingId || !startDate || !endDate || !totalPrice) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // Check if listing exists and is available
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "Listing not found",
            });
        }

        // Check for existing confirmed bookings on these dates
        const existingBooking = await Booking.findOne({
            listingId: listingId,
            bookingStatus: {$in: ["pending", "approved", "checked_in"]},
            $or: [
                {startDate: {$lte: endDate}, endDate: {$gte: startDate}}
            ]
        });

        if (existingBooking) {
            return res.status(409).json({
                success: false,
                message: "This listing is already booked for the selected dates",
                conflictType: "existing_booking",
            });
        }

        // Check for existing active lock by another user
        const existingLock = await BookingIntent.getActiveLock(listingId, startDate, endDate);

        if (existingLock && existingLock.customerId.toString() !== customerId) {
            // Another user has locked this listing
            const remainingSeconds = Math.ceil((existingLock.expiresAt - new Date()) / 1000);

            return res.status(409).json({
                success: false,
                message: "This listing is currently being reserved by another user",
                conflictType: "locked_by_other",
                retryAfterSeconds: remainingSeconds,
            });
        }

        // If user already has an active lock, return it
        if (existingLock && existingLock.customerId.toString() === customerId) {
            return res.status(200).json({
                success: true,
                message: "You already have an active reservation for this listing",
                bookingIntent: existingLock,
                isExisting: true,
            });
        }

        // Create new booking intent with lock
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

        console.log(`🔒 Created booking intent: ${intentId} for listing ${listingId}`);

        res.status(201).json({
            success: true,
            message: "Booking intent created successfully",
            bookingIntent,
            expiresIn: LOCK_TIMEOUT_MINUTES * 60, // seconds
        });
    } catch (error) {
        console.error("Error creating booking intent:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create booking intent",
            error: error.message,
        });
    }
});

/**
 * Check availability (is listing locked?)
 * GET /booking-intent/check-availability/:listingId
 */
router.get("/check-availability/:listingId", async (req, res) => {
    try {
        const {listingId} = req.params;
        const {startDate, endDate, userId} = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "Start date and end date are required",
            });
        }

        // Check for existing confirmed bookings
        const existingBooking = await Booking.findOne({
            listingId: listingId,
            bookingStatus: {$in: ["pending", "approved", "checked_in"]},
            $or: [
                {startDate: {$lte: endDate}, endDate: {$gte: startDate}}
            ]
        });

        if (existingBooking) {
            return res.status(200).json({
                success: true,
                available: false,
                reason: "already_booked",
                message: "This listing is already booked for the selected dates",
            });
        }

        // Check for active locks
        const activeLock = await BookingIntent.getActiveLock(listingId, startDate, endDate);

        if (activeLock) {
            const isOwnLock = userId && activeLock.customerId.toString() === userId;
            const remainingSeconds = Math.ceil((activeLock.expiresAt - new Date()) / 1000);

            return res.status(200).json({
                success: true,
                available: isOwnLock, // Available if it's user's own lock
                reason: isOwnLock ? "own_lock" : "locked_by_other",
                message: isOwnLock
                    ? "You have an active reservation for this listing"
                    : "This listing is currently being reserved by another user",
                retryAfterSeconds: isOwnLock ? null : remainingSeconds,
                bookingIntent: isOwnLock ? activeLock : null,
            });
        }

        res.status(200).json({
            success: true,
            available: true,
            message: "Listing is available for booking",
        });
    } catch (error) {
        console.error("Error checking availability:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check availability",
            error: error.message,
        });
    }
});

/**
 * Get booking intent by tempOrderId (for VNPay callback)
 * GET /booking-intent/temp/:tempOrderId
 * NOTE: This route MUST be defined before /:intentId
 */
router.get("/temp/:tempOrderId", async (req, res) => {
    try {
        const {tempOrderId} = req.params;

        const bookingIntent = await BookingIntent.findOne({tempOrderId})
            .populate("customerId", "firstName lastName email")
            .populate("listingId", "title");

        if (!bookingIntent) {
            return res.status(404).json({
                success: false,
                message: "Booking intent not found",
            });
        }

        res.status(200).json({
            success: true,
            bookingIntent,
        });
    } catch (error) {
        console.error("Error fetching booking intent by tempOrderId:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch booking intent",
            error: error.message,
        });
    }
});

/**
 * Get booking intent by ID
 * GET /booking-intent/:intentId
 */
router.get("/:intentId", async (req, res) => {
    try {
        const {intentId} = req.params;

        const bookingIntent = await BookingIntent.findOne({intentId})
            .populate("customerId", "firstName lastName email profileImagePath")
            .populate("hostId", "firstName lastName email profileImagePath")
            .populate("listingId", "title listingPhotoPaths price");

        if (!bookingIntent) {
            return res.status(404).json({
                success: false,
                message: "Booking intent not found",
            });
        }

        // Check if expired but not yet updated
        if (bookingIntent.status === "locked" && bookingIntent.expiresAt < new Date()) {
            bookingIntent.status = "expired";
            bookingIntent.failureReason = "Lock expired";
            await bookingIntent.save();
        }

        res.status(200).json({
            success: true,
            bookingIntent,
        });
    } catch (error) {
        console.error("Error fetching booking intent:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch booking intent",
            error: error.message,
        });
    }
});

/**
 * Cancel booking intent
 * PUT /booking-intent/:intentId/cancel
 */
router.put("/:intentId/cancel", async (req, res) => {
    try {
        const {intentId} = req.params;
        const {userId, reason} = req.body;

        const bookingIntent = await BookingIntent.findOne({intentId});

        if (!bookingIntent) {
            return res.status(404).json({
                success: false,
                message: "Booking intent not found",
            });
        }

        // Verify ownership
        if (bookingIntent.customerId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to cancel this booking intent",
            });
        }

        if (bookingIntent.status !== "locked") {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel booking intent with status: ${bookingIntent.status}`,
            });
        }

        await bookingIntent.cancel(reason || "User cancelled");

        console.log(`❌ Booking intent cancelled: ${intentId}`);

        res.status(200).json({
            success: true,
            message: "Booking intent cancelled successfully",
            bookingIntent,
        });
    } catch (error) {
        console.error("Error cancelling booking intent:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel booking intent",
            error: error.message,
        });
    }
});

/**
 * Confirm payment and create booking
 * PUT /booking-intent/:intentId/confirm
 */
router.put("/:intentId/confirm", async (req, res) => {
    try {
        const {intentId} = req.params;
        const {transactionId} = req.body;

        const bookingIntent = await BookingIntent.findOne({intentId});

        if (!bookingIntent) {
            return res.status(404).json({
                success: false,
                message: "Booking intent not found",
            });
        }

        if (bookingIntent.status !== "locked") {
            return res.status(400).json({
                success: false,
                message: `Cannot confirm booking intent with status: ${bookingIntent.status}`,
            });
        }

        // Check if lock has expired
        if (bookingIntent.expiresAt < new Date()) {
            await bookingIntent.fail("Lock expired before payment confirmation");
            return res.status(400).json({
                success: false,
                message: "Booking lock has expired. Please start the booking process again.",
            });
        }

        // Create the actual booking
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

        // Update booking intent
        await bookingIntent.confirmPayment(transactionId, booking._id);

        console.log(`✅ Booking created from intent: ${intentId} -> ${booking._id}`);

        res.status(200).json({
            success: true,
            message: "Booking confirmed successfully",
            booking,
            bookingIntent,
        });
    } catch (error) {
        console.error("Error confirming booking intent:", error);
        res.status(500).json({
            success: false,
            message: "Failed to confirm booking",
            error: error.message,
        });
    }
});


/**
 * Get user's active booking intents
 * GET /booking-intent/user/:userId/active
 */
router.get("/user/:userId/active", async (req, res) => {
    try {
        const {userId} = req.params;

        const activeIntents = await BookingIntent.find({
            customerId: userId,
            status: "locked",
            expiresAt: {$gt: new Date()},
        })
            .populate("listingId", "title listingPhotoPaths price")
            .sort({createdAt: -1});

        res.status(200).json({
            success: true,
            bookingIntents: activeIntents,
        });
    } catch (error) {
        console.error("Error fetching user's active intents:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch active booking intents",
            error: error.message,
        });
    }
});

module.exports = router;

