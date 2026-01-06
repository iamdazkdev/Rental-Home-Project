const cron = require('node-cron');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

/**
 * Payment Reminder Scheduler
 * Runs daily to check for upcoming check-ins with unpaid deposits
 */

// Check for bookings needing payment reminders
const checkPaymentReminders = async () => {
  try {
    console.log('🔔 Running payment reminder check...');

    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // Find bookings:
    // 1. Payment type = deposit
    // 2. Payment status = partially_paid
    // 3. Check-in date is within 2 days
    // 4. Status = approved (not cancelled/rejected)
    const bookingsNeedingReminder = await Booking.find({
      paymentType: 'deposit',
      paymentStatus: 'partially_paid',
      bookingStatus: 'approved',
      startDate: {
        $gte: now,
        $lte: twoDaysFromNow
      },
      reminderSent: { $ne: true } // Haven't sent reminder yet
    })
    .populate('customerId', 'firstName lastName email')
    .populate('listingId', 'title')
    .populate('hostId', 'firstName lastName');

    console.log(`📧 Found ${bookingsNeedingReminder.length} bookings needing payment reminder`);

    for (const booking of bookingsNeedingReminder) {
      await sendPaymentReminder(booking);
    }

    console.log('✅ Payment reminder check completed');
  } catch (error) {
    console.error('❌ Error in payment reminder check:', error);
  }
};

// Send payment reminder to guest
const sendPaymentReminder = async (booking) => {
  try {
    const guest = booking.customerId;
    const listing = booking.listingId;
    const host = booking.hostId;

    // Create notification
    const notification = await Notification.create({
      userId: guest._id,
      type: 'payment_reminder',
      bookingId: booking._id,
      title: `Payment Reminder: ${listing.title}`,
      message: `Your check-in is in ${getDaysUntilCheckIn(booking.startDate)} days. Please complete the remaining payment of ${booking.remainingAmount.toLocaleString('vi-VN')} VND.`,
      data: {
        bookingId: booking._id,
        listingId: listing._id,
        remainingAmount: booking.remainingAmount,
        depositAmount: booking.depositAmount,
        totalAmount: booking.finalTotalPrice,
        checkInDate: booking.startDate,
        listingTitle: listing.title,
        hostName: `${host.firstName} ${host.lastName}`
      },
      actionUrl: `/payment-reminder/${booking._id}`,
      isRead: false
    });

    console.log(`📬 Notification created for booking ${booking._id}`);

    // Send email
    const emailSent = await sendEmail({
      to: guest.email,
      subject: `Payment Reminder - ${listing.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF385C;">Payment Reminder</h2>
          
          <p>Hi ${guest.firstName},</p>
          
          <p>Your check-in for <strong>${listing.title}</strong> is coming up in ${getDaysUntilCheckIn(booking.startDate)} days!</p>
          
          <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Check-in:</strong> ${new Date(booking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <p><strong>Deposit Paid:</strong> ${booking.depositAmount.toLocaleString('vi-VN')} VND ✅</p>
            <p><strong>Remaining Balance:</strong> ${booking.remainingAmount.toLocaleString('vi-VN')} VND ⚠️</p>
          </div>
          
          <p><strong>Payment Options:</strong></p>
          <ul>
            <li>Pay online via VNPay (recommended)</li>
            <li>Pay cash at check-in</li>
          </ul>
          
          <p>Please complete your payment to ensure a smooth check-in experience.</p>
          
          <a href="${process.env.CLIENT_URL}/payment-reminder/${booking._id}" 
             style="display: inline-block; background: #FF385C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Complete Payment
          </a>
          
          <p>Thank you for choosing our platform!</p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            If you have any questions, please contact the host or our support team.
          </p>
        </div>
      `
    });

    if (emailSent) {
      console.log(`📧 Email sent to ${guest.email}`);
    }

    // Mark reminder as sent
    booking.reminderSent = true;
    await booking.save();

    console.log(`✅ Payment reminder sent for booking ${booking._id}`);

    return notification;
  } catch (error) {
    console.error(`❌ Error sending payment reminder for booking ${booking._id}:`, error);
    throw error;
  }
};

// Helper function to calculate days until check-in
const getDaysUntilCheckIn = (checkInDate) => {
  const now = new Date();
  const checkIn = new Date(checkInDate);
  const diffTime = checkIn - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Schedule the job to run daily at 9:00 AM
const startPaymentReminderScheduler = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    console.log('🔔 Payment reminder scheduler triggered');
    checkPaymentReminders();
  });

  console.log('✅ Payment reminder scheduler started (runs daily at 9:00 AM)');

  // For testing: also run immediately on server start
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Running payment reminder check on startup (dev mode)');
    checkPaymentReminders();
  }
};

module.exports = {
  startPaymentReminderScheduler,
  checkPaymentReminders,
  sendPaymentReminder
};

