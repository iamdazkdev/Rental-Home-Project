import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../../config/api_config.dart';
import '../../../../services/storage_service.dart';
import '../models/roommate_model.dart';


class RoommateRemoteDataSource {
  final StorageService _storageService = StorageService();

  Future<List<RoommateModel>> searchPosts({
    String? type,
    String? city,
    String? district,
    double? minBudget,
    double? maxBudget,
    String? genderPreference,
  }) async {
    final token = await _storageService.getToken();
    final queryParams = <String, String>{};
    if (city != null && city.isNotEmpty) queryParams['city'] = city;
    if (type != null && type.isNotEmpty) queryParams['postType'] = type;
    if (minBudget != null) queryParams['budgetMin'] = minBudget.toString();
    if (maxBudget != null) queryParams['budgetMax'] = maxBudget.toString();
    if (genderPreference != null && genderPreference.isNotEmpty) {
      queryParams['genderPreference'] = genderPreference;
    }

    final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/posts/search')
        .replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);

    final response = await http.get(uri, headers: ApiConfig.headers(token: token));

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        final List<dynamic> posts = data['posts'] ?? [];
        return posts.map((json) => RoommateModel.fromJson(json)).toList();
      }
    }
    return [];
  }

  Future<RoommateModel?> getPostDetails(String postId) async {
    final token = await _storageService.getToken();
    final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/posts/$postId');
    final response = await http.get(uri, headers: ApiConfig.headers(token: token));

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return RoommateModel.fromJson(data['post'] ?? data);
    }
    return null;
  }

  Future<List<RoommateModel>> getUserPosts(String userId) async {
    final token = await _storageService.getToken();
    final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/posts/user/$userId');
    final response = await http.get(uri, headers: ApiConfig.headers(token: token));

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List<dynamic> posts = data['posts'] ?? data ?? [];
      return posts.map((json) => RoommateModel.fromJson(json)).toList();
    }
    return [];
  }

  Future<Map<String, dynamic>> createPost(Map<String, dynamic> postData, List<String> imagePaths) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) return {'success': false, 'message': 'Not authenticated'};

      // Multi-part logic here if images are involved, or just direct upload depending on backend API structure
      // Wait, original roommate service just passes photo paths if pre-uploaded.
      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/posts');
      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode(postData),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Post created successfully',
          'post': data['post'] != null ? RoommateModel.fromJson(data['post']) : null,
        };
      }
      final error = json.decode(response.body);
      return {'success': false, 'message': error['message'] ?? 'Failed to create post'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> updatePost(String postId, Map<String, dynamic> postData, List<String>? newImagePaths) async {
    try {
      final token = await _storageService.getToken();
      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/posts/$postId');

      final response = await http.put(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode(postData),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Post updated',
          'post': data['post'] != null ? RoommateModel.fromJson(data['post']) : null,
        };
      }
      final error = json.decode(response.body);
      return {'success': false, 'message': error['message'] ?? 'Failed to update post'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> deletePost(String postId) async {
    // Legacy system uses /close to soft delete
    try {
      final token = await _storageService.getToken();
      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/posts/$postId/close');
      final response = await http.put(uri, headers: ApiConfig.headers(token: token));

      if (response.statusCode == 200) {
        return {'success': true, 'message': 'Post closed successfully'};
      }
      return {'success': false, 'message': 'Failed to close post'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> togglePostStatus(String postId, String newStatus) async {
    try {
      final token = await _storageService.getToken();
      final action = newStatus.toUpperCase() == 'ACTIVE' ? 'activate' : 'close';
      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/posts/$postId/$action');
      final response = await http.put(uri, headers: ApiConfig.headers(token: token));

      if (response.statusCode == 200) {
        return {'success': true, 'message': 'Status updated'};
      }
      return {'success': false, 'message': 'Failed to update status'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> matchPost(String postId, String matchedUserId) async {
    return {'success': true, 'message': 'Unimplemented in legacy mock layer'};
  }

  Future<Map<String, dynamic>> sendRequest({
    required String postId,
    required String senderId,
    required String receiverId,
    required String message,
  }) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) return {'success': false, 'message': 'Not authenticated'};

      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/requests');
      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'postId': postId,
          'senderId': senderId,
          'receiverId': receiverId,
          'message': message,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Request sent successfully',
          'request': data['request'] != null ? RoommateRequestModel.fromJson(data['request']) : null,
        };
      }
      final error = json.decode(response.body);
      return {'success': false, 'message': error['message'] ?? 'Failed to send request'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<List<RoommateRequestModel>> getMyRequests(String userId) async {
    final token = await _storageService.getToken();
    final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/requests/user/$userId');
    final response = await http.get(uri, headers: ApiConfig.headers(token: token));

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List<dynamic> requests = data['requests'] ?? [];
      return requests.map((json) => RoommateRequestModel.fromJson(json)).toList();
    }
    return [];
  }

  Future<Map<String, dynamic>> respondToRequest(String requestId, String status) async {
    try {
      final token = await _storageService.getToken();
      final uri = Uri.parse('${ApiConfig.baseUrl}/roommate/requests/$requestId/respond');
      final response = await http.put(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({'status': status}),
      );

      if (response.statusCode == 200) {
        return {'success': true, 'message': 'Request updated successfully'};
      }
      return {'success': false, 'message': 'Failed to update request'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
}
