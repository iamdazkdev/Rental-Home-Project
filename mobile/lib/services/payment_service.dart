import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'storage_service.dart';

class PaymentService {
  final StorageService _storageService = StorageService();

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

  double calculateDepositAmount(double totalAmount) {
    return totalAmount * 0.3;
  }
}

