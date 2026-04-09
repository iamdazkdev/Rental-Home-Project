import '../entities/booking_entity.dart';
import '../entities/booking_intent_entity.dart';

abstract class IBookingRepository {
  /// Create a cash booking directly (no payment gateway)
  Future<BookingEntity?> createCashBooking({
    required String listingId,
    required String hostId,
    required DateTime startDate,
    required DateTime endDate,
    required double totalPrice,
  });

  /// Create a booking intent (temporary lock) for Entire Place Rental
  Future<BookingIntentEntity?> createBookingIntent({
    required String listingId,
    required String hostId,
    required DateTime startDate,
    required DateTime endDate,
    required double totalPrice,
    required String paymentType,
  });

  /// Create VNPay payment URL for the booking intent
  Future<String?> createVNPayPaymentUrl({
    required String tempOrderId,
    required double amount,
    required String orderInfo,
    required String returnUrl,
  });

  /// Handle VNPay callback and verify payment server-side
  Future<BookingEntity?> handlePaymentCallback({
    required String tempOrderId,
    required String transactionId,
    required Map<String, dynamic> paymentData,
  });

  /// Check availability for a listing
  Future<Map<String, dynamic>> checkAvailability({
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    String? userId,
  });

  /// Get a single booking by ID
  Future<BookingEntity?> getBookingById(String bookingId);

  /// Fetch user's trips
  Future<List<BookingEntity>> getUserTrips();

  /// Extend a stay
  Future<Map<String, dynamic>?> requestExtension({
    required String bookingId,
    required DateTime newEndDate,
  });

  /// Cancel a booking intent (release the lock)
  Future<bool> cancelBookingIntent(String intentId);
  
  /// General initiate payment for existing bookings
  Future<String?> initiatePayment({
    required String bookingId,
    required String paymentType,
    required double amount,
  });

  Future<Map<String, dynamic>?> checkPaymentStatus(String bookingId);
}
