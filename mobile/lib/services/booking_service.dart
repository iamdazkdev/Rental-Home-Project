import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/booking.dart';
import 'storage_service.dart';

class BookingService {
  final StorageService _storageService = StorageService();

  // Get user booking history (ALL bookings including cancelled/completed)
  Future<List<Booking>> getUserBookingHistory(String userId) async {
    try {
      final token = await _storageService.getToken();
      final uri =
          Uri.parse('${ApiConfig.baseUrl}/entire-place-booking/user/$userId');
      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('🔍 Get booking history URL: $uri');
      debugPrint('📥 Booking history response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final responseBody = response.body;
        debugPrint('📦 Response body length: ${responseBody.length}');

        if (responseBody.isEmpty || responseBody == '[]') {
          debugPrint('ℹ️ No booking history found');
          return [];
        }

        try {
          final List<dynamic> data = json.decode(responseBody);
          debugPrint('✅ Found ${data.length} bookings in history');

          final bookings = <Booking>[];
          for (var i = 0; i < data.length; i++) {
            try {
              bookings.add(Booking.fromJson(data[i]));
            } catch (e) {
              debugPrint('⚠️ Error parsing booking at index $i: $e');
            }
          }

          debugPrint(
              '✅ Successfully parsed ${bookings.length} bookings from history');
          return bookings;
        } catch (e) {
          debugPrint('❌ Error decoding booking history JSON: $e');
          return [];
        }
      }

      debugPrint('❌ Unexpected status code: ${response.statusCode}');
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching booking history: $e');
      return [];
    }
  }

  // Get host reservations
  Future<List<Booking>> getHostReservations(String userId) async {
    try {
      final token = await _storageService.getToken();
      // Correct endpoint: /booking/host/:hostId
      final uri =
          Uri.parse('${ApiConfig.baseUrl}${ApiConfig.bookings}/host/$userId');
      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('🔍 Get reservations URL: $uri');
      debugPrint('📥 Reservations response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        debugPrint('✅ Found ${data.length} reservations');
        return data.map((json) => Booking.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching reservations: $e');
      return [];
    }
  }

  // Checkout booking
  Future<Map<String, dynamic>> checkout({
    required String bookingId,
    String? homeReview,
    double? homeRating,
    String? hostReview,
    double? hostRating,
  }) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      // PATCH /booking/:bookingId/checkout
      final uri = Uri.parse(
          '${ApiConfig.baseUrl}${ApiConfig.bookings}/$bookingId/checkout');

      debugPrint('🔍 Checkout URL: $uri');
      debugPrint(
          '📦 Reviews: home=${homeReview != null}, host=${hostReview != null}');

      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          if (homeReview != null) 'homeReview': homeReview,
          if (homeRating != null) 'homeRating': homeRating,
          if (hostReview != null) 'hostReview': hostReview,
          if (hostRating != null) 'hostRating': hostRating,
        }),
      );

      debugPrint('📥 Checkout response: ${response.statusCode}');

      if (response.statusCode == 200) {
        debugPrint('✅ Checked out successfully');
        return {
          'success': true,
          'message': 'Checked out successfully',
        };
      } else {
        final error = json.decode(response.body);
        debugPrint('❌ Checkout failed: ${error['message']}');
        return {
          'success': false,
          'message': error['message'] ?? 'Checkout failed',
        };
      }
    } catch (e) {
      debugPrint('❌ Error checking out: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  // Extend stay
  Future<Map<String, dynamic>> extendStay({
    required String bookingId,
    required int additionalDays,
  }) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      // POST /booking/:bookingId/extension
      final uri = Uri.parse(
          '${ApiConfig.baseUrl}${ApiConfig.bookings}/$bookingId/extension');

      debugPrint('🔍 Extend stay URL: $uri');
      debugPrint('📦 Extension days: $additionalDays');

      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'additionalDays': additionalDays,
          // Changed from extensionDays to match server
        }),
      );

      debugPrint('📥 Extend stay response: ${response.statusCode}');

      if (response.statusCode == 200) {
        debugPrint('✅ Extension request sent');
        return {
          'success': true,
          'message': 'Extension request sent',
        };
      } else {
        final error = json.decode(response.body);
        debugPrint('❌ Extension failed: ${error['message']}');
        return {
          'success': false,
          'message': error['message'] ?? 'Extension request failed',
        };
      }
    } catch (e) {
      debugPrint('❌ Error extending stay: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  // Accept booking (host)
  Future<Map<String, dynamic>> acceptBooking(String bookingId) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      // PATCH /booking/:bookingId/accept
      final uri = Uri.parse(
          '${ApiConfig.baseUrl}${ApiConfig.bookings}/$bookingId/accept');

      debugPrint('🔍 Accept booking URL: $uri');

      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('📥 Accept response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        debugPrint('✅ Booking accepted');
        return {
          'success': true,
          'message': data['message'] ?? 'Booking accepted',
          'booking': data['booking'],
        };
      } else {
        final error = json.decode(response.body);
        debugPrint('❌ Accept failed: ${error['message']}');
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to accept booking',
        };
      }
    } catch (e) {
      debugPrint('❌ Error accepting booking: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  // Reject booking (host)
  Future<Map<String, dynamic>> rejectBooking(String bookingId,
      {String? reason}) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      // PATCH /booking/:bookingId/reject
      final uri = Uri.parse(
          '${ApiConfig.baseUrl}${ApiConfig.bookings}/$bookingId/reject');

      debugPrint('🔍 Reject booking URL: $uri');
      debugPrint('📦 Rejection reason: $reason');

      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          if (reason != null) 'reason': reason,
        }),
      );

      debugPrint('📥 Reject response: ${response.statusCode}');

      if (response.statusCode == 200) {
        debugPrint('✅ Booking rejected');
        return {
          'success': true,
          'message': 'Booking rejected',
        };
      } else {
        final error = json.decode(response.body);
        debugPrint('❌ Reject failed: ${error['message']}');
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to reject booking',
        };
      }
    } catch (e) {
      debugPrint('❌ Error rejecting booking: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  // Cancel booking (guest)
  Future<Map<String, dynamic>> cancelBooking(String bookingId,
      {String? cancellationReason}) async {
    try {
      final token = await _storageService.getToken();
      final user = await _storageService.getUser();

      if (token == null || user == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      // PATCH /booking/:bookingId/cancel
      final uri = Uri.parse(
          '${ApiConfig.baseUrl}${ApiConfig.bookings}/$bookingId/cancel');

      debugPrint('🔍 Cancel booking URL: $uri');
      debugPrint('📦 Cancellation reason: $cancellationReason');

      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'customerId': user.id,
          if (cancellationReason != null)
            'cancellationReason': cancellationReason,
        }),
      );

      debugPrint('📥 Cancel response: ${response.statusCode}');

      if (response.statusCode == 200) {
        debugPrint('✅ Booking cancelled');
        return {
          'success': true,
          'message': 'Booking cancelled successfully',
        };
      } else {
        final error = json.decode(response.body);
        debugPrint('❌ Cancel failed: ${error['message']}');
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to cancel booking',
        };
      }
    } catch (e) {
      debugPrint('❌ Error cancelling booking: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }
}
