import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../../config/api_config.dart';
import '../../models/review.dart';
import '../../services/storage_service.dart';

class ReviewRepository {
  final StorageService _storageService = StorageService();

  /// Get all reviews for a listing
  Future<List<ReviewModel>> getListingReviews(String listingId) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/reviews/listing/$listingId');

      debugPrint('📋 Fetching reviews for listing: $listingId');
      debugPrint('📡 URL: $uri');

      final response = await http.get(uri, headers: ApiConfig.headers());

      debugPrint('📥 Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final reviews = data['reviews'] as List;
        debugPrint('✅ Reviews fetched: ${reviews.length}');
        return reviews.map((json) => ReviewModel.fromJson(json)).toList();
      }

      debugPrint('❌ Failed to fetch reviews: ${response.statusCode}');
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching reviews: $e');
      return [];
    }
  }

  /// Get review summary for a listing
  Future<ReviewSummary?> getListingReviewSummary(String listingId) async {
    try {
      final uri =
          Uri.parse('${ApiConfig.baseUrl}/reviews/listing/$listingId/summary');

      debugPrint('📊 Fetching review summary for listing: $listingId');

      final response = await http.get(uri, headers: ApiConfig.headers());

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        debugPrint('✅ Review summary fetched');
        return ReviewSummary.fromJson(data);
      }

      return null;
    } catch (e) {
      debugPrint('❌ Error fetching review summary: $e');
      return null;
    }
  }

  /// Submit a new review
  Future<ReviewModel?> submitReview({
    required String bookingId,
    required String listingId,
    required int rating,
    required String comment,
  }) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/reviews');

      debugPrint('📝 Submitting review for booking: $bookingId');
      debugPrint('⭐ Rating: $rating');

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

      debugPrint('📥 Response status: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        debugPrint('✅ Review submitted successfully');
        return ReviewModel.fromJson(data['review'] ?? data);
      }

      debugPrint('❌ Failed to submit review: ${response.statusCode}');
      debugPrint('❌ Error: ${response.body}');
      return null;
    } catch (e) {
      debugPrint('❌ Error submitting review: $e');
      return null;
    }
  }

  /// Update an existing review
  Future<ReviewModel?> updateReview({
    required String reviewId,
    required int rating,
    required String comment,
  }) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/reviews/$reviewId');

      debugPrint('✏️ Updating review: $reviewId');

      final response = await http.put(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'rating': rating,
          'comment': comment,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        debugPrint('✅ Review updated successfully');
        return ReviewModel.fromJson(data['review'] ?? data);
      }

      debugPrint('❌ Failed to update review: ${response.statusCode}');
      return null;
    } catch (e) {
      debugPrint('❌ Error updating review: $e');
      return null;
    }
  }

  /// Delete a review
  Future<bool> deleteReview(String reviewId) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/reviews/$reviewId');

      debugPrint('🗑️ Deleting review: $reviewId');

      final response = await http.delete(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        debugPrint('✅ Review deleted successfully');
        return true;
      }

      debugPrint('❌ Failed to delete review: ${response.statusCode}');
      return false;
    } catch (e) {
      debugPrint('❌ Error deleting review: $e');
      return false;
    }
  }

  /// Host responds to a review
  Future<ReviewModel?> respondToReview({
    required String reviewId,
    required String response,
  }) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/reviews/$reviewId/respond');

      debugPrint('💬 Responding to review: $reviewId');

      final httpResponse = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({'response': response}),
      );

      if (httpResponse.statusCode == 200) {
        final data = json.decode(httpResponse.body);
        debugPrint('✅ Response added successfully');
        return ReviewModel.fromJson(data['review'] ?? data);
      }

      debugPrint('❌ Failed to respond to review: ${httpResponse.statusCode}');
      return null;
    } catch (e) {
      debugPrint('❌ Error responding to review: $e');
      return null;
    }
  }

  /// Get user's submitted reviews
  Future<List<ReviewModel>> getUserReviews(String userId) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/reviews/user/$userId');

      debugPrint('📋 Fetching reviews by user: $userId');

      final response = await http.get(uri, headers: ApiConfig.headers());

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final reviews = data['reviews'] as List;
        debugPrint('✅ User reviews fetched: ${reviews.length}');
        return reviews.map((json) => ReviewModel.fromJson(json)).toList();
      }

      return [];
    } catch (e) {
      debugPrint('❌ Error fetching user reviews: $e');
      return [];
    }
  }

  /// Report a review
  Future<bool> reportReview({
    required String reviewId,
    required String reason,
  }) async {
    try {
      final token = await _storageService.getToken();

      final uri = Uri.parse('${ApiConfig.baseUrl}/reviews/$reviewId/report');

      debugPrint('🚨 Reporting review: $reviewId');

      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({'reason': reason}),
      );

      if (response.statusCode == 200) {
        debugPrint('✅ Review reported successfully');
        return true;
      }

      debugPrint('❌ Failed to report review: ${response.statusCode}');
      return false;
    } catch (e) {
      debugPrint('❌ Error reporting review: $e');
      return false;
    }
  }
}
