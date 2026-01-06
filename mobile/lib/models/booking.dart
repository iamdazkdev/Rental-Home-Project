import 'package:flutter/foundation.dart';

/// Booking Status enum matching backend states
enum BookingStatus {
  draft('draft'),
  pending('pending'),
  approved('approved'),
  checkedIn('checked_in'),
  checkedOut('checked_out'),
  completed('completed'),
  cancelled('cancelled'),
  rejected('rejected'),
  expired('expired');

  final String value;
  const BookingStatus(this.value);

  static BookingStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'draft':
        return BookingStatus.draft;
      case 'pending':
        return BookingStatus.pending;
      case 'approved':
      case 'accepted':
        return BookingStatus.approved;
      case 'checked_in':
      case 'checkedin':
        return BookingStatus.checkedIn;
      case 'checked_out':
      case 'checkedout':
        return BookingStatus.checkedOut;
      case 'completed':
        return BookingStatus.completed;
      case 'cancelled':
        return BookingStatus.cancelled;
      case 'rejected':
        return BookingStatus.rejected;
      case 'expired':
        return BookingStatus.expired;
      default:
        return BookingStatus.pending;
    }
  }
}

/// Payment Status enum matching backend states
enum PaymentStatus {
  unpaid('unpaid'),
  partiallyPaid('partially_paid'),
  paid('paid'),
  refunded('refunded');

  final String value;
  const PaymentStatus(this.value);

  static PaymentStatus fromString(String? status) {
    switch (status?.toLowerCase()) {
      case 'unpaid':
        return PaymentStatus.unpaid;
      case 'partially_paid':
        return PaymentStatus.partiallyPaid;
      case 'paid':
        return PaymentStatus.paid;
      case 'refunded':
        return PaymentStatus.refunded;
      default:
        return PaymentStatus.unpaid;
    }
  }
}

/// Payment Method enum
enum PaymentMethod {
  vnpay('vnpay'),
  cash('cash');

  final String value;
  const PaymentMethod(this.value);

  static PaymentMethod fromString(String? method) {
    switch (method?.toLowerCase()) {
      case 'vnpay':
        return PaymentMethod.vnpay;
      case 'cash':
        return PaymentMethod.cash;
      default:
        return PaymentMethod.cash;
    }
  }
}

/// Payment Type enum
enum PaymentType {
  full('full'),
  deposit('deposit'),
  cash('cash');

  final String value;
  const PaymentType(this.value);

  static PaymentType fromString(String? type) {
    switch (type?.toLowerCase()) {
      case 'full':
        return PaymentType.full;
      case 'deposit':
        return PaymentType.deposit;
      case 'cash':
        return PaymentType.cash;
      default:
        return PaymentType.cash;
    }
  }
}

class Booking {
  final String id;
  final String customerId;
  final String hostId;
  final String listingId;
  final DateTime startDate;
  final DateTime endDate;
  final double totalPrice;

  // Use bookingStatus as primary (v2.0), fallback to status
  final String bookingStatus;
  final String status; // Legacy field for backward compatibility

  // Payment fields (v2.0)
  final String? paymentMethod; // vnpay, cash
  final String? paymentType; // full, deposit, cash
  final String? paymentStatus; // paid, partially_paid, unpaid
  final double? depositAmount;
  final int? depositPercentage;
  final double? remainingAmount;
  final double? paidAmount;
  final double? finalTotalPrice;
  final String? finalEndDate;

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
    String? bookingStatus,
    this.paymentMethod,
    this.paymentType,
    this.paymentStatus,
    this.depositAmount,
    this.depositPercentage,
    this.remainingAmount,
    this.paidAmount,
    this.finalTotalPrice,
    this.finalEndDate,
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
  }) : bookingStatus = bookingStatus ?? status;

  int get numberOfNights {
    final effectiveEndDate = newEndDate ?? endDate;
    return effectiveEndDate.difference(startDate).inDays;
  }

  /// Get the effective status (prefer bookingStatus over status)
  String get effectiveStatus => bookingStatus.isNotEmpty ? bookingStatus : status;

  /// Get as BookingStatus enum
  BookingStatus get statusEnum => BookingStatus.fromString(effectiveStatus);

  /// Get as PaymentStatus enum
  PaymentStatus get paymentStatusEnum => PaymentStatus.fromString(paymentStatus);

  /// Get as PaymentMethod enum
  PaymentMethod get paymentMethodEnum => PaymentMethod.fromString(paymentMethod);

  /// Get as PaymentType enum
  PaymentType get paymentTypeEnum => PaymentType.fromString(paymentType);

  // Status checks using bookingStatus (v2.0)
  bool get isDraft => effectiveStatus == 'draft';
  bool get isPending => effectiveStatus == 'pending';
  bool get isApproved => effectiveStatus == 'approved' || effectiveStatus == 'accepted';
  bool get isCheckedIn => effectiveStatus == 'checked_in';
  bool get isCheckedOut => effectiveStatus == 'checked_out' || effectiveStatus == 'checkedOut';
  bool get isCompleted => effectiveStatus == 'completed';
  bool get isCancelled => effectiveStatus == 'cancelled';
  bool get isRejected => effectiveStatus == 'rejected';
  bool get isExpired => effectiveStatus == 'expired';

  // Payment status checks
  bool get isUnpaid => paymentStatus == null || paymentStatus == 'unpaid';
  bool get isPartiallyPaid => paymentStatus == 'partially_paid';
  bool get isPaid => paymentStatus == 'paid';
  bool get isRefunded => paymentStatus == 'refunded';

  // Payment type checks
  bool get isFullPayment => paymentType == 'full';
  bool get isDepositPayment => paymentType == 'deposit';
  bool get isCashPayment => paymentType == 'cash' || paymentMethod == 'cash';

  // Computed amount helpers
  double get effectiveTotalPrice => finalTotalPrice ?? totalPrice;
  double get effectiveRemainingAmount => remainingAmount ?? (totalPrice - (paidAmount ?? 0));
  bool get hasRemainingPayment => isDepositPayment && effectiveRemainingAmount > 0;

  // Action availability checks
  bool get canCheckout => isApproved && DateTime.now().isAfter(startDate);
  bool get canExtend => isApproved && !isCompleted && !isCheckedOut;
  bool get canCancel => isPending || (isApproved && DateTime.now().isBefore(startDate));
  bool get canPayRemaining => isDepositPayment && isPartiallyPaid && !isPaid;
  bool get canReview => isCheckedOut && homeReview == null;

  // Guest info helpers
  String? get guestName {
    if (customer is Map) {
      final firstName = customer['firstName'] ?? '';
      final lastName = customer['lastName'] ?? '';
      return '$firstName $lastName'.trim();
    }
    return null;
  }

  String? get guestEmail {
    if (customer is Map) {
      return customer['email'];
    }
    return null;
  }

  String? get guestProfileImage {
    if (customer is Map) {
      return customer['profileImagePath'];
    }
    return null;
  }

  // Listing info helpers
  String? get listingTitle {
    if (listing is Map) {
      return listing['title'];
    }
    return null;
  }

  String? get listingImage {
    if (listing is Map) {
      final photos = listing['listingPhotoPaths'] as List?;
      if (photos != null && photos.isNotEmpty) {
        return photos.first.toString();
      }
    }
    return null;
  }

  // Rejection reason (from extensions or booking)
  String? get rejectionReason {
    // Check for rejection reason in root
    if (listing is Map && listing['rejectionReason'] != null) {
      return listing['rejectionReason'];
    }
    return null;
  }

  factory Booking.fromJson(Map<String, dynamic> json) {
    // Safe date parsing helper - handles ISO format and fallback for old JS format
    DateTime? parseDate(dynamic value) {
      if (value == null) return null;
      try {
        final dateStr = value.toString();

        // Try ISO format first (2025-12-23T00:00:00.000Z)
        try {
          return DateTime.parse(dateStr);
        } catch (_) {
          // Fallback: handle old JS Date format (Tue Dec 23 2025)
          // This is for old data in DB, new bookings use ISO format
          final parts = dateStr.split(' ');
          if (parts.length >= 4) {
            final months = {
              'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
              'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
              'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
            };

            final month = months[parts[1]];
            final day = parts[2].padLeft(2, '0');
            final year = parts[3];

            if (month != null) {
              return DateTime.parse('$year-$month-$day');
            }
          }
          throw Exception('Unable to parse date: $dateStr');
        }
      } catch (e) {
        debugPrint('⚠️ Error parsing date: $value - $e');
        return null;
      }
    }

    // Parse required dates with fallback to current time
    final startDate = parseDate(json['startDate']) ?? DateTime.now();
    final endDate = parseDate(json['endDate']) ?? DateTime.now().add(const Duration(days: 1));

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
      startDate: startDate,
      endDate: endDate,
      totalPrice: (json['totalPrice'] ?? 0).toDouble(),
      status: json['status'] ?? json['bookingStatus'] ?? 'pending',
      bookingStatus: json['bookingStatus'] ?? json['status'] ?? 'pending',
      paymentMethod: json['paymentMethod'],
      paymentType: json['paymentType'],
      paymentStatus: json['paymentStatus'],
      depositAmount: json['depositAmount']?.toDouble(),
      depositPercentage: json['depositPercentage'],
      remainingAmount: json['remainingAmount']?.toDouble(),
      paidAmount: json['paidAmount']?.toDouble(),
      finalTotalPrice: json['finalTotalPrice']?.toDouble(),
      finalEndDate: json['finalEndDate'],
      createdAt: parseDate(json['createdAt']),
      updatedAt: parseDate(json['updatedAt']),
      extensionDays: json['extensionDays'],
      newEndDate: parseDate(json['newEndDate']),
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
      'bookingStatus': bookingStatus,
      'paymentMethod': paymentMethod,
      'paymentType': paymentType,
      'paymentStatus': paymentStatus,
      'depositAmount': depositAmount,
      'depositPercentage': depositPercentage,
      'remainingAmount': remainingAmount,
      'paidAmount': paidAmount,
      'finalTotalPrice': finalTotalPrice,
      'finalEndDate': finalEndDate,
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
    String? paymentMethod,
    String? paymentStatus,
    double? depositAmount,
    int? depositPercentage,
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
      paymentMethod: paymentMethod ?? this.paymentMethod,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      depositAmount: depositAmount ?? this.depositAmount,
      depositPercentage: depositPercentage ?? this.depositPercentage,
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

