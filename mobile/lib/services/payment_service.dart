import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'storage_service.dart';

class PaymentService {
  final StorageService _storageService = StorageService();

  /// Create VNPay payment URL
  Future<Map<String, dynamic>> createPaymentUrl({
    required Map<String, dynamic> bookingData,
    required double amount,
    String? ipAddr,
  }) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/payment/create-payment-url');

      debugPrint('💳 Creating VNPay payment URL...');
      debugPrint('Amount: ${amount.toStringAsFixed(0)} VND (no conversion)');

      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'bookingData': bookingData,
          'amount': amount, // Send VND amount directly (no conversion)
          'ipAddr': ipAddr ?? '127.0.0.1',
        }),
      );

      debugPrint('📥 Response status: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        debugPrint('✅ Payment URL created successfully');
        debugPrint('Temp Order ID: ${data['tempOrderId']}');

        return {
          'success': true,
          'paymentUrl': data['paymentUrl'],
          'bookingId': data['tempOrderId'], // Use tempOrderId as bookingId for now
          'intentId': data['intentId'],
        };
      } else {
        final error = json.decode(response.body);
        debugPrint('❌ Failed to create payment URL: ${error['message']}');
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to create payment URL',
        };
      }
    } catch (e) {
      debugPrint('❌ Error creating payment URL: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Create payment URL for remaining amount (deposit flow)
  Future<Map<String, dynamic>> createRemainingPaymentUrl({
    required String bookingId,
    required double amount,
    String? ipAddr,
  }) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/payment/create-remaining-payment-url');

      debugPrint('💳 Creating remaining payment URL...');
      debugPrint('Booking ID: $bookingId');
      debugPrint('Amount: ${amount.toStringAsFixed(0)} VND');

      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'bookingId': bookingId,
          'amount': amount,
          'ipAddr': ipAddr ?? '127.0.0.1',
        }),
      );

      debugPrint('📥 Response status: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        debugPrint('✅ Remaining payment URL created');

        return {
          'success': true,
          'paymentUrl': data['paymentUrl'],
          'orderId': data['orderId'],
        };
      } else {
        final error = json.decode(response.body);
        debugPrint('❌ Failed: ${error['message']}');
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to create payment URL',
        };
      }
    } catch (e) {
      debugPrint('❌ Error: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Confirm cash payment (for deposit flow - remaining amount)
  Future<Map<String, dynamic>> confirmCashPayment({
    required String bookingId,
  }) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/booking/$bookingId/confirm-cash-payment');

      debugPrint('💵 Confirming cash payment for booking: $bookingId');

      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('📥 Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        debugPrint('✅ Cash payment confirmed');
        return {
          'success': true,
          'message': data['message'] ?? 'Cash payment confirmed',
          'booking': data['booking'],
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to confirm cash payment',
        };
      }
    } catch (e) {
      debugPrint('❌ Error: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Get payment history for a booking
  Future<List<Map<String, dynamic>>> getPaymentHistory(String bookingId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/booking/$bookingId/payment-history');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data['paymentHistory'] ?? []);
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching payment history: $e');
      return [];
    }
  }

  /// Get client IP address
  Future<String> getClientIP() async {
    try {
      final response = await http.get(
        Uri.parse('https://api.ipify.org?format=json'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['ip'] ?? '127.0.0.1';
      }
    } catch (e) {
      debugPrint('Failed to get IP: $e');
    }
    return '127.0.0.1';
  }

  /// Calculate deposit amount (30%)
  double calculateDepositAmount(double totalAmount) {
    return totalAmount * 0.3;
  }

  /// Calculate remaining amount after deposit
  double calculateRemainingAmount(double totalAmount, double depositAmount) {
    return totalAmount - depositAmount;
  }
}

