import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../config/api_config.dart';
import 'storage_service.dart';

class IdentityVerificationService {
  final StorageService _storageService = StorageService();

  /// Get verification status for a user
  Future<Map<String, dynamic>> getVerificationStatus(String userId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/identity-verification/$userId/status');

      debugPrint('📋 Checking verification status for user: $userId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('📥 Verification status response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'exists': data['exists'] ?? false,
          'status': data['status'],
          'verification': data['verification'],
        };
      } else if (response.statusCode == 404) {
        return {
          'exists': false,
          'status': null,
          'verification': null,
        };
      }

      return {
        'exists': false,
        'status': null,
        'verification': null,
      };
    } catch (e) {
      debugPrint('❌ Error checking verification status: $e');
      return {
        'exists': false,
        'status': null,
        'verification': null,
      };
    }
  }

  /// Submit identity verification
  Future<Map<String, dynamic>> submitVerification({
    required String userId,
    required String fullName,
    required String phoneNumber,
    required DateTime dateOfBirth,
    required File idCardFront,
    required File idCardBack,
  }) async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return {
          'success': false,
          'message': 'Not authenticated',
        };
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/identity-verification/submit');

      debugPrint('📤 Submitting identity verification for user: $userId');

      var request = http.MultipartRequest('POST', uri);

      // Add headers
      request.headers.addAll({
        'Authorization': 'Bearer $token',
      });

      // Add fields
      request.fields['userId'] = userId;
      request.fields['fullName'] = fullName;
      request.fields['phoneNumber'] = phoneNumber;
      request.fields['dateOfBirth'] = dateOfBirth.toIso8601String().split('T')[0];

      // Add files
      debugPrint('📸 Uploading ID card front...');
      request.files.add(
        await http.MultipartFile.fromPath(
          'idCardFront',
          idCardFront.path,
          contentType: MediaType('image', 'jpeg'),
        ),
      );

      debugPrint('📸 Uploading ID card back...');
      request.files.add(
        await http.MultipartFile.fromPath(
          'idCardBack',
          idCardBack.path,
          contentType: MediaType('image', 'jpeg'),
        ),
      );

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      debugPrint('📥 Submit verification response: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Verification submitted successfully',
          'verification': data['verification'],
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to submit verification',
        };
      }
    } catch (e) {
      debugPrint('❌ Error submitting verification: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Update existing verification (for rejected cases)
  Future<Map<String, dynamic>> updateVerification({
    required String verificationId,
    required String fullName,
    required String phoneNumber,
    required DateTime dateOfBirth,
    File? idCardFront,
    File? idCardBack,
  }) async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return {
          'success': false,
          'message': 'Not authenticated',
        };
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/identity-verification/$verificationId/update');

      var request = http.MultipartRequest('PUT', uri);

      request.headers.addAll({
        'Authorization': 'Bearer $token',
      });

      request.fields['fullName'] = fullName;
      request.fields['phoneNumber'] = phoneNumber;
      request.fields['dateOfBirth'] = dateOfBirth.toIso8601String().split('T')[0];

      if (idCardFront != null) {
        request.files.add(
          await http.MultipartFile.fromPath(
            'idCardFront',
            idCardFront.path,
            contentType: MediaType('image', 'jpeg'),
          ),
        );
      }

      if (idCardBack != null) {
        request.files.add(
          await http.MultipartFile.fromPath(
            'idCardBack',
            idCardBack.path,
            contentType: MediaType('image', 'jpeg'),
          ),
        );
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Verification updated successfully',
          'verification': data['verification'],
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to update verification',
        };
      }
    } catch (e) {
      debugPrint('❌ Error updating verification: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Alias for getVerificationStatus (backward compatibility)
  Future<Map<String, dynamic>> checkStatus(String userId) {
    return getVerificationStatus(userId);
  }
}

