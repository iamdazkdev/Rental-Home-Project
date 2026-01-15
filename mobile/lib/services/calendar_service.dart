import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:rental_home/config/api_config.dart';
import 'package:rental_home/models/calendar_models.dart';
import 'package:rental_home/services/storage_service.dart';

/// Service for Host Calendar Management
class CalendarService {
  final StorageService _storageService = StorageService();

  /// Get authorization headers
  Future<Map<String, String>> _getHeaders() async {
    final token = await _storageService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Get calendar data for a listing
  Future<CalendarData> getCalendarData(String listingId,
      {int? month, int? year}) async {
    try {
      final headers = await _getHeaders();

      String url = '${ApiConfig.baseUrl}/calendar/$listingId';
      if (month != null && year != null) {
        url += '?month=$month&year=$year';
      }

      print('📅 Fetching calendar data: $url');

      final response = await http.get(
        Uri.parse(url),
        headers: headers,
      );

      print('📥 Calendar response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);
        if (jsonData['success'] == true) {
          return CalendarData.fromJson(jsonData['data']);
        } else {
          throw Exception(
              jsonData['message'] ?? 'Failed to fetch calendar data');
        }
      } else {
        final errorData = json.decode(response.body);
        throw Exception(
            errorData['message'] ?? 'Failed to fetch calendar data');
      }
    } catch (e) {
      print('❌ Error fetching calendar data: $e');
      rethrow;
    }
  }

  /// Block dates for a listing
  Future<void> blockDates(String listingId, BlockDateRequest request) async {
    try {
      final headers = await _getHeaders();

      final url = '${ApiConfig.baseUrl}/calendar/$listingId/block';

      print('🚫 Blocking dates: $url');
      print('   Request: ${request.toJson()}');

      final response = await http.post(
        Uri.parse(url),
        headers: headers,
        body: json.encode(request.toJson()),
      );

      print('📥 Block dates response: ${response.statusCode}');

      if (response.statusCode == 201) {
        final jsonData = json.decode(response.body);
        if (jsonData['success'] == true) {
          print('✅ Dates blocked successfully');
          return;
        } else {
          throw Exception(jsonData['message'] ?? 'Failed to block dates');
        }
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to block dates');
      }
    } catch (e) {
      print('❌ Error blocking dates: $e');
      rethrow;
    }
  }

  /// Unblock dates
  Future<void> unblockDates(String listingId, String blockId) async {
    try {
      final headers = await _getHeaders();

      final url = '${ApiConfig.baseUrl}/calendar/$listingId/block/$blockId';

      print('✅ Unblocking dates: $url');

      final response = await http.delete(
        Uri.parse(url),
        headers: headers,
      );

      print('📥 Unblock dates response: ${response.statusCode}');

      if (response.statusCode == 200) {
        print('✅ Dates unblocked successfully');
        return;
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to unblock dates');
      }
    } catch (e) {
      print('❌ Error unblocking dates: $e');
      rethrow;
    }
  }

  /// Set custom price for a date
  Future<void> setCustomPrice(
      String listingId, CustomPriceRequest request) async {
    try {
      final headers = await _getHeaders();

      final url = '${ApiConfig.baseUrl}/calendar/$listingId/pricing';

      print('💰 Setting custom price: $url');
      print('   Request: ${request.toJson()}');

      final response = await http.post(
        Uri.parse(url),
        headers: headers,
        body: json.encode(request.toJson()),
      );

      print('📥 Custom price response: ${response.statusCode}');

      if (response.statusCode == 201) {
        final jsonData = json.decode(response.body);
        if (jsonData['success'] == true) {
          print('✅ Custom price set successfully');
          return;
        } else {
          throw Exception(jsonData['message'] ?? 'Failed to set custom price');
        }
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to set custom price');
      }
    } catch (e) {
      print('❌ Error setting custom price: $e');
      rethrow;
    }
  }

  /// Remove custom price
  Future<void> removeCustomPrice(String listingId, String priceId) async {
    try {
      final headers = await _getHeaders();

      final url = '${ApiConfig.baseUrl}/calendar/$listingId/pricing/$priceId';

      print('🗑️ Removing custom price: $url');

      final response = await http.delete(
        Uri.parse(url),
        headers: headers,
      );

      print('📥 Remove price response: ${response.statusCode}');

      if (response.statusCode == 200) {
        print('✅ Custom price removed successfully');
        return;
      } else {
        final errorData = json.decode(response.body);
        throw Exception(
            errorData['message'] ?? 'Failed to remove custom price');
      }
    } catch (e) {
      print('❌ Error removing custom price: $e');
      rethrow;
    }
  }

  /// Check availability (public endpoint)
  Future<Map<String, dynamic>> checkAvailability(
    String listingId,
    DateTime startDate,
    DateTime endDate,
  ) async {
    try {
      final url = '${ApiConfig.baseUrl}/calendar/availability/$listingId'
          '?startDate=${startDate.toIso8601String()}'
          '&endDate=${endDate.toIso8601String()}';

      print('🔍 Checking availability: $url');

      final response = await http.get(Uri.parse(url));

      print('📥 Availability response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);
        if (jsonData['success'] == true) {
          return jsonData['data'];
        } else {
          throw Exception(
              jsonData['message'] ?? 'Failed to check availability');
        }
      } else {
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to check availability');
      }
    } catch (e) {
      print('❌ Error checking availability: $e');
      rethrow;
    }
  }
}
