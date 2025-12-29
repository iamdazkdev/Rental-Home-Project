import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'storage_service.dart';

/// Identity Verification Status enum
enum VerificationStatus {
  pending('pending'),
  approved('approved'),
  rejected('rejected');

  final String value;
  const VerificationStatus(this.value);

  static VerificationStatus fromString(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return VerificationStatus.pending;
      case 'approved':
        return VerificationStatus.approved;
      case 'rejected':
        return VerificationStatus.rejected;
      default:
        return VerificationStatus.pending;
    }
  }
}

/// Identity Verification model
class IdentityVerification {
  final String id;
  final String userId;
  final String fullName;
  final String phoneNumber;
  final DateTime dateOfBirth;
  final String? idCardFront;
  final String? idCardBack;
  final VerificationStatus status;
  final String? rejectionReason;
  final DateTime? reviewedAt;
  final String? reviewedBy;
  final DateTime createdAt;
  final DateTime? updatedAt;

  IdentityVerification({
    required this.id,
    required this.userId,
    required this.fullName,
    required this.phoneNumber,
    required this.dateOfBirth,
    this.idCardFront,
    this.idCardBack,
    required this.status,
    this.rejectionReason,
    this.reviewedAt,
    this.reviewedBy,
    required this.createdAt,
    this.updatedAt,
  });

  factory IdentityVerification.fromJson(Map<String, dynamic> json) {
    return IdentityVerification(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] is Map ? json['userId']['_id'] : (json['userId'] ?? ''),
      fullName: json['fullName'] ?? '',
      phoneNumber: json['phoneNumber'] ?? '',
      dateOfBirth: json['dateOfBirth'] != null
        ? DateTime.parse(json['dateOfBirth'])
        : DateTime.now(),
      idCardFront: json['idCardFront'],
      idCardBack: json['idCardBack'],
      status: VerificationStatus.fromString(json['status']),
      rejectionReason: json['rejectionReason'],
      reviewedAt: json['reviewedAt'] != null
        ? DateTime.parse(json['reviewedAt'])
        : null,
      reviewedBy: json['reviewedBy'],
      createdAt: json['createdAt'] != null
        ? DateTime.parse(json['createdAt'])
        : DateTime.now(),
      updatedAt: json['updatedAt'] != null
        ? DateTime.parse(json['updatedAt'])
        : null,
    );
  }

  bool get isPending => status == VerificationStatus.pending;
  bool get isApproved => status == VerificationStatus.approved;
  bool get isRejected => status == VerificationStatus.rejected;
}

/// Service for Identity Verification operations
/// Required for Room Rental and Roommate features
class IdentityVerificationService {
  final StorageService _storageService = StorageService();

  /// Check verification status for a user
  Future<Map<String, dynamic>> checkStatus(String userId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/identity-verification/$userId/status');

      debugPrint('🔍 Checking verification status for user: $userId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('📥 Verification status response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'exists': data['exists'] ?? false,
          'status': data['status'],
          'verification': data['verification'] != null
            ? IdentityVerification.fromJson(data['verification'])
            : null,
        };
      } else if (response.statusCode == 404) {
        return {
          'success': true,
          'exists': false,
          'status': null,
          'verification': null,
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to check verification status',
        };
      }
    } catch (e) {
      debugPrint('❌ Error checking verification status: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
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
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/identity-verification/submit');

      debugPrint('📤 Submitting identity verification for user: $userId');

      // Create multipart request
      final request = http.MultipartRequest('POST', uri);
      request.headers.addAll({
        'Authorization': 'Bearer $token',
      });

      // Add fields
      request.fields['userId'] = userId;
      request.fields['fullName'] = fullName;
      request.fields['phoneNumber'] = phoneNumber;
      request.fields['dateOfBirth'] = dateOfBirth.toIso8601String();

      // Add ID card images
      request.files.add(await http.MultipartFile.fromPath(
        'idCardFront',
        idCardFront.path,
      ));
      request.files.add(await http.MultipartFile.fromPath(
        'idCardBack',
        idCardBack.path,
      ));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      debugPrint('📥 Submit response: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Verification submitted successfully',
          'verification': data['verification'] != null
            ? IdentityVerification.fromJson(data['verification'])
            : null,
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

  /// Update verification (for rejected status)
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
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/identity-verification/$verificationId/update');

      debugPrint('📤 Updating identity verification: $verificationId');

      // Create multipart request
      final request = http.MultipartRequest('PUT', uri);
      request.headers.addAll({
        'Authorization': 'Bearer $token',
      });

      // Add fields
      request.fields['fullName'] = fullName;
      request.fields['phoneNumber'] = phoneNumber;
      request.fields['dateOfBirth'] = dateOfBirth.toIso8601String();

      // Add ID card images if provided
      if (idCardFront != null) {
        request.files.add(await http.MultipartFile.fromPath(
          'idCardFront',
          idCardFront.path,
        ));
      }
      if (idCardBack != null) {
        request.files.add(await http.MultipartFile.fromPath(
          'idCardBack',
          idCardBack.path,
        ));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      debugPrint('📥 Update response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Verification updated successfully',
          'verification': data['verification'] != null
            ? IdentityVerification.fromJson(data['verification'])
            : null,
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

  /// Get verification details
  Future<IdentityVerification?> getVerification(String userId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/identity-verification/$userId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return IdentityVerification.fromJson(data['verification'] ?? data);
      }
      return null;
    } catch (e) {
      debugPrint('❌ Error fetching verification: $e');
      return null;
    }
  }

  /// Check if user needs verification for a specific listing type
  bool requiresVerification(String listingType) {
    // Room and Shared Room require identity verification
    final typeLower = listingType.toLowerCase();
    return typeLower.contains('room') ||
           typeLower.contains('shared') ||
           typeLower == 'rooms';
  }
}

