import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/listing.dart';
import 'storage_service.dart';

class WishlistService {
  final StorageService _storageService = StorageService();

  // Toggle wishlist (add/remove)
  Future<Map<String, dynamic>> toggleWishlist(String listingId) async {
    try {
      final token = await _storageService.getToken();
      final user = await _storageService.getUser();

      if (token == null || user == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/${user.id}/$listingId/wishlist');
      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('🔍 Toggle wishlist response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'wishlist': List<String>.from(data['wishList'] ?? []),
          'message': data['message'] ?? 'Wishlist updated',
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to update wishlist',
        };
      }
    } catch (e) {
      debugPrint('❌ Error toggling wishlist: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  // Get wishlist
  Future<List<Listing>> getWishlist(String userId) async {
    try {
      final token = await _storageService.getToken();
      final uri = Uri.parse('${ApiConfig.baseUrl}/${userId}/wishlist');
      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('🔍 Get wishlist response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Listing.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching wishlist: $e');
      return [];
    }
  }
}

