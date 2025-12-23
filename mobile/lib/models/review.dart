class Review {
  final String id;
  final String listingId;
  final String customerId;
  final String hostId;
  final String bookingId;
  final double homeRating;
  final String? homeReview;
  final double hostRating;
  final String? hostReview;
  final DateTime? createdAt;

  // Populated fields
  final dynamic customer;
  final dynamic listing;

  Review({
    required this.id,
    required this.listingId,
    required this.customerId,
    required this.hostId,
    required this.bookingId,
    required this.homeRating,
    this.homeReview,
    required this.hostRating,
    this.hostReview,
    this.createdAt,
    this.customer,
    this.listing,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['_id'] ?? json['id'] ?? '',
      listingId: json['listingId'] is String
          ? json['listingId']
          : json['listingId']?['_id'] ?? '',
      customerId: json['customerId'] is String
          ? json['customerId']
          : json['customerId']?['_id'] ?? '',
      hostId: json['hostId'] is String
          ? json['hostId']
          : json['hostId']?['_id'] ?? '',
      bookingId: json['bookingId'] ?? '',
      homeRating: (json['homeRating'] ?? 0).toDouble(),
      homeReview: json['homeReview'],
      hostRating: (json['hostRating'] ?? 0).toDouble(),
      hostReview: json['hostReview'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      customer: json['customerId'] is Map ? json['customerId'] : null,
      listing: json['listingId'] is Map ? json['listingId'] : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'listingId': listingId,
      'customerId': customerId,
      'hostId': hostId,
      'bookingId': bookingId,
      'homeRating': homeRating,
      'homeReview': homeReview,
      'hostRating': hostRating,
      'hostReview': hostReview,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

