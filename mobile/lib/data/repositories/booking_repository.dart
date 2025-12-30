import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../../config/api_config.dart';
import '../../services/storage_service.dart';
import '../models/booking_model.dart';
import '../models/booking_intent_model.dart';

/// Repository for booking operations
/// Handles API calls and data transformation
class BookingRepository {
  final StorageService _storageService = StorageService();

  // ============ BOOKING INTENT ============

  /// Create a booking intent (temporary lock)
  Future<BookingIntentModel?> createBookingIntent({
    required String listingId,
    required String userId,
    required DateTime startDate,
    required DateTime endDate,
    required PaymentType paymentType,
  }) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/booking-intent/create'),
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'listingId': listingId,
          'userId': userId,
          'startDate': startDate.toIso8601String(),
          'endDate': endDate.toIso8601String(),
          'paymentType': paymentType.value,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return BookingIntentModel.fromJson(data['intent'] ?? data);
      }

      debugPrint('❌ Failed to create booking intent: ${response.body}');
      return null;
    } catch (e) {
      debugPrint('❌ Error creating booking intent: $e');
      return null;
    }
  }

  /// Cancel a booking intent
  Future<bool> cancelBookingIntent(String intentId) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/booking-intent/$intentId/cancel'),
        headers: ApiConfig.headers(token: token),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('❌ Error cancelling booking intent: $e');
      return false;
    }
  }

  /// Check availability for a listing
  Future<Map<String, dynamic>> checkAvailability({
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    String? userId,
  }) async {
    try {
      final token = await _storageService.getToken();

      final queryParams = {
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
        if (userId != null) 'userId': userId,
      };

      final uri = Uri.parse('${ApiConfig.baseUrl}/booking-intent/check-availability/$listingId')
          .replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }

      return {'available': false, 'message': 'Failed to check availability'};
    } catch (e) {
      debugPrint('❌ Error checking availability: $e');
      return {'available': false, 'message': 'Error checking availability'};
    }
  }

  // ============ BOOKING ============

  /// Create a booking
  Future<BookingModel?> createBooking({
    required String customerId,
    required String hostId,
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    required double totalPrice,
    required PaymentMethod paymentMethod,
    required PaymentType paymentType,
    double? depositAmount,
    int? depositPercentage,
    String? paymentIntentId,
    String? transactionId,
  }) async {
    try {
      final token = await _storageService.getToken();

      final body = {
        'customerId': customerId,
        'hostId': hostId,
        'listingId': listingId,
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
        'totalPrice': totalPrice,
        'paymentMethod': paymentMethod.value,
        'paymentType': paymentType.value,
        if (depositAmount != null) 'depositAmount': depositAmount,
        if (depositPercentage != null) 'depositPercentage': depositPercentage,
        if (paymentIntentId != null) 'paymentIntentId': paymentIntentId,
        if (transactionId != null) 'transactionId': transactionId,
      };

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/booking'),
        headers: ApiConfig.headers(token: token),
        body: json.encode(body),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return BookingModel.fromJson(data['booking'] ?? data);
      }

      debugPrint('❌ Failed to create booking: ${response.body}');
      return null;
    } catch (e) {
      debugPrint('❌ Error creating booking: $e');
      return null;
    }
  }

  /// Get booking by ID
  Future<BookingModel?> getBooking(String bookingId) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/booking/$bookingId'),
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return BookingModel.fromJson(data['booking'] ?? data);
      }

      return null;
    } catch (e) {
      debugPrint('❌ Error fetching booking: $e');
      return null;
    }
  }

  /// Get user trips (bookings as customer)
  Future<List<BookingModel>> getUserTrips(String userId) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/user/$userId/trips'),
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> trips = data['trips'] ?? data ?? [];
        return trips.map((json) => BookingModel.fromJson(json)).toList();
      }

      return [];
    } catch (e) {
      debugPrint('❌ Error fetching trips: $e');
      return [];
    }
  }

  /// Get host reservations
  Future<List<BookingModel>> getHostReservations(String hostId) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/user/$hostId/reservations'),
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> reservations = data['reservations'] ?? data ?? [];
        return reservations.map((json) => BookingModel.fromJson(json)).toList();
      }

      return [];
    } catch (e) {
      debugPrint('❌ Error fetching reservations: $e');
      return [];
    }
  }

  /// Cancel booking
  Future<bool> cancelBooking(String bookingId, {String? reason}) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/booking/$bookingId/cancel'),
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          if (reason != null) 'cancellationReason': reason,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('❌ Error cancelling booking: $e');
      return false;
    }
  }

  /// Approve booking (host action)
  Future<bool> approveBooking(String bookingId) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/booking/$bookingId/approve'),
        headers: ApiConfig.headers(token: token),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('❌ Error approving booking: $e');
      return false;
    }
  }

  /// Reject booking (host action)
  Future<bool> rejectBooking(String bookingId, {String? reason}) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/booking/$bookingId/reject'),
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          if (reason != null) 'rejectionReason': reason,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('❌ Error rejecting booking: $e');
      return false;
    }
  }

  /// Check-in
  Future<bool> checkIn(String bookingId) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/booking/$bookingId/check-in'),
        headers: ApiConfig.headers(token: token),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('❌ Error checking in: $e');
      return false;
    }
  }

  /// Check-out
  Future<bool> checkOut(String bookingId, {
    String? homeReview,
    double? homeRating,
    String? hostReview,
    double? hostRating,
  }) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/booking/$bookingId/checkout'),
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          if (homeReview != null) 'homeReview': homeReview,
          if (homeRating != null) 'homeRating': homeRating,
          if (hostReview != null) 'hostReview': hostReview,
          if (hostRating != null) 'hostRating': hostRating,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('❌ Error checking out: $e');
      return false;
    }
  }

  // ============ PAYMENT ============

  /// Create VNPay payment URL
  Future<String?> createPaymentUrl({
    required String bookingId,
    required double amount,
    required String paymentType,
    String? returnUrl,
  }) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/payment/create-payment-url'),
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'bookingId': bookingId,
          'amount': amount,
          'paymentType': paymentType,
          if (returnUrl != null) 'returnUrl': returnUrl,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['paymentUrl'];
      }

      return null;
    } catch (e) {
      debugPrint('❌ Error creating payment URL: $e');
      return null;
    }
  }

  /// Complete remaining payment (for deposit bookings)
  Future<bool> completeRemainingPayment({
    required String bookingId,
    required String paymentMethod,
  }) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/booking/$bookingId/complete-payment'),
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'paymentMethod': paymentMethod,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('❌ Error completing payment: $e');
      return false;
    }
  }

  /// Confirm cash payment (host action)
  Future<bool> confirmCashPayment(String bookingId) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/booking/$bookingId/confirm-cash-payment'),
        headers: ApiConfig.headers(token: token),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('❌ Error confirming cash payment: $e');
      return false;
    }
  }
}

