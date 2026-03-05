import 'package:json_annotation/json_annotation.dart';

import '../core/utils/json_converters.dart';

part 'review.g.dart';

/// Extracts reviewer/customer ID from a field that can be String, Map, or nested.
String _extractReviewerId(dynamic json) {
  if (json == null) return '';
  if (json is String) return json;
  if (json is Map) return json['_id']?.toString() ?? '';
  return json.toString();
}

@JsonSerializable()
class Review {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'bookingId')
  @MongoIdConverter()
  final String bookingId;

  @JsonKey(name: 'listingId')
  @MongoIdConverter()
  final String listingId;

  @JsonKey(name: 'listingTitle')
  final String? listingTitle;

  @JsonKey(name: 'customerId', fromJson: _extractReviewerId)
  final String customerId;

  @JsonKey(name: 'customerName', defaultValue: 'Anonymous')
  final String customerName;

  @JsonKey(name: 'customerImage')
  final String? customerImage;

  @JsonKey(name: 'listingRating')
  @SafeIntConverter()
  final int listingRating;

  @JsonKey(name: 'listingComment', defaultValue: '')
  final String listingComment;

  @JsonKey(name: 'hostRating')
  @NullableSafeIntConverter()
  final int? hostRating;

  @JsonKey(name: 'hostComment')
  final String? hostComment;

  @JsonKey(name: 'isVisible', defaultValue: true)
  final bool isVisible;

  @JsonKey(name: 'createdAt')
  @SafeDateTimeConverter()
  final DateTime createdAt;

  @JsonKey(name: 'updatedAt')
  @NullableDateTimeConverter()
  final DateTime? updatedAt;

  Review({
    required this.id,
    required this.bookingId,
    required this.listingId,
    this.listingTitle,
    required this.customerId,
    required this.customerName,
    this.customerImage,
    required this.listingRating,
    required this.listingComment,
    this.hostRating,
    this.hostComment,
    this.isVisible = true,
    required this.createdAt,
    this.updatedAt,
  });

  /// Backward-compat aliases
  int get rating => listingRating;
  String get comment => listingComment;
  String get reviewerId => customerId;
  String get reviewerName => customerName;
  String? get reviewerProfileImage => customerImage;

  /// Custom fromJson to handle complex reviewer/customer data shapes.
  factory Review.fromJson(Map<String, dynamic> json) {
    // Normalize reviewer data from various API shapes
    final normalized = Map<String, dynamic>.from(json);

    // Extract customer info from populated reviewerId or customerId
    final reviewerData = json['reviewerId'] ?? json['customerId'];
    if (reviewerData is Map<String, dynamic>) {
      normalized['customerId'] = reviewerData['_id']?.toString() ?? '';
      final firstName = reviewerData['firstName'] ?? '';
      final lastName = reviewerData['lastName'] ?? '';
      final name = '$firstName $lastName'.trim();
      normalized['customerName'] = name.isEmpty ? 'Anonymous' : name;
      normalized['customerImage'] =
          reviewerData['profileImagePath'] ?? json['customerImage'];
    } else {
      normalized['customerId'] =
          reviewerData?.toString() ?? json['customerId']?.toString() ?? '';
      normalized['customerName'] =
          json['customerName'] ?? json['reviewerName'] ?? 'Anonymous';
      normalized['customerImage'] =
          json['customerImage'] ?? json['reviewerProfileImage'];
    }

    // Normalize rating/comment field aliases
    normalized['listingRating'] = json['listingRating'] ?? json['rating'] ?? 0;
    normalized['listingComment'] =
        json['listingComment'] ?? json['comment'] ?? '';

    // Handle populated listingId
    if (json['listingId'] is Map) {
      normalized['listingTitle'] =
          json['listingId']['title']?.toString() ?? json['listingTitle'];
      normalized['listingId'] = json['listingId']['_id']?.toString() ?? '';
    }

    return _$ReviewFromJson(normalized);
  }

  Map<String, dynamic> toJson() => _$ReviewToJson(this);

  /// Formatted relative date for UI display
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
    String? bookingId,
    String? listingId,
    String? listingTitle,
    String? customerId,
    String? customerName,
    String? customerImage,
    int? listingRating,
    String? listingComment,
    int? hostRating,
    String? hostComment,
    bool? isVisible,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? rating,
    String? comment,
  }) {
    return Review(
      id: id ?? this.id,
      bookingId: bookingId ?? this.bookingId,
      listingId: listingId ?? this.listingId,
      listingTitle: listingTitle ?? this.listingTitle,
      customerId: customerId ?? this.customerId,
      customerName: customerName ?? this.customerName,
      customerImage: customerImage ?? this.customerImage,
      listingRating: listingRating ?? rating ?? this.listingRating,
      listingComment: listingComment ?? comment ?? this.listingComment,
      hostRating: hostRating ?? this.hostRating,
      hostComment: hostComment ?? this.hostComment,
      isVisible: isVisible ?? this.isVisible,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

/// Backward-compatible alias
typedef ReviewModel = Review;

/// ReviewSummary for aggregated review statistics
@JsonSerializable()
class ReviewSummary {
  @JsonKey(name: 'averageRating')
  @SafeDoubleConverter()
  final double averageRating;

  @JsonKey(name: 'totalReviews')
  @SafeIntConverter()
  final int totalReviews;

  @JsonKey(name: 'ratingDistribution', fromJson: _parseRatingDistribution)
  final Map<int, int> ratingDistribution;

  ReviewSummary({
    required this.averageRating,
    required this.totalReviews,
    required this.ratingDistribution,
  });

  factory ReviewSummary.fromJson(Map<String, dynamic> json) =>
      _$ReviewSummaryFromJson(json);

  Map<String, dynamic> toJson() => _$ReviewSummaryToJson(this);

  double getRatingPercentage(int stars) {
    if (totalReviews == 0) return 0.0;
    final count = ratingDistribution[stars] ?? 0;
    return (count / totalReviews) * 100;
  }
}

Map<int, int> _parseRatingDistribution(dynamic json) {
  if (json == null) return {};
  if (json is Map) {
    return json.map((key, value) =>
        MapEntry(int.tryParse(key.toString()) ?? 0, value as int));
  }
  return {};
}
