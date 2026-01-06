import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'storage_service.dart';

class UserService {
  final StorageService _storageService = StorageService();

  // Update user profile
  Future<Map<String, dynamic>> updateProfile({
    required String userId,
    required String firstName,
    required String lastName,
    required String email,
    File? profileImage,
  }) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/user/$userId/profile');

      debugPrint('📤 Updating profile for user: $userId');

      var request = http.MultipartRequest('PATCH', uri);
      request.headers.addAll({
        'Authorization': 'Bearer $token',
      });

      // Add text fields
      request.fields['firstName'] = firstName;
      request.fields['lastName'] = lastName;
      request.fields['email'] = email;

      // Add profile image if selected
      if (profileImage != null) {
        debugPrint('📷 Adding profile image: ${profileImage.path}');
        request.files.add(
          await http.MultipartFile.fromPath(
            'profileImage',
            profileImage.path,
          ),
        );
      }

      final response = await request.send();
      final responseBody = await response.stream.bytesToString();

      debugPrint('📥 Update profile response: ${response.statusCode}');

      if (response.statusCode == 200) {
        debugPrint('✅ Profile updated successfully');
        return {
          'success': true,
          'message': 'Profile updated successfully',
        };
      } else {
        final data = json.decode(responseBody);
        debugPrint('❌ Failed to update profile: ${data['message']}');
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to update profile',
        };
      }
    } catch (e) {
      debugPrint('❌ Error updating profile: $e');
      return {
        'success': false,
        'message': 'An error occurred while updating profile',
      };
    }
  }
}

