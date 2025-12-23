import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/booking.dart';
import 'storage_service.dart';

class BookingService {
  final StorageService _storageService = StorageService();

  // Create booking
  Future<Map<String, dynamic>> createBooking({
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      final token = await _storageService.getToken();
      final user = await _storageService.getUser();

      if (token == null || user == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.bookings}/create');

      debugPrint('🔍 Create booking URL: $uri');
      debugPrint('📦 Booking data: listingId=$listingId, start=$startDate, end=$endDate');

      // Get listing to calculate price and get hostId
      final listingUri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.listings}/$listingId');
      final listingResponse = await http.get(listingUri, headers: ApiConfig.headers());

      if (listingResponse.statusCode != 200) {
        return {'success': false, 'message': 'Could not fetch listing details'};
      }

      final listingData = json.decode(listingResponse.body);
      final price = (listingData['price'] ?? 0).toDouble();
      final hostId = listingData['creator'] is String
          ? listingData['creator']
          : listingData['creator']?['_id'] ?? '';

      if (hostId.isEmpty) {
        return {'success': false, 'message': 'Invalid listing data'};
      }

      // Calculate total price
      final nights = endDate.difference(startDate).inDays;
      final totalPrice = price * nights;

      debugPrint('📊 Price: $price x $nights nights = $totalPrice');

      // Format dates to match web format: "Wed Dec 24 2025"
      // This matches JavaScript's Date.toDateString()
      final weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      String formatToDateString(DateTime date) {
        final weekday = weekdays[date.weekday % 7];
        final month = months[date.month - 1];
        final day = date.day;
        final year = date.year;
        return '$weekday $month $day $year';
      }

      final startDateStr = formatToDateString(startDate);
      final endDateStr = formatToDateString(endDate);

      debugPrint('📅 Start: $startDateStr');
      debugPrint('📅 End: $endDateStr');

      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'customerId': user.id,
          'hostId': hostId,
          'listingId': listingId,
          'startDate': startDateStr,
          'endDate': endDateStr,
          'totalPrice': totalPrice,
        }),
      );

      debugPrint('📥 Create booking response: ${response.statusCode}');
      debugPrint('📦 Response body: ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        debugPrint('✅ Booking created successfully');
        return {
          'success': true,
          'message': 'Booking request sent successfully',
          'booking': data,
        };
      } else {
        final error = json.decode(response.body);
        debugPrint('❌ Booking failed: ${error['message']}');
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to create booking',
        };
      }
    } catch (e) {
      debugPrint('❌ Error creating booking: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  // Get user trips (guest bookings)
  Future<List<Booking>> getUserTrips(String userId) async {
    try {
      final token = await _storageService.getToken();
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.trips}/$userId/trips');
      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );
  
      debugPrint('🔍 Get trips URL: $uri');
      debugPrint('📥 Trips response: ${response.statusCode}');
  
      // Accept both 200 and 202 status codes
      if (response.statusCode == 200 || response.statusCode == 202) {
        final responseBody = response.body;
        debugPrint('📦 Response body length: ${responseBody.length}');

        // Check if response is empty
        if (responseBody.isEmpty || responseBody == '[]') {
          debugPrint('ℹ️ No trips found (empty response)');
          return [];
        }

        try {
          final List<dynamic> data = json.decode(responseBody);
          debugPrint('✅ Found ${data.length} trips');

          final bookings = <Booking>[];
          for (var i = 0; i < data.length; i++) {
            try {
              bookings.add(Booking.fromJson(data[i]));
            } catch (e) {
              debugPrint('⚠️ Error parsing booking at index $i: $e');
              // Continue with other bookings
            }
          }

          debugPrint('✅ Successfully parsed ${bookings.length} bookings');
          return bookings;
        } catch (e) {
          debugPrint('❌ Error decoding trips JSON: $e');
          debugPrint('Response: ${responseBody.substring(0, responseBody.length > 500 ? 500 : responseBody.length)}');
          return [];
        }
      }

      debugPrint('❌ Unexpected status code: ${response.statusCode}');
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching trips: $e');
      return [];
    }
  }

  // Get host reservations
  Future<List<Booking>> getHostReservations(String userId) async {
    try {
      final token = await _storageService.getToken();
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.reservations}/$userId/reservations');
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
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.bookings}/$bookingId/checkout');

      debugPrint('🔍 Checkout URL: $uri');
      debugPrint('📦 Reviews: home=${homeReview != null}, host=${hostReview != null}');

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
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.bookings}/$bookingId/extension');

      debugPrint('🔍 Extend stay URL: $uri');
      debugPrint('📦 Extension days: $additionalDays');

      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'extensionDays': additionalDays,
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

  // Approve booking (host)
  Future<Map<String, dynamic>> approveBooking(String bookingId) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      // PATCH /booking/:bookingId/accept
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.bookings}/$bookingId/accept');

      debugPrint('🔍 Approve booking URL: $uri');

      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('📥 Approve response: ${response.statusCode}');

      if (response.statusCode == 200) {
        debugPrint('✅ Booking approved');
        return {
          'success': true,
          'message': 'Booking approved',
        };
      } else {
        final error = json.decode(response.body);
        debugPrint('❌ Approve failed: ${error['message']}');
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to approve booking',
        };
      }
    } catch (e) {
      debugPrint('❌ Error approving booking: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  // Reject booking (host)
  Future<Map<String, dynamic>> rejectBooking(String bookingId) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      // PATCH /booking/:bookingId/reject
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.bookings}/$bookingId/reject');

      debugPrint('🔍 Reject booking URL: $uri');

      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
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
}

