import 'package:equatable/equatable.dart';

class Review {
  final String id;
  final String customerId;
  final String customerName;
  final String? customerImage;
  final String listingId;
  final String? listingTitle;
  final String bookingId;
  final int rating;
  final String comment;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Review({
    required this.id,
    required this.customerId,
    required this.customerName,
    this.customerImage,
    required this.listingId,
    this.listingTitle,
    required this.bookingId,
    required this.rating,
    required this.comment,
    required this.createdAt,
    this.updatedAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['_id'] ?? json['id'] ?? '',
      customerId: json['customerId']?['_id'] ?? json['customerId'] ?? '',
      customerName: json['customerId']?['firstName'] != null
          ? '${json['customerId']['firstName']} ${json['customerId']['lastName']}'
          : json['customerName'] ?? 'Anonymous',
      customerImage:
          json['customerId']?['profileImagePath'] ?? json['customerImage'],
      listingId: json['listingId']?['_id'] ?? json['listingId'] ?? '',
      listingTitle: json['listingId']?['title'] ?? json['listingTitle'],
      bookingId: json['bookingId']?['_id'] ?? json['bookingId'] ?? '',
      rating: json['rating'] ?? 0,
      comment: json['comment'] ?? '',
      createdAt:
          DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customerId': customerId,
      'listingId': listingId,
      'bookingId': bookingId,
      'rating': rating,
      'comment': comment,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  String get formattedDate {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays > 365) {
      final years = (difference.inDays / 365).floor();
      return '$years ${years == 1 ? 'year' : 'years'} ago';
    } else if (difference.inDays > 30) {
      final months = (difference.inDays / 30).floor();
      return '$months ${months == 1 ? 'month' : 'months'} ago';
    } else if (difference.inDays > 0) {
      return '${difference.inDays} ${difference.inDays == 1 ? 'day' : 'days'} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} ${difference.inHours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} ${difference.inMinutes == 1 ? 'minute' : 'minutes'} ago';
    } else {
      return 'Just now';
    }
  }

  Review copyWith({
    String? id,
    String? customerId,
    String? customerName,
    String? customerImage,
    String? listingId,
    String? listingTitle,
    String? bookingId,
    int? rating,
    String? comment,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Review(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      customerName: customerName ?? this.customerName,
      customerImage: customerImage ?? this.customerImage,
      listingId: listingId ?? this.listingId,
      listingTitle: listingTitle ?? this.listingTitle,
      bookingId: bookingId ?? this.bookingId,
      rating: rating ?? this.rating,
      comment: comment ?? this.comment,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

/// ReviewModel for state management with Equatable
class ReviewModel extends Equatable {
  final String id;
  final String bookingId;
  final String listingId;
  final String reviewerId;
  final String reviewerName;
  final String? reviewerProfileImage;
  final int listingRating; // 1-5 stars
  final String listingComment;
  final int? hostRating; // 1-5 stars (optional)
  final String? hostComment;
  final DateTime createdAt;
  final bool isVisible;

  const ReviewModel({
    required this.id,
    required this.bookingId,
    required this.listingId,
    required this.reviewerId,
    required this.reviewerName,
    this.reviewerProfileImage,
    required this.listingRating,
    required this.listingComment,
    this.hostRating,
    this.hostComment,
    required this.createdAt,
    this.isVisible = true,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    // Get reviewer info
    final reviewerData = json['reviewerId'];
    String reviewerName = '';
    String? reviewerImage;

    if (reviewerData is Map<String, dynamic>) {
      final firstName = reviewerData['firstName'] ?? '';
      final lastName = reviewerData['lastName'] ?? '';
      reviewerName = '$firstName $lastName'.trim();
      reviewerImage = reviewerData['profileImagePath'];
    } else if (reviewerData is String) {
      reviewerName = 'User';
    }

    return ReviewModel(
      id: json['_id'] ?? json['id'] ?? '',
      bookingId: json['bookingId'] ?? '',
      listingId: json['listingId'] ?? '',
      reviewerId:
          reviewerData is Map ? reviewerData['_id'] ?? '' : reviewerData ?? '',
      reviewerName: reviewerName,
      reviewerProfileImage: reviewerImage,
      listingRating: json['listingRating'] ?? json['rating'] ?? 0,
      listingComment: json['listingComment'] ?? json['comment'] ?? '',
      hostRating: json['hostRating'],
      hostComment: json['hostComment'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      isVisible: json['isVisible'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'bookingId': bookingId,
      'listingId': listingId,
      'reviewerId': reviewerId,
      'listingRating': listingRating,
      'listingComment': listingComment,
      'hostRating': hostRating,
      'hostComment': hostComment,
      'createdAt': createdAt.toIso8601String(),
      'isVisible': isVisible,
    };
  }

  @override
  List<Object?> get props => [
        id,
        bookingId,
        listingId,
        reviewerId,
        listingRating,
        listingComment,
        hostRating,
        hostComment,
        createdAt,
        isVisible,
      ];
}

/// ReviewSummary for aggregated review statistics
class ReviewSummary {
  final double averageRating;
  final int totalReviews;
  final Map<int, int> ratingDistribution; // star -> count

  ReviewSummary({
    required this.averageRating,
    required this.totalReviews,
    required this.ratingDistribution,
  });

  factory ReviewSummary.fromJson(Map<String, dynamic> json) {
    final distribution = <int, int>{};
    if (json['ratingDistribution'] != null) {
      final dist = json['ratingDistribution'] as Map<String, dynamic>;
      dist.forEach((key, value) {
        distribution[int.parse(key)] = value as int;
      });
    }

    return ReviewSummary(
      averageRating: (json['averageRating'] ?? 0.0).toDouble(),
      totalReviews: json['totalReviews'] ?? 0,
      ratingDistribution: distribution,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'averageRating': averageRating,
      'totalReviews': totalReviews,
      'ratingDistribution':
          ratingDistribution.map((k, v) => MapEntry(k.toString(), v)),
    };
  }

  /// Get percentage of reviews for a specific star rating
  double getRatingPercentage(int stars) {
    if (totalReviews == 0) return 0.0;
    final count = ratingDistribution[stars] ?? 0;
    return (count / totalReviews) * 100;
  }
}
