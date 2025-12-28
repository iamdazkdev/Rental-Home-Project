const User = require('../models/User');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

/**
 * Notification Service for Entire Place Rental
 * Handles email and in-app notifications
 */
class NotificationService {

  /**
   * Send notification when new booking request is created
   */
  async sendBookingRequest(booking) {
    try {
      await booking.populate([
        { path: 'customerId', select: 'firstName lastName email' },
        { path: 'hostId', select: 'firstName lastName email' },
        { path: 'listingId', select: 'title' }
      ]);

      const host = booking.hostId;
      const guest = booking.customerId;
      const listing = booking.listingId;

      console.log(`📧 Sending booking request notification to host: ${host.email}`);

      // Create in-app notification
      await Notification.create({
        userId: host._id,
        type: 'booking_request',
        title: 'New Booking Request',
        message: `${guest.firstName} ${guest.lastName} wants to book "${listing.title}"`,
        link: `/booking/${booking._id}`,
        read: false,
        data: {
          bookingId: booking._id,
          guestId: guest._id,
          listingId: listing._id
        }
      });

      // TODO: Send email notification
      // await emailService.sendBookingRequestEmail(host.email, booking);

      return true;
    } catch (error) {
      console.error('Error sending booking request notification:', error);
      return false;
    }
  }

  /**
   * Send notification when host approves booking
   */
  async sendBookingApproved(booking) {
    try {
      await booking.populate([
        { path: 'customerId', select: 'firstName lastName email' },
        { path: 'hostId', select: 'firstName lastName email' },
        { path: 'listingId', select: 'title' }
      ]);

      const guest = booking.customerId;
      const listing = booking.listingId;

      console.log(`📧 Sending booking approval notification to guest: ${guest.email}`);

      // Create in-app notification
      await Notification.create({
        userId: guest._id,
        type: 'booking_approved',
        title: 'Booking Approved!',
        message: `Your booking for "${listing.title}" has been approved by the host`,
        link: `/booking/${booking._id}`,
        read: false,
        data: {
          bookingId: booking._id,
          listingId: listing._id
        }
      });

      // TODO: Send email with booking details
      // await emailService.sendBookingApprovedEmail(guest.email, booking);

      return true;
    } catch (error) {
      console.error('Error sending booking approved notification:', error);
      return false;
    }
  }

  /**
   * Send notification when host rejects booking
   */
  async sendBookingRejected(booking, reason) {
    try {
      await booking.populate([
        { path: 'customerId', select: 'firstName lastName email' },
        { path: 'listingId', select: 'title' }
      ]);

      const guest = booking.customerId;
      const listing = booking.listingId;

      console.log(`📧 Sending booking rejection notification to guest: ${guest.email}`);

      // Create in-app notification
      await Notification.create({
        userId: guest._id,
        type: 'booking_rejected',
        title: 'Booking Request Declined',
        message: `Your booking for "${listing.title}" was declined. ${reason ? `Reason: ${reason}` : ''}`,
        link: `/booking/${booking._id}`,
        read: false,
        data: {
          bookingId: booking._id,
          listingId: listing._id,
          reason
        }
      });

      // TODO: Send email with refund information
      // await emailService.sendBookingRejectedEmail(guest.email, booking, reason);

      return true;
    } catch (error) {
      console.error('Error sending booking rejected notification:', error);
      return false;
    }
  }

  /**
   * Send notification when guest cancels booking
   */
  async sendBookingCancelled(booking) {
    try {
      await booking.populate([
        { path: 'customerId', select: 'firstName lastName email' },
        { path: 'hostId', select: 'firstName lastName email' },
        { path: 'listingId', select: 'title' }
      ]);

      const host = booking.hostId;
      const guest = booking.customerId;
      const listing = booking.listingId;

      console.log(`📧 Sending cancellation notification to host: ${host.email}`);

      // Create in-app notification
      await Notification.create({
        userId: host._id,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `${guest.firstName} ${guest.lastName} cancelled their booking for "${listing.title}"`,
        link: `/booking/${booking._id}`,
        read: false,
        data: {
          bookingId: booking._id,
          guestId: guest._id,
          listingId: listing._id
        }
      });

      // TODO: Send email to host
      // await emailService.sendBookingCancelledEmail(host.email, booking);

      return true;
    } catch (error) {
      console.error('Error sending booking cancelled notification:', error);
      return false;
    }
  }

  /**
   * Send notification when guest checks in
   */
  async sendGuestCheckedIn(booking) {
    try {
      await booking.populate([
        { path: 'customerId', select: 'firstName lastName email' },
        { path: 'hostId', select: 'firstName lastName email' },
        { path: 'listingId', select: 'title' }
      ]);

      const host = booking.hostId;
      const guest = booking.customerId;
      const listing = booking.listingId;

      console.log(`📧 Sending check-in notification to host: ${host.email}`);

      // Create in-app notification
      await Notification.create({
        userId: host._id,
        type: 'guest_checked_in',
        title: 'Guest Checked In',
        message: `${guest.firstName} ${guest.lastName} has checked in to "${listing.title}"`,
        link: `/booking/${booking._id}`,
        read: false,
        data: {
          bookingId: booking._id,
          guestId: guest._id,
          listingId: listing._id
        }
      });

      return true;
    } catch (error) {
      console.error('Error sending check-in notification:', error);
      return false;
    }
  }

  /**
   * Send notification when guest checks out
   */
  async sendGuestCheckedOut(booking) {
    try {
      await booking.populate([
        { path: 'customerId', select: 'firstName lastName email' },
        { path: 'hostId', select: 'firstName lastName email' },
        { path: 'listingId', select: 'title' }
      ]);

      const host = booking.hostId;
      const guest = booking.customerId;
      const listing = booking.listingId;

      console.log(`📧 Sending check-out notification to host: ${host.email}`);

      // Create in-app notification
      await Notification.create({
        userId: host._id,
        type: 'guest_checked_out',
        title: 'Guest Checked Out',
        message: `${guest.firstName} ${guest.lastName} has checked out from "${listing.title}". Please inspect the property.`,
        link: `/booking/${booking._id}`,
        read: false,
        data: {
          bookingId: booking._id,
          guestId: guest._id,
          listingId: listing._id
        }
      });

      return true;
    } catch (error) {
      console.error('Error sending check-out notification:', error);
      return false;
    }
  }

  /**
   * Send notification when payment is released to host
   */
  async sendPaymentReleased(booking, amount) {
    try {
      await booking.populate([
        { path: 'hostId', select: 'firstName lastName email' },
        { path: 'listingId', select: 'title' }
      ]);

      const host = booking.hostId;

      console.log(`📧 Sending payment release notification to host: ${host.email}`);

      // Create in-app notification
      await Notification.create({
        userId: host._id,
        type: 'payment_released',
        title: 'Payment Received',
        message: `You've received ${amount.toLocaleString('vi-VN')} VND for booking #${booking._id}`,
        link: `/booking/${booking._id}`,
        read: false,
        data: {
          bookingId: booking._id,
          amount
        }
      });

      return true;
    } catch (error) {
      console.error('Error sending payment release notification:', error);
      return false;
    }
  }

  /**
   * Request reviews from both guest and host
   */
  async requestReviews(booking) {
    try {
      await booking.populate([
        { path: 'customerId', select: 'firstName lastName email' },
        { path: 'hostId', select: 'firstName lastName email' },
        { path: 'listingId', select: 'title' }
      ]);

      const guest = booking.customerId;
      const host = booking.hostId;
      const listing = booking.listingId;

      console.log(`📧 Requesting reviews for booking: ${booking._id}`);

      // Notify guest to review
      await Notification.create({
        userId: guest._id,
        type: 'review_request',
        title: 'Leave a Review',
        message: `How was your stay at "${listing.title}"? Share your experience!`,
        link: `/review/create/${booking._id}`,
        read: false,
        data: {
          bookingId: booking._id,
          listingId: listing._id
        }
      });

      // Notify host to review
      await Notification.create({
        userId: host._id,
        type: 'review_request',
        title: 'Review Your Guest',
        message: `How was your experience hosting ${guest.firstName} ${guest.lastName}?`,
        link: `/review/create/${booking._id}`,
        read: false,
        data: {
          bookingId: booking._id,
          guestId: guest._id
        }
      });

      return true;
    } catch (error) {
      console.error('Error requesting reviews:', error);
      return false;
    }
  }

  /**
   * Send notification for extension request
   */
  async sendExtensionRequest(booking) {
    try {
      await booking.populate([
        { path: 'customerId', select: 'firstName lastName email' },
        { path: 'hostId', select: 'firstName lastName email' },
        { path: 'listingId', select: 'title' }
      ]);

      const host = booking.hostId;
      const guest = booking.customerId;
      const listing = booking.listingId;

      console.log(`📧 Sending extension request notification to host: ${host.email}`);

      // Create in-app notification
      await Notification.create({
        userId: host._id,
        type: 'extension_request',
        title: 'Booking Extension Request',
        message: `${guest.firstName} ${guest.lastName} wants to extend their stay at "${listing.title}"`,
        link: `/booking/${booking._id}`,
        read: false,
        data: {
          bookingId: booking._id,
          guestId: guest._id,
          listingId: listing._id
        }
      });

      return true;
    } catch (error) {
      console.error('Error sending extension request notification:', error);
      return false;
    }
  }

  /**
   * Send notification when extension is approved
   */
  async sendExtensionApproved(booking, extension) {
    try {
      await booking.populate([
        { path: 'customerId', select: 'firstName lastName email' },
        { path: 'listingId', select: 'title' }
      ]);

      const guest = booking.customerId;
      const listing = booking.listingId;

      console.log(`📧 Sending extension approval notification to guest: ${guest.email}`);

      // Create in-app notification
      await Notification.create({
        userId: guest._id,
        type: 'extension_approved',
        title: 'Extension Request Approved',
        message: `Your extension request for "${listing.title}" has been approved. Please complete payment.`,
        link: `/booking/${booking._id}`,
        read: false,
        data: {
          bookingId: booking._id,
          listingId: listing._id,
          extensionId: extension._id,
          additionalPrice: extension.additionalPrice
        }
      });

      return true;
    } catch (error) {
      console.error('Error sending extension approved notification:', error);
      return false;
    }
  }

  /**
   * Send notification when extension is rejected
   */
  async sendExtensionRejected(booking, extension, reason) {
    try {
      await booking.populate([
        { path: 'customerId', select: 'firstName lastName email' },
        { path: 'listingId', select: 'title' }
      ]);

      const guest = booking.customerId;
      const listing = booking.listingId;

      console.log(`📧 Sending extension rejection notification to guest: ${guest.email}`);

      // Create in-app notification
      await Notification.create({
        userId: guest._id,
        type: 'extension_rejected',
        title: 'Extension Request Declined',
        message: `Your extension request for "${listing.title}" was declined. ${reason ? `Reason: ${reason}` : ''}`,
        link: `/booking/${booking._id}`,
        read: false,
        data: {
          bookingId: booking._id,
          listingId: listing._id,
          reason
        }
      });

      return true;
    } catch (error) {
      console.error('Error sending extension rejected notification:', error);
      return false;
    }
  }
}

module.exports = new NotificationService();

