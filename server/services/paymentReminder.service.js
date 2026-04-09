const Booking = require("../models/Booking");
const PaymentHistory = require("../models/PaymentHistory");
const Notification = require("../models/Notification");

class PaymentReminderService {
    async findBooking(id) {
        return await Booking.findById(id);
    }

    async findBookingPopulated(id) {
        return await Booking.findById(id)
            .populate("customerId", "firstName lastName email profileImagePath")
            .populate("hostId", "firstName lastName email profileImagePath")
            .populate("listingId", "title city province country listingPhotoPaths price");
    }

    async saveBooking(booking) {
        return await booking.save();
    }

    async createPaymentHistory(data) {
        const doc = new PaymentHistory(data);
        return await doc.save();
    }

    async createNotification(data) {
        const doc = new Notification(data);
        return await doc.save();
    }
}

module.exports = new PaymentReminderService();
