class Review {
  final String id;
  final String listingId;
  final String reviewerId;
  final String bookingId;
  final double listingRating;
  final String? listingComment;
  final double hostRating;
  final String? hostComment;
  final DateTime? createdAt;

  // Populated fields
  final dynamic reviewer;
  final dynamic listing;

  Review({
    required this.id,
    required this.listingId,
    required this.reviewerId,
    required this.bookingId,
    required this.listingRating,
    this.listingComment,
    required this.hostRating,
    this.hostComment,
    this.createdAt,
    this.reviewer,
    this.listing,
  });

  // Backward compatibility getters
  String get customerId => reviewerId;
  dynamic get customer => reviewer;
  double get homeRating => listingRating;
  String? get homeReview => listingComment;
  String? get hostReview => hostComment;

  factory Review.fromJson(Map<String, dynamic> json) {
    // Helper to extract ID from either string or object
    String extractId(dynamic value) {
      if (value is String) return value;
      if (value is Map) return value['_id'] ?? value['id'] ?? '';
      return '';
    }

    // Get reviewerId with fallback to customerId
    final reviewerId = json['reviewerId'] != null
        ? extractId(json['reviewerId'])
        : extractId(json['customerId']);

    return Review(
      id: json['_id'] ?? json['id'] ?? '',
      listingId: extractId(json['listingId']),
      reviewerId: reviewerId,
      bookingId: extractId(json['bookingId']),
      // Support both listingRating and homeRating
      listingRating: (json['listingRating'] ?? json['homeRating'] ?? 0).toDouble(),
      // Support both listingComment and homeReview
      listingComment: json['listingComment'] ?? json['homeReview'],
      hostRating: (json['hostRating'] ?? 0).toDouble(),
      // Support both hostComment and hostReview
      hostComment: json['hostComment'] ?? json['hostReview'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      // Support both reviewerId and customerId as populated fields
      reviewer: json['reviewerId'] is Map
          ? json['reviewerId']
          : (json['customerId'] is Map ? json['customerId'] : null),
      listing: json['listingId'] is Map ? json['listingId'] : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'listingId': listingId,
      'reviewerId': reviewerId,
      'bookingId': bookingId,
      'listingRating': listingRating,
      'listingComment': listingComment,
      'hostRating': hostRating,
      'hostComment': hostComment,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

