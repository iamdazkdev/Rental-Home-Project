const Notification = require("../models/Notification");
const { HTTP_STATUS } = require("../constants");

class NotificationService {
    // ── CRUD ─────────────────────────────────────────────────────────────────

    async getUserNotifications(userId, unreadOnly) {
        let query = { userId };
        if (unreadOnly === "true") query.isRead = false;

        const notifications = await Notification.find(query)
            .populate("bookingId")
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        return { notifications, unreadCount };
    }

    async markAsRead(notificationId) {
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            const error = new Error("Notification not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        notification.isRead = true;
        await notification.save();
        return notification;
    }

    async markAllAsRead(userId) {
        const result = await Notification.updateMany({ userId, isRead: false }, { isRead: true });
        return result.modifiedCount;
    }

    async deleteNotification(notificationId) {
        const notification = await Notification.findByIdAndDelete(notificationId);
        if (!notification) {
            const error = new Error("Notification not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        return notification;
    }

    // ── REAL-TIME HELPERS ────────────────────────────────────────────────────

    _emitNotification(userId, notification, io) {
        try {
            if (!io) return;
            const socketId = (io.onlineUsers || new Map()).get(userId.toString());
            if (socketId) {
                io.to(socketId).emit("new_notification", { notification, timestamp: new Date() });
            }
        } catch (error) {
            console.error("Error emitting notification:", error);
        }
    }

    // ── BOOKING EVENTS ───────────────────────────────────────────────────────

    async sendBookingRequest(booking, io = null) {
        try {
            await booking.populate([
                { path: "customerId", select: "firstName lastName email" },
                { path: "hostId", select: "firstName lastName email" },
                { path: "listingId", select: "title" },
            ]);
            const { hostId: host, customerId: guest, listingId: listing } = booking;
            const notification = await Notification.create({
                userId: host._id,
                type: "booking_request",
                title: "New Booking Request",
                message: `${guest.firstName} ${guest.lastName} wants to book "${listing.title}"`,
                link: `/booking/${booking._id}`,
                read: false,
                data: { bookingId: booking._id, guestId: guest._id, listingId: listing._id },
            });
            this._emitNotification(host._id, notification, io);
            return true;
        } catch (error) {
            console.error("Error sending booking request notification:", error);
            return false;
        }
    }

    async sendBookingApproved(booking) {
        try {
            await booking.populate([
                { path: "customerId", select: "firstName lastName email" },
                { path: "hostId", select: "firstName lastName email" },
                { path: "listingId", select: "title" },
            ]);
            const { customerId: guest, listingId: listing } = booking;
            await Notification.create({
                userId: guest._id,
                type: "booking_approved",
                title: "Booking Approved!",
                message: `Your booking for "${listing.title}" has been approved by the host`,
                link: `/booking/${booking._id}`,
                read: false,
                data: { bookingId: booking._id, listingId: listing._id },
            });
            return true;
        } catch (error) {
            console.error("Error sending booking approved notification:", error);
            return false;
        }
    }

    async sendBookingRejected(booking, reason) {
        try {
            await booking.populate([
                { path: "customerId", select: "firstName lastName email" },
                { path: "listingId", select: "title" },
            ]);
            const { customerId: guest, listingId: listing } = booking;
            await Notification.create({
                userId: guest._id,
                type: "booking_rejected",
                title: "Booking Request Declined",
                message: `Your booking for "${listing.title}" was declined.${reason ? ` Reason: ${reason}` : ""}`,
                link: `/booking/${booking._id}`,
                read: false,
                data: { bookingId: booking._id, listingId: listing._id, reason },
            });
            return true;
        } catch (error) {
            console.error("Error sending booking rejected notification:", error);
            return false;
        }
    }

    async sendBookingCancelled(booking) {
        try {
            await booking.populate([
                { path: "customerId", select: "firstName lastName email" },
                { path: "hostId", select: "firstName lastName email" },
                { path: "listingId", select: "title" },
            ]);
            const { hostId: host, customerId: guest, listingId: listing } = booking;
            await Notification.create({
                userId: host._id,
                type: "booking_cancelled",
                title: "Booking Cancelled",
                message: `${guest.firstName} ${guest.lastName} cancelled their booking for "${listing.title}"`,
                link: `/booking/${booking._id}`,
                read: false,
                data: { bookingId: booking._id, guestId: guest._id, listingId: listing._id },
            });
            return true;
        } catch (error) {
            console.error("Error sending booking cancelled notification:", error);
            return false;
        }
    }

    async sendGuestCheckedIn(booking) {
        try {
            await booking.populate([
                { path: "customerId", select: "firstName lastName email" },
                { path: "hostId", select: "firstName lastName email" },
                { path: "listingId", select: "title" },
            ]);
            const { hostId: host, customerId: guest, listingId: listing } = booking;
            await Notification.create({
                userId: host._id,
                type: "guest_checked_in",
                title: "Guest Checked In",
                message: `${guest.firstName} ${guest.lastName} has checked in to "${listing.title}"`,
                link: `/booking/${booking._id}`,
                read: false,
                data: { bookingId: booking._id, guestId: guest._id, listingId: listing._id },
            });
            return true;
        } catch (error) {
            console.error("Error sending check-in notification:", error);
            return false;
        }
    }

    async sendGuestCheckedOut(booking) {
        try {
            await booking.populate([
                { path: "customerId", select: "firstName lastName email" },
                { path: "hostId", select: "firstName lastName email" },
                { path: "listingId", select: "title" },
            ]);
            const { hostId: host, customerId: guest, listingId: listing } = booking;
            await Notification.create({
                userId: host._id,
                type: "guest_checked_out",
                title: "Guest Checked Out",
                message: `${guest.firstName} ${guest.lastName} has checked out from "${listing.title}". Please inspect the property.`,
                link: `/booking/${booking._id}`,
                read: false,
                data: { bookingId: booking._id, guestId: guest._id, listingId: listing._id },
            });
            return true;
        } catch (error) {
            console.error("Error sending check-out notification:", error);
            return false;
        }
    }

    async sendPaymentConfirmed(booking) {
        try {
            await booking.populate([
                { path: "customerId", select: "firstName lastName email" },
                { path: "listingId", select: "title" },
            ]);
            const { customerId: guest, listingId: listing } = booking;
            await Notification.create({
                userId: guest._id,
                type: "payment_confirmed",
                title: "Payment Confirmed",
                message: `Payment confirmed for your booking at "${listing.title}"`,
                link: `/booking/${booking._id}`,
                read: false,
                data: { bookingId: booking._id, listingId: listing._id },
            });
            return true;
        } catch (error) {
            console.error("Error sending payment confirmed notification:", error);
            return false;
        }
    }

    async sendPaymentReleased(booking, amount) {
        try {
            await booking.populate([
                { path: "hostId", select: "firstName lastName email" },
                { path: "listingId", select: "title" },
            ]);
            const { hostId: host } = booking;
            await Notification.create({
                userId: host._id,
                type: "payment_released",
                title: "Payment Received",
                message: `You've received ${amount.toLocaleString("vi-VN")} VND for booking #${booking._id}`,
                link: `/booking/${booking._id}`,
                read: false,
                data: { bookingId: booking._id, amount },
            });
            return true;
        } catch (error) {
            console.error("Error sending payment release notification:", error);
            return false;
        }
    }

    async requestReviews(booking) {
        try {
            await booking.populate([
                { path: "customerId", select: "firstName lastName email" },
                { path: "hostId", select: "firstName lastName email" },
                { path: "listingId", select: "title" },
            ]);
            const { customerId: guest, hostId: host, listingId: listing } = booking;
            await Notification.create({
                userId: guest._id,
                type: "review_request",
                title: "Leave a Review",
                message: `How was your stay at "${listing.title}"? Share your experience!`,
                link: `/review/create/${booking._id}`,
                read: false,
                data: { bookingId: booking._id, listingId: listing._id },
            });
            await Notification.create({
                userId: host._id,
                type: "review_request",
                title: "Review Your Guest",
                message: `How was your experience hosting ${guest.firstName} ${guest.lastName}?`,
                link: `/review/create/${booking._id}`,
                read: false,
                data: { bookingId: booking._id, guestId: guest._id },
            });
            return true;
        } catch (error) {
            console.error("Error requesting reviews:", error);
            return false;
        }
    }

    async sendExtensionRequest(booking) {
        try {
            await booking.populate([
                { path: "customerId", select: "firstName lastName email" },
                { path: "hostId", select: "firstName lastName email" },
                { path: "listingId", select: "title" },
            ]);
            const { hostId: host, customerId: guest, listingId: listing } = booking;
            await Notification.create({
                userId: host._id,
                type: "extension_request",
                title: "Booking Extension Request",
                message: `${guest.firstName} ${guest.lastName} wants to extend their stay at "${listing.title}"`,
                link: `/booking/${booking._id}`,
                read: false,
                data: { bookingId: booking._id, guestId: guest._id, listingId: listing._id },
            });
            return true;
        } catch (error) {
            console.error("Error sending extension request notification:", error);
            return false;
        }
    }

    async sendExtensionApproved(booking, extension) {
        try {
            await booking.populate([
                { path: "customerId", select: "firstName lastName email" },
                { path: "listingId", select: "title" },
            ]);
            const { customerId: guest, listingId: listing } = booking;
            await Notification.create({
                userId: guest._id,
                type: "extension_approved",
                title: "Extension Request Approved",
                message: `Your extension request for "${listing.title}" has been approved. Please complete payment.`,
                link: `/booking/${booking._id}`,
                read: false,
                data: {
                    bookingId: booking._id,
                    listingId: listing._id,
                    extensionId: extension._id,
                    additionalPrice: extension.additionalPrice,
                },
            });
            return true;
        } catch (error) {
            console.error("Error sending extension approved notification:", error);
            return false;
        }
    }

    async sendExtensionRejected(booking, reason) {
        try {
            await booking.populate([
                { path: "customerId", select: "firstName lastName email" },
                { path: "listingId", select: "title" },
            ]);
            const { customerId: guest, listingId: listing } = booking;
            await Notification.create({
                userId: guest._id,
                type: "extension_rejected",
                title: "Extension Request Declined",
                message: `Your extension request for "${listing.title}" was declined.${reason ? ` Reason: ${reason}` : ""}`,
                link: `/booking/${booking._id}`,
                read: false,
                data: { bookingId: booking._id, listingId: listing._id, reason },
            });
            return true;
        } catch (error) {
            console.error("Error sending extension rejected notification:", error);
            return false;
        }
    }
}

module.exports = new NotificationService();
