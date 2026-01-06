import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/room_rental.dart';
import '../models/listing.dart';
import 'storage_service.dart';

/// Service for Room Rental operations
/// Synced with backend /room-rental routes
class RoomRentalService {
  final StorageService _storageService = StorageService();

  /// Get available rooms for rent
  Future<List<Listing>> getAvailableRooms({
    String? city,
    double? minPrice,
    double? maxPrice,
  }) async {
    try {
      final token = await _storageService.getToken();

      final queryParams = <String, String>{};
      if (city != null) queryParams['city'] = city;
      if (minPrice != null) queryParams['minPrice'] = minPrice.toString();
      if (maxPrice != null) queryParams['maxPrice'] = maxPrice.toString();

      final uri = Uri.parse('${ApiConfig.baseUrl}/room-rental/rooms')
        .replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);

      debugPrint('🏠 Fetching available rooms: $uri');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Listing.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching rooms: $e');
      return [];
    }
  }

  /// Get room detail by ID
  Future<Listing?> getRoomDetail(String roomId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/room-rental/rooms/$roomId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return Listing.fromJson(data['room'] ?? data);
      }
      return null;
    } catch (e) {
      debugPrint('❌ Error fetching room detail: $e');
      return null;
    }
  }

  // ============ RENTAL REQUESTS ============

  /// Submit a rental request for a room
  Future<Map<String, dynamic>> submitRentalRequest({
    required String roomId,
    required String tenantId,
    required String hostId,
    required String message,
    required DateTime moveInDate,
    required int intendedStayDuration,
  }) async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/room-rental/request');

      debugPrint('📝 Submitting rental request for room: $roomId');

      final body = {
        'roomId': roomId,
        'tenantId': tenantId,
        'hostId': hostId,
        'message': message,
        'moveInDate': moveInDate.toIso8601String(),
        'intendedStayDuration': intendedStayDuration,
      };

      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode(body),
      );

      debugPrint('📥 Request response: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Request submitted successfully',
          'request': data['request'] != null
            ? RentalRequest.fromJson(data['request'])
            : null,
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to submit request',
          'errors': error['errors'],
        };
      }
    } catch (e) {
      debugPrint('❌ Error submitting rental request: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Get user's rental requests (as tenant)
  Future<List<RentalRequest>> getMyRentalRequests(String userId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/room-rental/requests/tenant/$userId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> requests = data['requests'] ?? data ?? [];
        return requests.map((json) => RentalRequest.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching my requests: $e');
      return [];
    }
  }

  /// Get incoming rental requests (as host)
  Future<List<RentalRequest>> getHostRentalRequests(String hostId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/room-rental/requests/host/$hostId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> requests = data['requests'] ?? data ?? [];
        return requests.map((json) => RentalRequest.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching host requests: $e');
      return [];
    }
  }

  /// Approve a rental request (host)
  Future<Map<String, dynamic>> approveRequest(String requestId, String hostId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/room-rental/requests/$requestId/approve');

      debugPrint('✅ Approving request: $requestId');

      final response = await http.put(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({'hostId': hostId}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Request approved',
          'agreement': data['agreement'] != null
            ? RentalAgreement.fromJson(data['agreement'])
            : null,
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to approve request',
        };
      }
    } catch (e) {
      debugPrint('❌ Error approving request: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Reject a rental request (host)
  Future<Map<String, dynamic>> rejectRequest(String requestId, String reason) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/room-rental/requests/$requestId/reject');

      debugPrint('❌ Rejecting request: $requestId');

      final response = await http.put(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({'reason': reason}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Request rejected',
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to reject request',
        };
      }
    } catch (e) {
      debugPrint('❌ Error rejecting request: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Cancel a rental request (tenant)
  Future<Map<String, dynamic>> cancelRequest(String requestId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/room-rental/requests/$requestId/cancel');

      final response = await http.put(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Request cancelled',
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to cancel request',
        };
      }
    } catch (e) {
      debugPrint('❌ Error cancelling request: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  // ============ RENTAL AGREEMENTS ============

  /// Get user's rental agreements (as tenant)
  Future<List<RentalAgreement>> getMyAgreements(String userId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/room-rental/agreements/tenant/$userId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> agreements = data['agreements'] ?? data ?? [];
        return agreements.map((json) => RentalAgreement.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching my agreements: $e');
      return [];
    }
  }

  /// Get host's rental agreements
  Future<List<RentalAgreement>> getHostAgreements(String hostId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/room-rental/agreements/host/$hostId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> agreements = data['agreements'] ?? data ?? [];
        return agreements.map((json) => RentalAgreement.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching host agreements: $e');
      return [];
    }
  }

  /// Accept an agreement (tenant)
  Future<Map<String, dynamic>> acceptAgreement(String agreementId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/room-rental/agreements/$agreementId/accept-tenant');

      debugPrint('✅ Accepting agreement: $agreementId');

      final response = await http.put(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Agreement accepted',
          'agreement': data['agreement'] != null
            ? RentalAgreement.fromJson(data['agreement'])
            : null,
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to accept agreement',
        };
      }
    } catch (e) {
      debugPrint('❌ Error accepting agreement: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Confirm agreement (host)
  Future<Map<String, dynamic>> confirmAgreement(String agreementId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/room-rental/agreements/$agreementId/confirm-host');

      final response = await http.put(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Agreement confirmed',
          'agreement': data['agreement'] != null
            ? RentalAgreement.fromJson(data['agreement'])
            : null,
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to confirm agreement',
        };
      }
    } catch (e) {
      debugPrint('❌ Error confirming agreement: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  // ============ PAYMENTS ============

  /// Get payments for an agreement
  Future<List<RentalPayment>> getAgreementPayments(String agreementId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/room-rental/payments/agreement/$agreementId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> payments = data['payments'] ?? data ?? [];
        return payments.map((json) => RentalPayment.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching payments: $e');
      return [];
    }
  }

  /// Record a cash payment (host)
  Future<Map<String, dynamic>> recordCashPayment({
    required String agreementId,
    required double amount,
    required String paymentType, // DEPOSIT, MONTHLY
    String? notes,
  }) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/room-rental/payments/record-cash');

      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'agreementId': agreementId,
          'amount': amount,
          'paymentType': paymentType,
          'notes': notes,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Payment recorded',
          'payment': data['payment'] != null
            ? RentalPayment.fromJson(data['payment'])
            : null,
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to record payment',
        };
      }
    } catch (e) {
      debugPrint('❌ Error recording payment: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }
}

