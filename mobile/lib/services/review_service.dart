import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/review.dart';
import 'storage_service.dart';

class ReviewService {
  final StorageService _storageService = StorageService();

  // Get listing reviews
  Future<List<Review>> getListingReviews(String listingId) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.listingReviews}/$listingId');
      final response = await http.get(uri, headers: ApiConfig.headers());

      debugPrint('🔍 Get listing reviews URL: $uri');
      debugPrint('📥 Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final dynamic decoded = json.decode(response.body);

        // Handle different response formats
        List<dynamic> reviewsData;

        if (decoded is List) {
          // Response is directly an array
          reviewsData = decoded;
        } else if (decoded is Map) {
          // Response is an object, try to get reviews array
          reviewsData = decoded['reviews'] ?? decoded['data'] ?? [];
        } else {
          debugPrint('⚠️ Unexpected response format');
          return [];
        }

        debugPrint('✅ Found ${reviewsData.length} reviews');
        return reviewsData.map((json) => Review.fromJson(json)).toList();
      }

      debugPrint('❌ Failed to fetch reviews: ${response.statusCode}');
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching listing reviews: $e');
      return [];
    }
  }

  // Create review
  Future<Map<String, dynamic>> createReview({
    required String bookingId,
    String? homeReview,
    double? homeRating,
    String? hostReview,
    double? hostRating,
  }) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.reviews}/create');
      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'bookingId': bookingId,
          if (homeReview != null) 'homeReview': homeReview,
          if (homeRating != null) 'homeRating': homeRating,
          if (hostReview != null) 'hostReview': hostReview,
          if (hostRating != null) 'hostRating': hostRating,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': 'Review submitted successfully',
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to submit review',
        };
      }
    } catch (e) {
      debugPrint('❌ Error creating review: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }
}

