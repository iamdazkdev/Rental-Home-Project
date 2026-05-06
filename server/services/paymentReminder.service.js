const cron = require("node-cron");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const PaymentHistory = require("../models/PaymentHistory");
const { sendEmail } = require("./email.service");

class PaymentReminderService {
    // ── DATA ACCESS ──────────────────────────────────────────────────────────

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

    // ── SCHEDULER ────────────────────────────────────────────────────────────

    _getDaysUntilCheckIn(checkInDate) {
        const diffTime = new Date(checkInDate) - new Date();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    async _sendReminder(booking) {
        const { customerId: guest, listingId: listing, hostId: host } = booking;
        const daysLeft = this._getDaysUntilCheckIn(booking.startDate);

        await Notification.create({
            userId: guest._id,
            type: "payment_reminder",
            bookingId: booking._id,
            title: `Payment Reminder: ${listing.title}`,
            message: `Your check-in is in ${daysLeft} days. Please complete the remaining payment of ${booking.remainingAmount.toLocaleString("vi-VN")} VND.`,
            data: {
                bookingId: booking._id,
                listingId: listing._id,
                remainingAmount: booking.remainingAmount,
                depositAmount: booking.depositAmount,
                totalAmount: booking.finalTotalPrice,
                checkInDate: booking.startDate,
                listingTitle: listing.title,
                hostName: `${host.firstName} ${host.lastName}`,
            },
            actionUrl: `/payment-reminder/${booking._id}`,
            isRead: false,
        });

        await sendEmail({
            to: guest.email,
            subject: `Payment Reminder - ${listing.title}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF385C;">Payment Reminder</h2>
          <p>Hi ${guest.firstName},</p>
          <p>Your check-in for <strong>${listing.title}</strong> is coming up in ${daysLeft} days!</p>
          <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Check-in:</strong> ${new Date(booking.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            <p><strong>Deposit Paid:</strong> ${booking.depositAmount.toLocaleString("vi-VN")} VND ✅</p>
            <p><strong>Remaining Balance:</strong> ${booking.remainingAmount.toLocaleString("vi-VN")} VND ⚠️</p>
          </div>
          <p><strong>Payment Options:</strong></p>
          <ul>
            <li>Pay online via VNPay (recommended)</li>
            <li>Pay cash at check-in</li>
          </ul>
          <a href="${process.env.CLIENT_URL}/payment-reminder/${booking._id}"
             style="display: inline-block; background: #FF385C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Complete Payment
          </a>
        </div>
      `,
        });

        booking.reminderSent = true;
        await booking.save();
    }

    async checkPaymentReminders() {
        try {
            console.log("🔔 Running payment reminder check...");
            const now = new Date();
            const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

            const bookings = await Booking.find({
                paymentType: "deposit",
                paymentStatus: "partially_paid",
                bookingStatus: "approved",
                startDate: { $gte: now, $lte: twoDaysFromNow },
                reminderSent: { $ne: true },
            })
                .populate("customerId", "firstName lastName email")
                .populate("listingId", "title")
                .populate("hostId", "firstName lastName");

            console.log(`📧 Found ${bookings.length} bookings needing payment reminder`);
            for (const booking of bookings) {
                await this._sendReminder(booking);
            }
            console.log("✅ Payment reminder check completed");
        } catch (error) {
            console.error("❌ Error in payment reminder check:", error);
        }
    }

    startPaymentReminderScheduler() {
        cron.schedule("0 9 * * *", () => {
            console.log("🔔 Payment reminder scheduler triggered");
            this.checkPaymentReminders();
        });
        console.log("✅ Payment reminder scheduler started (runs daily at 9:00 AM)");

        if (process.env.NODE_ENV === "development") {
            this.checkPaymentReminders();
        }
    }
}

const paymentReminderService = new PaymentReminderService();
paymentReminderService.startPaymentReminderScheduler = paymentReminderService.startPaymentReminderScheduler.bind(paymentReminderService);

module.exports = paymentReminderService;
