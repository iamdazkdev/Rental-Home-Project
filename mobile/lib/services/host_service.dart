import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class HostService {
  // Get host profile with statistics, listings, and reviews
  Future<Map<String, dynamic>?> getHostProfile(String hostId) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.hostProfile}/$hostId');

      debugPrint('🔍 Fetching host profile for ID: $hostId');
      debugPrint('📡 Request URL: $uri');

      final response = await http.get(uri, headers: ApiConfig.headers());

      debugPrint('📥 Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        debugPrint('✅ Host profile data loaded');
        return data;
      }

      debugPrint('❌ Failed to fetch host profile: ${response.statusCode}');
      return null;
    } catch (e) {
      debugPrint('❌ Error fetching host profile: $e');
      return null;
    }
  }

  // Get host reviews
  Future<Map<String, dynamic>> getHostReviews(String hostId) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.hostReviews}/$hostId');

      debugPrint('🔍 Fetching host reviews for ID: $hostId');
      debugPrint('📡 Host reviews URL: $uri');

      final response = await http.get(uri, headers: ApiConfig.headers());

      debugPrint('📥 Host reviews response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        debugPrint('✅ Host reviews data:');
        debugPrint('   - Average rating: ${data['averageRating']}');
        debugPrint('   - Total reviews: ${data['totalReviews']}');
        debugPrint('   - Reviews count: ${(data['reviews'] as List?)?.length}');
        return data;
      }

      return {
        'averageRating': 0.0,
        'totalReviews': 0,
        'reviews': [],
      };
    } catch (e) {
      debugPrint('❌ Error fetching host reviews: $e');
      return {
        'averageRating': 0.0,
        'totalReviews': 0,
        'reviews': [],
      };
    }
  }
}

