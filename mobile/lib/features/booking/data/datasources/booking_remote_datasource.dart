import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:injectable/injectable.dart';

import '../../../../config/api_config.dart';
import '../../../../services/storage_service.dart';

abstract class BookingRemoteDataSource {
  Future<Map<String, dynamic>?> createBookingIntent({
    required String listingId,
    required String hostId,
    required DateTime startDate,
    required DateTime endDate,
    required double totalPrice,
    required String paymentType,
  });

  Future<String?> createVNPayPaymentUrl({
    required String tempOrderId,
    required double amount,
    required String orderInfo,
    required String returnUrl,
  });

  Future<Map<String, dynamic>?> handlePaymentCallback({
    required String tempOrderId,
    required String transactionId,
    required Map<String, dynamic> paymentData,
  });

  Future<Map<String, dynamic>?> createCashBooking({
    required String listingId,
    required String hostId,
    required DateTime startDate,
    required DateTime endDate,
    required double totalPrice,
  });

  Future<bool> cancelBookingIntent(String intentId);

  Future<Map<String, dynamic>> checkAvailability({
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    String? userId,
  });

  Future<Map<String, dynamic>?> getBookingById(String bookingId);

  Future<List<Map<String, dynamic>>> getUserTrips();

  Future<Map<String, dynamic>?> requestExtension({
    required String bookingId,
    required DateTime newEndDate,
  });

  Future<String?> initiatePayment({
    required String bookingId,
    required String paymentType,
    required double amount,
  });

  Future<Map<String, dynamic>?> checkPaymentStatus(String bookingId);
}

@LazySingleton(as: BookingRemoteDataSource)
class BookingRemoteDataSourceImpl implements BookingRemoteDataSource {
  final StorageService _storageService = StorageService();

  BookingRemoteDataSourceImpl();

  @override
  Future<Map<String, dynamic>?> createBookingIntent({
    required String listingId,
    required String hostId,
    required DateTime startDate,
    required DateTime endDate,
    required double totalPrice,
    required String paymentType,
  }) async {
    final token = await _storageService.getToken();
    final body = {
      'listingId': listingId,
      'hostId': hostId,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'totalPrice': totalPrice,
      'paymentType': paymentType,
    };

    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/entire-place-booking/create-intent'),
      headers: ApiConfig.headers(token: token),
      body: json.encode(body),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return json.decode(response.body);
    }
    
    throw Exception(_extractErrorMessage(response.body));
  }

  @override
  Future<String?> createVNPayPaymentUrl({
    required String tempOrderId,
    required double amount,
    required String orderInfo,
    required String returnUrl,
  }) async {
    final token = await _storageService.getToken();
    final body = {
      'tempOrderId': tempOrderId,
      'amount': amount,
      'orderInfo': orderInfo,
      'returnUrl': returnUrl,
    };

    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/payment/create-payment-url'),
      headers: ApiConfig.headers(token: token),
      body: json.encode(body),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = json.decode(response.body);
      return data['paymentUrl'];
    }
    
    throw Exception(_extractErrorMessage(response.body));
  }

  @override
  Future<Map<String, dynamic>?> handlePaymentCallback({
    required String tempOrderId,
    required String transactionId,
    required Map<String, dynamic> paymentData,
  }) async {
    final token = await _storageService.getToken();
    final body = {
      'tempOrderId': tempOrderId,
      'transactionId': transactionId,
      'paymentData': paymentData,
    };

    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/entire-place-booking/create-from-payment'),
      headers: ApiConfig.headers(token: token),
      body: json.encode(body),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = json.decode(response.body);
      return data['booking'] ?? data;
    }
    
    throw Exception(_extractErrorMessage(response.body));
  }

  @override
  Future<Map<String, dynamic>?> createCashBooking({
    required String listingId,
    required String hostId,
    required DateTime startDate,
    required DateTime endDate,
    required double totalPrice,
  }) async {
    final token = await _storageService.getToken();
    final body = {
      'listingId': listingId,
      'hostId': hostId,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'totalPrice': totalPrice,
    };

    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/entire-place-booking/create-cash'),
      headers: ApiConfig.headers(token: token),
      body: json.encode(body),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = json.decode(response.body);
      return data['booking'] ?? data;
    }
    
    throw Exception(_extractErrorMessage(response.body));
  }

  @override
  Future<bool> cancelBookingIntent(String intentId) async {
    final token = await _storageService.getToken();
    final response = await http.put(
      Uri.parse('${ApiConfig.baseUrl}/booking-intent/$intentId/cancel'),
      headers: ApiConfig.headers(token: token),
    );
    return response.statusCode == 200;
  }

  @override
  Future<Map<String, dynamic>> checkAvailability({
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    String? userId,
  }) async {
    final token = await _storageService.getToken();
    final queryParams = {
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      if (userId != null) 'userId': userId,
    };

    final uri = Uri.parse('${ApiConfig.baseUrl}/booking-intent/check-availability/$listingId')
        .replace(queryParameters: queryParams);

    final response = await http.get(uri, headers: ApiConfig.headers(token: token));

    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    return {'available': false, 'message': 'Failed to check availability'};
  }

  @override
  Future<Map<String, dynamic>?> getBookingById(String bookingId) async {
    final token = await _storageService.getToken();
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/booking/$bookingId'),
      headers: ApiConfig.headers(token: token),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['booking'] ?? data;
    }
    return null;
  }

  @override
  Future<List<Map<String, dynamic>>> getUserTrips() async {
    final token = await _storageService.getToken();
    final userId = await _storageService.getUserId();
    if (userId == null) return [];

    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/user/$userId/trips'),
      headers: ApiConfig.headers(token: token),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final trips = (data['trips'] ?? data['bookings'] ?? []) as List;
      return trips.cast<Map<String, dynamic>>();
    }
    return [];
  }

  @override
  Future<Map<String, dynamic>?> requestExtension({
    required String bookingId,
    required DateTime newEndDate,
  }) async {
    final token = await _storageService.getToken();
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/booking/extend'),
      headers: ApiConfig.headers(token: token),
      body: json.encode({
        'bookingId': bookingId,
        'newEndDate': newEndDate.toIso8601String(),
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    }
    throw Exception(_extractErrorMessage(response.body));
  }

  @override
  Future<String?> initiatePayment({
    required String bookingId,
    required String paymentType,
    required double amount,
  }) async {
    final token = await _storageService.getToken();
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/payment/create-payment-url'),
      headers: ApiConfig.headers(token: token),
      body: json.encode({
        'bookingId': bookingId,
        'amount': amount,
        'paymentType': paymentType,
      }),
    );
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['paymentUrl'];
    }
    return null;
  }

  @override
  Future<Map<String, dynamic>?> checkPaymentStatus(String bookingId) async {
    final token = await _storageService.getToken();
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/booking/$bookingId/payment-status'),
      headers: ApiConfig.headers(token: token),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    return null;
  }

  String _extractErrorMessage(String responseBody) {
    try {
      final errorData = json.decode(responseBody);
      return errorData['message'] ?? errorData['error'] ?? 'Unknown error';
    } catch (_) {
      return 'Server error';
    }
  }
}
