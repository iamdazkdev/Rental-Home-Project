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

      // PATCH /user/:userId/wishlist/:listingId
      final uri =
          Uri.parse('${ApiConfig.baseUrl}/user/${user.id}/wishlist/$listingId');
      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('🔍 Toggle wishlist URL: $uri');
      debugPrint('📥 Toggle wishlist response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'wishlist': List<String>.from(data['wishList'] ?? []),
          'message': data['message'] ?? 'Wishlist updated',
        };
      } else {
        final error = json.decode(response.body);
        debugPrint('❌ Wishlist error: ${error['message']}');
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to update wishlist',
        };
      }
    } catch (e) {
      debugPrint('❌ Error toggling wishlist: $e');
      return {
        'success': false,
        'message': 'An error occurred: $e',
      };
    }
  }

  // Get wishlist - GET /user/:userId/trips returns bookings, need to check backend for wishlist endpoint
  Future<List<Listing>> getWishlist(String userId) async {
    try {
      final token = await _storageService.getToken();
      final user = await _storageService.getUser();

      if (user == null) return [];

      // Get user's wishlist IDs from their profile
      // Backend doesn't have separate wishlist GET endpoint, wishlist is part of user object
      // We'll need to get listings and filter by user's wishList array
      final listingsUri =
          Uri.parse('${ApiConfig.baseUrl}${ApiConfig.listings}');
      final response = await http.get(
        listingsUri,
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('🔍 Get wishlist - fetching all listings');
      debugPrint('📥 Response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        // Filter listings that are in user's wishlist
        final wishlistListings = data
            .map((json) => Listing.fromJson(json))
            .where((listing) => user.wishlist.contains(listing.id))
            .toList();
        debugPrint('✅ Found ${wishlistListings.length} wishlist items');
        return wishlistListings;
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching wishlist: $e');
      return [];
    }
  }
}
