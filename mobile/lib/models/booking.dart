class Booking {
  final String id;
  final String customerId;
  final String hostId;
  final String listingId;
  final DateTime startDate;
  final DateTime endDate;
  final double totalPrice;
  final String status; // pending, approved, rejected, cancelled, completed, checkedOut
  final DateTime? createdAt;
  final DateTime? updatedAt;

  // Extension
  final int? extensionDays;
  final DateTime? newEndDate;
  final double? extensionCost;
  final String? extensionStatus;

  // Reviews
  final String? homeReview;
  final double? homeRating;
  final String? hostReview;
  final double? hostRating;

  // Populated fields
  final dynamic customer;
  final dynamic host;
  final dynamic listing;

  Booking({
    required this.id,
    required this.customerId,
    required this.hostId,
    required this.listingId,
    required this.startDate,
    required this.endDate,
    required this.totalPrice,
    required this.status,
    this.createdAt,
    this.updatedAt,
    this.extensionDays,
    this.newEndDate,
    this.extensionCost,
    this.extensionStatus,
    this.homeReview,
    this.homeRating,
    this.hostReview,
    this.hostRating,
    this.customer,
    this.host,
    this.listing,
  });

  int get numberOfNights {
    final effectiveEndDate = newEndDate ?? endDate;
    return effectiveEndDate.difference(startDate).inDays;
  }

  bool get isPending => status == 'pending';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';
  bool get isCancelled => status == 'cancelled';
  bool get isCompleted => status == 'completed';
  bool get isCheckedOut => status == 'checkedOut';

  bool get canCheckout => isApproved && DateTime.now().isAfter(startDate);
  bool get canExtend => isApproved && !isCompleted && !isCheckedOut;
  bool get canReview => isCheckedOut && homeReview == null;

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['_id'] ?? json['id'] ?? '',
      customerId: json['customerId'] is String
          ? json['customerId']
          : json['customerId']?['_id'] ?? '',
      hostId: json['hostId'] is String
          ? json['hostId']
          : json['hostId']?['_id'] ?? '',
      listingId: json['listingId'] is String
          ? json['listingId']
          : json['listingId']?['_id'] ?? '',
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      totalPrice: (json['totalPrice'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
      extensionDays: json['extensionDays'],
      newEndDate: json['newEndDate'] != null
          ? DateTime.parse(json['newEndDate'])
          : null,
      extensionCost: json['extensionCost']?.toDouble(),
      extensionStatus: json['extensionStatus'],
      homeReview: json['homeReview'],
      homeRating: json['homeRating']?.toDouble(),
      hostReview: json['hostReview'],
      hostRating: json['hostRating']?.toDouble(),
      customer: json['customerId'] is Map ? json['customerId'] : null,
      host: json['hostId'] is Map ? json['hostId'] : null,
      listing: json['listingId'] is Map ? json['listingId'] : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'customerId': customerId,
      'hostId': hostId,
      'listingId': listingId,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'totalPrice': totalPrice,
      'status': status,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'extensionDays': extensionDays,
      'newEndDate': newEndDate?.toIso8601String(),
      'extensionCost': extensionCost,
      'extensionStatus': extensionStatus,
      'homeReview': homeReview,
      'homeRating': homeRating,
      'hostReview': hostReview,
      'hostRating': hostRating,
    };
  }

  Booking copyWith({
    String? id,
    String? customerId,
    String? hostId,
    String? listingId,
    DateTime? startDate,
    DateTime? endDate,
    double? totalPrice,
    String? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? extensionDays,
    DateTime? newEndDate,
    double? extensionCost,
    String? extensionStatus,
    String? homeReview,
    double? homeRating,
    String? hostReview,
    double? hostRating,
    dynamic customer,
    dynamic host,
    dynamic listing,
  }) {
    return Booking(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      hostId: hostId ?? this.hostId,
      listingId: listingId ?? this.listingId,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      totalPrice: totalPrice ?? this.totalPrice,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      extensionDays: extensionDays ?? this.extensionDays,
      newEndDate: newEndDate ?? this.newEndDate,
      extensionCost: extensionCost ?? this.extensionCost,
      extensionStatus: extensionStatus ?? this.extensionStatus,
      homeReview: homeReview ?? this.homeReview,
      homeRating: homeRating ?? this.homeRating,
      hostReview: hostReview ?? this.hostReview,
      hostRating: hostRating ?? this.hostRating,
      customer: customer ?? this.customer,
      host: host ?? this.host,
      listing: listing ?? this.listing,
    );
  }
}

