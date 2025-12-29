import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/roommate.dart';
import 'storage_service.dart';

/// Service for Roommate operations
/// Synced with backend /roommate routes
class RoommateService {
  final StorageService _storageService = StorageService();

  // ============ POSTS ============

  /// Search roommate posts
  Future<List<RoommatePost>> searchPosts({
    String? city,
    String? postType, // SEEKER, PROVIDER
    double? budgetMin,
    double? budgetMax,
    String? genderPreference,
  }) async {
    try {
      final token = await _storageService.getToken();

      final queryParams = <String, String>{};
      if (city != null) queryParams['city'] = city;
      if (postType != null) queryParams['postType'] = postType;
      if (budgetMin != null) queryParams['budgetMin'] = budgetMin.toString();
      if (budgetMax != null) queryParams['budgetMax'] = budgetMax.toString();
      if (genderPreference != null) queryParams['genderPreference'] = genderPreference;

      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/posts')
        .replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);

      debugPrint('🔍 Searching roommate posts: $uri');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> posts = data['posts'] ?? data ?? [];
        return posts.map((json) => RoommatePost.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error searching posts: $e');
      return [];
    }
  }

  /// Get post detail by ID
  Future<RoommatePost?> getPostDetail(String postId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/posts/$postId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return RoommatePost.fromJson(data['post'] ?? data);
      }
      return null;
    } catch (e) {
      debugPrint('❌ Error fetching post detail: $e');
      return null;
    }
  }

  /// Create a new roommate post
  Future<Map<String, dynamic>> createPost({
    required String userId,
    required String postType,
    required String title,
    required String description,
    required String city,
    required String province,
    required String country,
    required double budgetMin,
    required double budgetMax,
    required DateTime moveInDate,
    String? genderPreference,
    int? ageRangeMin,
    int? ageRangeMax,
    Map<String, String>? lifestyle,
    String? preferredContact,
    String? phoneNumber,
    String? emailAddress,
    List<String>? photos,
  }) async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/posts');

      debugPrint('📝 Creating roommate post: $title');

      final body = {
        'userId': userId,
        'postType': postType,
        'title': title,
        'description': description,
        'city': city,
        'province': province,
        'country': country,
        'budgetMin': budgetMin,
        'budgetMax': budgetMax,
        'moveInDate': moveInDate.toIso8601String(),
        'genderPreference': genderPreference ?? 'ANY',
        'ageRangeMin': ageRangeMin,
        'ageRangeMax': ageRangeMax,
        'lifestyle': lifestyle,
        'preferredContact': preferredContact ?? 'CHAT',
        'phoneNumber': phoneNumber,
        'emailAddress': emailAddress,
        'photos': photos ?? [],
      };

      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode(body),
      );

      debugPrint('📥 Create post response: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Post created successfully',
          'post': data['post'] != null
            ? RoommatePost.fromJson(data['post'])
            : null,
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to create post',
        };
      }
    } catch (e) {
      debugPrint('❌ Error creating post: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Get user's own posts
  Future<List<RoommatePost>> getMyPosts(String userId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/posts/user/$userId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> posts = data['posts'] ?? data ?? [];
        return posts.map((json) => RoommatePost.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching my posts: $e');
      return [];
    }
  }

  /// Update a post
  Future<Map<String, dynamic>> updatePost(String postId, Map<String, dynamic> updates) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/posts/$postId');

      final response = await http.put(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode(updates),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Post updated',
          'post': data['post'] != null
            ? RoommatePost.fromJson(data['post'])
            : null,
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to update post',
        };
      }
    } catch (e) {
      debugPrint('❌ Error updating post: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Close a post
  Future<Map<String, dynamic>> closePost(String postId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/posts/$postId/close');

      final response = await http.put(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Post closed',
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to close post',
        };
      }
    } catch (e) {
      debugPrint('❌ Error closing post: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  // ============ REQUESTS ============

  /// Send a roommate request
  Future<Map<String, dynamic>> sendRequest({
    required String postId,
    required String senderId,
    required String receiverId,
    required String message,
  }) async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/requests');

      debugPrint('📤 Sending roommate request to post: $postId');

      final body = {
        'postId': postId,
        'senderId': senderId,
        'receiverId': receiverId,
        'message': message,
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
          'message': data['message'] ?? 'Request sent successfully',
          'request': data['request'] != null
            ? RoommateRequest.fromJson(data['request'])
            : null,
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to send request',
        };
      }
    } catch (e) {
      debugPrint('❌ Error sending request: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Get received requests
  Future<List<RoommateRequest>> getReceivedRequests(String userId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/requests/received/$userId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> requests = data['requests'] ?? data ?? [];
        return requests.map((json) => RoommateRequest.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching received requests: $e');
      return [];
    }
  }

  /// Get sent requests
  Future<List<RoommateRequest>> getSentRequests(String userId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/requests/sent/$userId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> requests = data['requests'] ?? data ?? [];
        return requests.map((json) => RoommateRequest.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching sent requests: $e');
      return [];
    }
  }

  /// Accept a request
  Future<Map<String, dynamic>> acceptRequest(String requestId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/requests/$requestId/accept');

      debugPrint('✅ Accepting request: $requestId');

      final response = await http.put(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Request accepted',
          'match': data['match'] != null
            ? RoommateMatch.fromJson(data['match'])
            : null,
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to accept request',
        };
      }
    } catch (e) {
      debugPrint('❌ Error accepting request: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  /// Reject a request
  Future<Map<String, dynamic>> rejectRequest(String requestId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/requests/$requestId/reject');

      final response = await http.put(
        uri,
        headers: ApiConfig.headers(token: token),
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

  // ============ MATCHES ============

  /// Get user's matches
  Future<List<RoommateMatch>> getMyMatches(String userId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/matches/$userId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> matches = data['matches'] ?? data ?? [];
        return matches.map((json) => RoommateMatch.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching matches: $e');
      return [];
    }
  }
}

