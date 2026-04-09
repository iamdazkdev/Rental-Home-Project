const Booking = require("../models/Booking");
const PendingBooking = require("../models/PendingBooking");
const PaymentHistory = require("../models/PaymentHistory");

class PaymentService {
    async findPendingBooking(conditions) {
        return await PendingBooking.findOne(conditions);
    }
    
    async savePendingBooking(data) {
        const pendingBooking = new PendingBooking(data);
        return await pendingBooking.save();
    }
    
    async updatePendingBooking(id, updateData) {
        return await PendingBooking.findByIdAndUpdate(id, updateData, { new: true });
    }
    
    async createBooking(data) {
        const booking = new Booking(data);
        return await booking.save();
    }
    
    async savePaymentHistory(data) {
        const paymentHistoryDoc = new PaymentHistory(data);
        return await paymentHistoryDoc.save();
    }
    
    async findBookingById(id, populateOpts = []) {
        let query = Booking.findById(id);
        populateOpts.forEach(opt => {
            query = query.populate(opt.path, opt.select);
        });
        return await query.exec();
    }
    
    async cleanupExpiredPendingBookings() {
        return await PendingBooking.deleteMany({
            status: "pending_payment",
            expiresAt: { $lt: new Date() }
        });
    }
}

module.exports = new PaymentService();
