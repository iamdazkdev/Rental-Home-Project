const Booking = require("../models/Booking");
const PaymentHistory = require("../models/PaymentHistory");
const User = require("../models/User");
const Listing = require("../models/Listing");
const { HTTP_STATUS } = require("../constants");
const createNotification = require("../utils/createNotification");

// Helper
const calculateExtensionPrice = (listingPrice, additionalDays) => {
    const extensionRate = listingPrice * 1.3; // 30% surcharge
    return extensionRate * additionalDays;
};

// ============================================
// CREATE BOOKING
// ============================================
const createBooking = async (req, res) => {
    try {
        const { customerId, hostId, listingId, startDate, endDate, totalPrice } = req.body;

        if (!customerId || !hostId || !listingId || !startDate || !endDate || !totalPrice) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Missing required fields" });
        }

        const existingBooking = await Booking.findOne({
            customerId, listingId,
            bookingStatus: { $in: ["pending", "approved", "checked_in"] },
            isCheckedOut: false,
        });

        if (existingBooking) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false, message: "You already have an active booking for this listing", existingBooking,
            });
        }

        const listing = await Listing.findById(listingId);
        const customer = await User.findById(customerId);
        const paymentMethod = req.body.paymentMethod || "cash";
        const paymentType = paymentMethod === "cash" ? "cash" : "full";

        const newBooking = new Booking({
            customerId, hostId, listingId, startDate, endDate, totalPrice,
            bookingStatus: "pending",
            finalEndDate: endDate,
            finalTotalPrice: totalPrice,
            paymentMethod, paymentType,
            paymentStatus: "unpaid",
            remainingAmount: totalPrice,
            remainingDueDate: new Date(startDate),
            paymentHistory: [],
        });

        const savedBooking = await newBooking.save();

        await createNotification({
            userId: hostId,
            type: "booking_request",
            bookingId: savedBooking._id,
            message: `${customer.firstName} ${customer.lastName} has requested to book "${listing.title}" from ${startDate} to ${endDate}`,
            link: `/reservations`,
        });

        res.status(HTTP_STATUS.OK).json(savedBooking);
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to create booking", error: error.message });
    }
};

// ============================================
// GET HOST RESERVATIONS
// ============================================
const getHostReservations = async (req, res) => {
    try {
        const { hostId } = req.params;
        const reservations = await Booking.find({ hostId })
            .populate("customerId", "firstName lastName email profileImagePath")
            .populate("listingId", "title listingPhotoPaths city province country price")
            .sort({ createdAt: -1 });

        res.status(HTTP_STATUS.OK).json(reservations);
    } catch (error) {
        console.error("Error fetching host reservations:", error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to fetch reservations", error: error.message });
    }
};

// ============================================
// ACCEPT BOOKING
// ============================================
const acceptBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId)
            .populate("customerId", "firstName lastName")
            .populate("listingId", "title");

        if (!booking) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Booking not found" });
        if (booking.bookingStatus !== "pending") {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: `Cannot accept booking with status: ${booking.bookingStatus}` });
        }

        booking.bookingStatus = "approved";
        booking.approvedAt = new Date();
        await booking.save();

        await createNotification({
            userId: booking.customerId._id,
            type: "booking_accepted",
            bookingId: booking._id,
            message: `Your booking request for "${booking.listingId.title}" has been accepted! 🎉`,
            link: `/${booking.customerId._id}/trips`,
        });

        res.status(HTTP_STATUS.OK).json({ success: true, message: "Booking accepted successfully", booking });
    } catch (error) {
        console.error("Error accepting booking:", error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to accept booking", error: error.message });
    }
};

// ============================================
// REJECT BOOKING
// ============================================
const rejectBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { reason } = req.body;
        const booking = await Booking.findById(bookingId)
            .populate("customerId", "firstName lastName")
            .populate("listingId", "title");

        if (!booking) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Booking not found" });
        if (booking.bookingStatus !== "pending") {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: `Cannot reject booking with status: ${booking.bookingStatus}` });
        }

        booking.bookingStatus = "rejected";
        booking.rejectionReason = reason || "No reason provided";
        await booking.save();

        await createNotification({
            userId: booking.customerId._id,
            type: "booking_rejected",
            bookingId: booking._id,
            message: `Your booking request for "${booking.listingId.title}" has been rejected. Reason: ${booking.rejectionReason}`,
            link: `/${booking.customerId._id}/trips`,
        });

        res.status(HTTP_STATUS.OK).json({ success: true, message: "Booking rejected successfully", booking });
    } catch (error) {
        console.error("Error rejecting booking:", error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to reject booking", error: error.message });
    }
};

// ============================================
// CHECKOUT BOOKING
// ============================================
const checkoutBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId)
            .populate("customerId", "firstName lastName")
            .populate("listingId", "title");

        if (!booking) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Booking not found" });
        if (booking.bookingStatus !== "approved" && booking.bookingStatus !== "checked_in") {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: `Cannot checkout booking with status: ${booking.bookingStatus}` });
        }

        booking.bookingStatus = "checked_out";
        booking.isCheckedOut = true;
        booking.checkedOutAt = new Date();
        booking.checkOutAt = new Date();
        await booking.save();

        await createNotification({
            userId: booking.customerId._id,
            type: "booking_checked_out",
            bookingId: booking._id,
            message: `You have successfully checked out from "${booking.listingId.title}". Please leave a review!`,
            link: `/${booking.customerId._id}/trips`,
        });

        res.status(HTTP_STATUS.OK).json({ success: true, message: "Checkout successful", booking });
    } catch (error) {
        console.error("Error checking out:", error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to checkout", error: error.message });
    }
};

// ============================================
// REQUEST EXTENSION
// ============================================
const requestExtension = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { additionalDays } = req.body;

        if (!additionalDays || additionalDays < 1) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Additional days must be at least 1" });
        }

        const booking = await Booking.findById(bookingId).populate("listingId", "price");
        if (!booking) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Booking not found" });

        if (booking.bookingStatus !== "approved" && booking.bookingStatus !== "checked_in") {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: `Cannot request extension for booking with status: ${booking.bookingStatus}` });
        }

        const additionalPrice = calculateExtensionPrice(booking.listingId.price, additionalDays);
        const currentEndDate = new Date(booking.finalEndDate || booking.endDate);
        const newEndDate = new Date(currentEndDate);
        newEndDate.setDate(newEndDate.getDate() + additionalDays);

        const extensionRequest = {
            requestedEndDate: newEndDate.toISOString().split("T")[0],
            additionalDays,
            additionalPrice,
            status: "pending",
        };

        booking.extensionRequests.push(extensionRequest);
        await booking.save();

        const customer = await User.findById(booking.customerId);
        await createNotification({
            userId: booking.hostId,
            type: "extension_request",
            bookingId: booking._id,
            message: `${customer.firstName} ${customer.lastName} has requested to extend their stay by ${additionalDays} days (+$${additionalPrice})`,
            link: `/reservations`,
        });

        res.status(HTTP_STATUS.OK).json({ success: true, message: "Extension request submitted successfully", extensionRequest });
    } catch (error) {
        console.error("Error requesting extension:", error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to request extension", error: error.message });
    }
};

// ============================================
// APPROVE EXTENSION
// ============================================
const approveExtension = async (req, res) => {
    try {
        const { bookingId, extensionIndex } = req.params;
        const booking = await Booking.findById(bookingId)
            .populate("customerId", "firstName lastName")
            .populate("listingId", "title");

        if (!booking) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Booking not found" });

        const extension = booking.extensionRequests[extensionIndex];
        if (!extension) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Extension request not found" });
        if (extension.status !== "pending") return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: `Extension request is already ${extension.status}` });

        extension.status = "approved";
        extension.approvedAt = new Date();
        booking.finalEndDate = extension.requestedEndDate;
        booking.finalTotalPrice = (booking.finalTotalPrice || booking.totalPrice) + extension.additionalPrice;
        await booking.save();

        await createNotification({
            userId: booking.customerId._id,
            type: "extension_approved",
            bookingId: booking._id,
            message: `Your extension request for "${booking.listingId.title}" has been approved! New checkout: ${extension.requestedEndDate}`,
            link: `/${booking.customerId._id}/trips`,
        });

        res.status(HTTP_STATUS.OK).json({ success: true, message: "Extension approved successfully", booking });
    } catch (error) {
        console.error("Error approving extension:", error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to approve extension", error: error.message });
    }
};

// ============================================
// REJECT EXTENSION
// ============================================
const rejectExtension = async (req, res) => {
    try {
        const { bookingId, extensionIndex } = req.params;
        const { reason } = req.body;
        const booking = await Booking.findById(bookingId)
            .populate("customerId", "firstName lastName")
            .populate("listingId", "title");

        if (!booking) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Booking not found" });

        const extension = booking.extensionRequests[extensionIndex];
        if (!extension) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Extension request not found" });
        if (extension.status !== "pending") return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: `Extension request is already ${extension.status}` });

        extension.status = "rejected";
        extension.rejectedAt = new Date();
        extension.rejectionReason = reason || "No reason provided";
        await booking.save();

        await createNotification({
            userId: booking.customerId._id,
            type: "extension_rejected",
            bookingId: booking._id,
            message: `Your extension request for "${booking.listingId.title}" has been rejected. Reason: ${extension.rejectionReason}`,
            link: `/${booking.customerId._id}/trips`,
        });

        res.status(HTTP_STATUS.OK).json({ success: true, message: "Extension rejected successfully", booking });
    } catch (error) {
        console.error("Error rejecting extension:", error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to reject extension", error: error.message });
    }
};

// ============================================
// CANCEL BOOKING
// ============================================
const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { customerId } = req.body;

        const booking = await Booking.findById(bookingId)
            .populate("customerId", "firstName lastName")
            .populate("hostId", "firstName lastName")
            .populate("listingId", "title");

        if (!booking) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Booking not found" });
        if (booking.customerId._id.toString() !== customerId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: "You are not authorized to cancel this booking" });
        }
        if (booking.bookingStatus !== "pending") {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: `Cannot cancel booking with status: ${booking.bookingStatus}` });
        }

        booking.bookingStatus = "cancelled";
        await booking.save();

        await createNotification({
            userId: booking.hostId._id,
            type: "booking_cancelled",
            bookingId: booking._id,
            message: `${booking.customerId.firstName} ${booking.customerId.lastName} has cancelled their booking request for "${booking.listingId.title}"`,
            link: `/reservations`,
        });

        res.status(HTTP_STATUS.OK).json({ success: true, message: "Booking cancelled successfully", booking });
    } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to cancel booking", error: error.message });
    }
};

// ============================================
// GET BOOKING BY ID
// ============================================
const getBookingById = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId)
            .populate("customerId", "firstName lastName email profileImagePath")
            .populate("hostId", "firstName lastName email")
            .populate("listingId");

        if (!booking) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Booking not found" });
        res.status(HTTP_STATUS.OK).json(booking);
    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to fetch booking", error: error.message });
    }
};

// ============================================
// RECORD REMAINING PAYMENT
// ============================================
const recordPayment = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { amount, method, notes } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Booking not found" });
        if (!amount || amount <= 0) return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Invalid payment amount" });

        const paymentEntry = {
            amount,
            method: method || "cash",
            status: "paid",
            transactionId: `MANUAL_${Date.now()}`,
            type: "remaining",
            paidAt: new Date(),
            notes: notes || "Remaining payment received at check-in",
        };

        booking.paymentHistory.push(paymentEntry);
        const newRemainingAmount = Math.max(0, booking.remainingAmount - amount);
        booking.remainingAmount = newRemainingAmount;
        if (newRemainingAmount === 0) booking.paymentStatus = "paid";
        await booking.save();

        // Dual-write to standalone PaymentHistory collection
        try {
            const paymentHistoryDoc = new PaymentHistory({
                bookingId: booking._id,
                customerId: booking.customerId,
                hostId: booking.hostId,
                listingId: booking.listingId,
                amount,
                method: method || "cash",
                status: "paid",
                transactionId: paymentEntry.transactionId,
                type: "remaining",
                paidAt: new Date(),
                notes: notes || "Remaining payment received at check-in",
                recordedBy: booking.hostId,
            });
            await paymentHistoryDoc.save();
        } catch (historyError) {
            console.error("Failed to save to PaymentHistory collection (non-critical):", historyError);
        }

        res.status(HTTP_STATUS.OK).json({ success: true, message: "Payment recorded successfully", booking });
    } catch (error) {
        console.error("Error recording payment:", error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to record payment", error: error.message });
    }
};

module.exports = {
    createBooking,
    getHostReservations,
    acceptBooking,
    rejectBooking,
    checkoutBooking,
    requestExtension,
    approveExtension,
    rejectExtension,
    cancelBooking,
    getBookingById,
    recordPayment,
};
