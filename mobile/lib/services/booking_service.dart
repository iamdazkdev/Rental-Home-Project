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
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.bookings}/create');
      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'listingId': listingId,
          'startDate': startDate.toIso8601String(),
          'endDate': endDate.toIso8601String(),
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': 'Booking created successfully',
          'booking': data,
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to create booking',
        };
      }
    } catch (e) {
      debugPrint('Error creating booking: $e');
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
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.trips}/$userId');
      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Booking.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching trips: $e');
      return [];
    }
  }

  // Get host reservations
  Future<List<Booking>> getHostReservations(String userId) async {
    try {
      final token = await _storageService.getToken();
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.reservations}/$userId');
      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Booking.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching reservations: $e');
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

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.bookings}/$bookingId/checkout');
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

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Checked out successfully',
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Checkout failed',
        };
      }
    } catch (e) {
      debugPrint('Error checking out: $e');
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

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.bookings}/$bookingId/extend');
      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'extensionDays': additionalDays,
        }),
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Extension request sent',
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Extension request failed',
        };
      }
    } catch (e) {
      debugPrint('Error extending stay: $e');
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

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.bookings}/$bookingId/approve');
      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Booking approved',
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to approve booking',
        };
      }
    } catch (e) {
      debugPrint('Error approving booking: $e');
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

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.bookings}/$bookingId/reject');
      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Booking rejected',
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to reject booking',
        };
      }
    } catch (e) {
      debugPrint('Error rejecting booking: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }
}

