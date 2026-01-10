import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/review.dart';
import 'storage_service.dart';

class ReviewService {
  final StorageService _storageService = StorageService();

  // Get reviews for a listing (simple version - returns list)
  Future<List<Review>> getListingReviews(String listingId) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/reviews/listing/$listingId');

      debugPrint('🔍 Fetching reviews for listing: $listingId');

      final response = await http.get(uri, headers: ApiConfig.headers());

      debugPrint('📥 Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> reviews = data['reviews'] ?? [];
        debugPrint('✅ Fetched ${reviews.length} reviews');
        return reviews.map((json) => Review.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching listing reviews: $e');
      return [];
    }
  }

  // Get reviews with stats and pagination
  Future<Map<String, dynamic>> getListingReviewsWithStats(
    String listingId, {
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final uri = Uri.parse(
        '${ApiConfig.baseUrl}/reviews/listing/$listingId?page=$page&limit=$limit',
      );

      debugPrint('🔍 Fetching reviews with stats for listing: $listingId');

      final response = await http.get(uri, headers: ApiConfig.headers());

      debugPrint('📥 Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        debugPrint('✅ Fetched reviews with stats');
        return data;
      }
      return {
        'reviews': [],
        'stats': {'averageRating': 0.0, 'totalReviews': 0},
        'pagination': {'page': 1, 'pages': 1},
      };
    } catch (e) {
      debugPrint('❌ Error fetching listing reviews with stats: $e');
      return {
        'reviews': [],
        'stats': {'averageRating': 0.0, 'totalReviews': 0},
        'pagination': {'page': 1, 'pages': 1},
      };
    }
  }

  // Get reviews by a user (as reviewer)
  Future<List<Review>> getUserReviews(String userId) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/reviews/user/$userId');

      debugPrint('🔍 Fetching reviews by user: $userId');

      final response = await http.get(uri, headers: ApiConfig.headers());

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        debugPrint('✅ Fetched ${data.length} user reviews');
        return data.map((json) => Review.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching user reviews: $e');
      return [];
    }
  }

  // Create a review
  Future<Map<String, dynamic>> createReview({
    required String bookingId,
    required String listingId,
    required int rating,
    required String comment,
  }) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/reviews/create');

      debugPrint('📝 Creating review for booking: $bookingId');

      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'bookingId': bookingId,
          'listingId': listingId,
          'rating': rating,
          'comment': comment,
        }),
      );

      debugPrint('📥 Response: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        debugPrint('✅ Review created successfully');
        return {
          'success': true,
          'message': 'Review submitted successfully',
          'review': data,
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to create review',
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

  // Update a review
  Future<Map<String, dynamic>> updateReview({
    required String reviewId,
    required int rating,
    required String comment,
  }) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/reviews/$reviewId');

      debugPrint('📝 Updating review: $reviewId');

      final response = await http.put(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'rating': rating,
          'comment': comment,
        }),
      );

      if (response.statusCode == 200) {
        debugPrint('✅ Review updated successfully');
        return {
          'success': true,
          'message': 'Review updated successfully',
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to update review',
        };
      }
    } catch (e) {
      debugPrint('❌ Error updating review: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  // Delete a review
  Future<Map<String, dynamic>> deleteReview(String reviewId) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/reviews/$reviewId');

      debugPrint('🗑️ Deleting review: $reviewId');

      final response = await http.delete(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200 || response.statusCode == 204) {
        debugPrint('✅ Review deleted successfully');
        return {
          'success': true,
          'message': 'Review deleted successfully',
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to delete review',
        };
      }
    } catch (e) {
      debugPrint('❌ Error deleting review: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  // Check if user can review a booking
  Future<bool> canReviewBooking(String bookingId) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) return false;

      final uri =
          Uri.parse('${ApiConfig.baseUrl}/reviews/can-review/$bookingId');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['canReview'] ?? false;
      }
      return false;
    } catch (e) {
      debugPrint('❌ Error checking review eligibility: $e');
      return false;
    }
  }

  // Get host reviews
  Future<Map<String, dynamic>> getHostReviews(String hostId) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/host-reviews/host/$hostId');

      debugPrint('🔍 Fetching host reviews: $hostId');

      final response = await http.get(uri, headers: ApiConfig.headers());

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        debugPrint('✅ Host reviews fetched');
        return {
          'success': true,
          'averageRating': data['averageRating'] ?? 0.0,
          'totalReviews': data['totalReviews'] ?? 0,
          'reviews': (data['reviews'] as List?)
                  ?.map((json) => Review.fromJson(json))
                  .toList() ??
              [],
        };
      }
      return {
        'success': false,
        'averageRating': 0.0,
        'totalReviews': 0,
        'reviews': <Review>[],
      };
    } catch (e) {
      debugPrint('❌ Error fetching host reviews: $e');
      return {
        'success': false,
        'averageRating': 0.0,
        'totalReviews': 0,
        'reviews': <Review>[],
      };
    }
  }

  // Submit review with listing and host ratings
  Future<bool> submitReview({
    required String bookingId,
    required String reviewerId,
    required int listingRating,
    required String listingComment,
    required int hostRating,
    required String hostComment,
  }) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        debugPrint('❌ No authentication token');
        return false;
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}/reviews/create');

      debugPrint('📝 Submitting review for booking: $bookingId');

      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'bookingId': bookingId,
          'reviewerId': reviewerId,
          'listingRating': listingRating,
          'listingComment': listingComment,
          'hostRating': hostRating,
          'hostComment': hostComment,
        }),
      );

      debugPrint('📥 Submit review response: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint('✅ Review submitted successfully');
        return true;
      } else {
        final error = json.decode(response.body);
        debugPrint('❌ Failed to submit review: ${error['message']}');
        return false;
      }
    } catch (e) {
      debugPrint('❌ Error submitting review: $e');
      return false;
    }
  }
}
