import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/repositories/review_repository.dart';
import '../../../models/review.dart';

// ==================== STATES ====================

abstract class ReviewState extends Equatable {
  @override
  List<Object?> get props => [];
}

class ReviewInitial extends ReviewState {}

class ReviewLoading extends ReviewState {}

class ReviewsLoaded extends ReviewState {
  final List<ReviewModel> reviews;
  final ReviewSummary? summary;

  ReviewsLoaded({required this.reviews, this.summary});

  @override
  List<Object?> get props => [reviews, summary];
}

class ReviewSubmitted extends ReviewState {
  final ReviewModel review;

  ReviewSubmitted({required this.review});

  @override
  List<Object?> get props => [review];
}

class ReviewUpdated extends ReviewState {
  final ReviewModel review;

  ReviewUpdated({required this.review});

  @override
  List<Object?> get props => [review];
}

class ReviewDeleted extends ReviewState {}

class ReviewError extends ReviewState {
  final String message;

  ReviewError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ==================== CUBIT ====================

class ReviewCubit extends Cubit<ReviewState> {
  final ReviewRepository _reviewRepository;

  ReviewCubit({required ReviewRepository reviewRepository})
      : _reviewRepository = reviewRepository,
        super(ReviewInitial());

  /// Load reviews for a listing
  Future<void> loadListingReviews(String listingId,
      {bool includeSummary = true}) async {
    emit(ReviewLoading());

    try {
      final reviews = await _reviewRepository.getListingReviews(listingId);

      ReviewSummary? summary;
      if (includeSummary) {
        summary = await _reviewRepository.getListingReviewSummary(listingId);
      }

      emit(ReviewsLoaded(reviews: reviews, summary: summary));
    } catch (e) {
      emit(ReviewError(message: 'Failed to load reviews: ${e.toString()}'));
    }
  }

  /// Submit a new review
  Future<void> submitReview({
    required String bookingId,
    required String listingId,
    required int rating,
    required String comment,
  }) async {
    if (rating < 1 || rating > 5) {
      emit(ReviewError(message: 'Rating must be between 1 and 5'));
      return;
    }

    if (comment.trim().isEmpty) {
      emit(ReviewError(message: 'Please write a comment'));
      return;
    }

    if (comment.trim().length < 10) {
      emit(ReviewError(message: 'Comment must be at least 10 characters'));
      return;
    }

    emit(ReviewLoading());

    try {
      final review = await _reviewRepository.submitReview(
        bookingId: bookingId,
        listingId: listingId,
        rating: rating,
        comment: comment.trim(),
      );

      if (review != null) {
        emit(ReviewSubmitted(review: review));
      } else {
        emit(ReviewError(message: 'Failed to submit review'));
      }
    } catch (e) {
      emit(ReviewError(message: 'Error submitting review: ${e.toString()}'));
    }
  }

  /// Update an existing review
  Future<void> updateReview({
    required String reviewId,
    required int rating,
    required String comment,
  }) async {
    if (rating < 1 || rating > 5) {
      emit(ReviewError(message: 'Rating must be between 1 and 5'));
      return;
    }

    if (comment.trim().isEmpty) {
      emit(ReviewError(message: 'Please write a comment'));
      return;
    }

    emit(ReviewLoading());

    try {
      final review = await _reviewRepository.updateReview(
        reviewId: reviewId,
        rating: rating,
        comment: comment.trim(),
      );

      if (review != null) {
        emit(ReviewUpdated(review: review));
      } else {
        emit(ReviewError(message: 'Failed to update review'));
      }
    } catch (e) {
      emit(ReviewError(message: 'Error updating review: ${e.toString()}'));
    }
  }

  /// Delete a review
  Future<void> deleteReview(String reviewId) async {
    emit(ReviewLoading());

    try {
      final success = await _reviewRepository.deleteReview(reviewId);

      if (success) {
        emit(ReviewDeleted());
      } else {
        emit(ReviewError(message: 'Failed to delete review'));
      }
    } catch (e) {
      emit(ReviewError(message: 'Error deleting review: ${e.toString()}'));
    }
  }

  /// Host responds to a review
  Future<void> respondToReview({
    required String reviewId,
    required String response,
  }) async {
    if (response.trim().isEmpty) {
      emit(ReviewError(message: 'Please write a response'));
      return;
    }

    emit(ReviewLoading());

    try {
      final review = await _reviewRepository.respondToReview(
        reviewId: reviewId,
        response: response.trim(),
      );

      if (review != null) {
        emit(ReviewUpdated(review: review));
      } else {
        emit(ReviewError(message: 'Failed to respond to review'));
      }
    } catch (e) {
      emit(ReviewError(message: 'Error responding to review: ${e.toString()}'));
    }
  }

  /// Load user's submitted reviews
  Future<void> loadUserReviews(String userId) async {
    emit(ReviewLoading());

    try {
      final reviews = await _reviewRepository.getUserReviews(userId);
      emit(ReviewsLoaded(reviews: reviews));
    } catch (e) {
      emit(
          ReviewError(message: 'Failed to load user reviews: ${e.toString()}'));
    }
  }

  /// Report a review
  Future<void> reportReview({
    required String reviewId,
    required String reason,
  }) async {
    if (reason.trim().isEmpty) {
      emit(ReviewError(message: 'Please provide a reason for reporting'));
      return;
    }

    try {
      final success = await _reviewRepository.reportReview(
        reviewId: reviewId,
        reason: reason.trim(),
      );

      if (success) {
        // Don't change state, just show success (handled in UI)
      } else {
        emit(ReviewError(message: 'Failed to report review'));
      }
    } catch (e) {
      emit(ReviewError(message: 'Error reporting review: ${e.toString()}'));
    }
  }
}
