import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/booking_intent.dart';
import 'storage_service.dart';

/// Service để xử lý BookingIntent - Temporary Reservation/Locking mechanism
/// Prevents overbooking when multiple users try to book the same listing
class BookingIntentService {
  final StorageService _storageService = StorageService();

  /// Check if a listing is available for the specified dates
  Future<Map<String, dynamic>> checkAvailability({
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    required String userId,
  }) async {
    try {
      final token = await _storageService.getToken();

      final queryParams = {
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
        'userId': userId,
      };

      final uri = Uri.parse(
        '${ApiConfig.baseUrl}/booking-intent/check-availability/$listingId'
      ).replace(queryParameters: queryParams);

      debugPrint('🔍 Checking availability: $uri');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('📥 Availability response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'available': data['available'] ?? false,
          'lockedBy': data['lockedBy'],
          'lockedUntil': data['lockedUntil'],
          'message': data['message'],
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'available': false,
          'message': error['message'] ?? 'Failed to check availability',
        };
      }
    } catch (e) {
      debugPrint('❌ Error checking availability: $e');
      return {
        'success': false,
        'available': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Create a booking intent (lock the listing temporarily)
  Future<Map<String, dynamic>> createBookingIntent({
    required String customerId,
    required String hostId,
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    required double totalPrice,
    required String paymentMethod, // vnpay, cash
    required String paymentType, // full, deposit, cash
    double? depositAmount,
    int? depositPercentage,
    String bookingType = 'entire_place',
  }) async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/booking-intent/create');

      debugPrint('🔒 Creating booking intent for listing: $listingId');
      debugPrint('📅 Dates: $startDate to $endDate');
      debugPrint('💳 Payment: $paymentMethod / $paymentType');

      // Calculate payment amount
      double paymentAmount = totalPrice;
      double remainingAmount = 0;

      if (paymentType == 'deposit') {
        final percentage = depositPercentage ?? 30;
        paymentAmount = depositAmount ?? (totalPrice * percentage / 100);
        remainingAmount = totalPrice - paymentAmount;
      }

      final body = {
        'customerId': customerId,
        'hostId': hostId,
        'listingId': listingId,
        'bookingType': bookingType,
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
        'totalPrice': totalPrice,
        'paymentMethod': paymentMethod,
        'paymentType': paymentType,
        'paymentAmount': paymentAmount,
        'depositPercentage': depositPercentage ?? 0,
        'depositAmount': depositAmount ?? 0,
        'remainingAmount': remainingAmount,
      };

      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode(body),
      );

      debugPrint('📥 Create intent response: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        debugPrint('✅ Booking intent created: ${data['intent']?['intentId']}');

        return {
          'success': true,
          'message': data['message'] ?? 'Listing locked successfully',
          'intent': data['intent'] != null
            ? BookingIntent.fromJson(data['intent'])
            : null,
          'intentId': data['intent']?['intentId'],
          'expiresAt': data['intent']?['expiresAt'],
        };
      } else if (response.statusCode == 409) {
        // Listing is locked by another user
        final error = json.decode(response.body);
        debugPrint('⚠️ Listing is locked: ${error['message']}');
        return {
          'success': false,
          'locked': true,
          'message': error['message'] ?? 'This listing is currently being booked by another user',
          'lockedUntil': error['lockedUntil'],
        };
      } else {
        final error = json.decode(response.body);
        debugPrint('❌ Failed to create intent: ${error['message']}');
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to create booking intent',
        };
      }
    } catch (e) {
      debugPrint('❌ Error creating booking intent: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Confirm payment and create actual booking
  Future<Map<String, dynamic>> confirmPayment({
    required String intentId,
    required String transactionId,
    String? vnpTransactionNo,
  }) async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/booking-intent/$intentId/confirm');

      debugPrint('💳 Confirming payment for intent: $intentId');
      debugPrint('🔖 Transaction ID: $transactionId');

      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'transactionId': transactionId,
          'vnpTransactionNo': vnpTransactionNo,
        }),
      );

      debugPrint('📥 Confirm payment response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        debugPrint('✅ Payment confirmed, booking created: ${data['booking']?['_id']}');
        return {
          'success': true,
          'message': data['message'] ?? 'Booking confirmed successfully',
          'booking': data['booking'],
          'bookingId': data['booking']?['_id'],
        };
      } else {
        final error = json.decode(response.body);
        debugPrint('❌ Payment confirmation failed: ${error['message']}');
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to confirm payment',
        };
      }
    } catch (e) {
      debugPrint('❌ Error confirming payment: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Cancel a booking intent (release the lock)
  Future<Map<String, dynamic>> cancelIntent(String intentId) async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/booking-intent/$intentId/cancel');

      debugPrint('🔓 Cancelling booking intent: $intentId');

      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('📥 Cancel intent response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        debugPrint('✅ Booking intent cancelled');
        return {
          'success': true,
          'message': data['message'] ?? 'Booking intent cancelled',
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to cancel booking intent',
        };
      }
    } catch (e) {
      debugPrint('❌ Error cancelling intent: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Get booking intent by ID
  Future<BookingIntent?> getIntent(String intentId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/booking-intent/$intentId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return BookingIntent.fromJson(data['intent'] ?? data);
      }
      return null;
    } catch (e) {
      debugPrint('❌ Error fetching intent: $e');
      return null;
    }
  }

  /// Get user's active intents
  Future<List<BookingIntent>> getUserActiveIntents(String userId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/booking-intent/user/$userId/active');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => BookingIntent.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching user intents: $e');
      return [];
    }
  }
}

