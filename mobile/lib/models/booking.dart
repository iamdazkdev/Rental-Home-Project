import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';

import '../core/enums/booking_enums.dart';

/// Unified Booking model
/// Combines the old Booking + BookingModel into a single Equatable class.
/// Supports BLoC state comparison via Equatable and provides rich computed
/// properties for UI consumption.
class Booking extends Equatable {
  final String id;
  final String customerId;
  final String hostId;
  final String listingId;
  final DateTime startDate;
  final DateTime endDate;
  final double totalPrice;

  // Status (stored as String, exposed as both String and Enum)
  final String bookingStatus;
  final String status; // Legacy field for backward compatibility

  // Payment fields
  final String? paymentMethod; // vnpay, cash
  final String? paymentType; // full, deposit, cash
  final String? paymentStatus; // paid, partially_paid, unpaid
  final double? depositAmount;
  final int? depositPercentage;
  final double? remainingAmount;
  final double? paidAmount;
  final double? finalTotalPrice;
  final String? finalEndDate;
  final DateTime? remainingDueDate;

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

  // Populated fields (from API joins)
  final dynamic customer;
  final dynamic host;
  final dynamic listing;

  const Booking({
    required this.id,
    required this.customerId,
    required this.hostId,
    required this.listingId,
    required this.startDate,
    required this.endDate,
    required this.totalPrice,
    this.bookingStatus = 'pending',
    this.status = 'pending',
    this.paymentMethod,
    this.paymentType,
    this.paymentStatus,
    this.depositAmount,
    this.depositPercentage,
    this.remainingAmount,
    this.paidAmount,
    this.finalTotalPrice,
    this.finalEndDate,
    this.remainingDueDate,
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

  // ---------------------------------------------------------------------------
  // Factory constructors
  // ---------------------------------------------------------------------------

  factory Booking.fromJson(Map<String, dynamic> json) {
    final startDate = _parseDate(json['startDate']);
    final endDate = _parseDateOrNull(json['endDate']) ??
        startDate.add(const Duration(days: 1));

    final bookingStatusStr =
        json['bookingStatus'] ?? json['status'] ?? 'pending';
    final statusStr = json['status'] ?? json['bookingStatus'] ?? 'pending';

    return Booking(
      id: json['_id'] ?? json['id'] ?? '',
      customerId: _extractId(json['customerId']),
      hostId: _extractId(json['hostId']),
      listingId: _extractId(json['listingId']),
      startDate: startDate,
      endDate: endDate,
      totalPrice: (json['totalPrice'] ?? 0).toDouble(),
      bookingStatus: bookingStatusStr,
      status: statusStr,
      paymentMethod: json['paymentMethod'],
      paymentType: json['paymentType'],
      paymentStatus: json['paymentStatus'],
      depositAmount: json['depositAmount']?.toDouble(),
      depositPercentage: json['depositPercentage'],
      remainingAmount: json['remainingAmount']?.toDouble(),
      paidAmount: json['paidAmount']?.toDouble(),
      finalTotalPrice:
          (json['finalTotalPrice'] ?? json['totalPrice'])?.toDouble(),
      finalEndDate: json['finalEndDate'],
      remainingDueDate: _parseDateOrNull(json['remainingDueDate']),
      createdAt: _parseDateOrNull(json['createdAt']),
      updatedAt: _parseDateOrNull(json['updatedAt']),
      extensionDays: json['extensionDays'],
      newEndDate: _parseDateOrNull(json['newEndDate']),
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

  factory Booking.empty() {
    return Booking(
      id: '',
      customerId: '',
      hostId: '',
      listingId: '',
      startDate: DateTime.now(),
      endDate: DateTime.now(),
      totalPrice: 0,
    );
  }

  // ---------------------------------------------------------------------------
  // JSON helpers
  // ---------------------------------------------------------------------------

  static String _extractId(dynamic field) {
    if (field is Map) return field['_id'] ?? field['id'] ?? '';
    return field?.toString() ?? '';
  }

  /// Robust date parser – handles ISO 8601 and legacy JS Date.toDateString()
  static DateTime _parseDate(dynamic value) {
    if (value == null) return DateTime.now();
    if (value is DateTime) return value;
    try {
      final dateStr = value.toString();
      // Try ISO format first
      try {
        return DateTime.parse(dateStr);
      } catch (_) {
        // Fallback: JS Date format "Tue Dec 23 2025"
        final parts = dateStr.split(' ');
        if (parts.length >= 4) {
          const months = {
            'Jan': '01',
            'Feb': '02',
            'Mar': '03',
            'Apr': '04',
            'May': '05',
            'Jun': '06',
            'Jul': '07',
            'Aug': '08',
            'Sep': '09',
            'Oct': '10',
            'Nov': '11',
            'Dec': '12',
          };
          final month = months[parts[1]];
          if (month != null) {
            final day = parts[2].padLeft(2, '0');
            final year = parts[3];
            return DateTime.parse('$year-$month-$day');
          }
        }
        throw Exception('Unable to parse date: $dateStr');
      }
    } catch (e) {
      debugPrint('⚠️ Error parsing date: $value - $e');
      return DateTime.now();
    }
  }

  static DateTime? _parseDateOrNull(dynamic value) {
    if (value == null) return null;
    return _parseDate(value);
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

  // ---------------------------------------------------------------------------
  // Enum getters (for BLoC / Cubit layer)
  // ---------------------------------------------------------------------------

  /// Effective status string (prefer bookingStatus over status)
  String get effectiveStatus =>
      bookingStatus.isNotEmpty ? bookingStatus : status;

  /// BookingStatus enum
  BookingStatus get statusEnum => BookingStatus.fromString(effectiveStatus);

  /// PaymentStatus enum
  PaymentStatus get paymentStatusEnum =>
      PaymentStatus.fromString(paymentStatus);

  /// PaymentMethod enum
  PaymentMethod get paymentMethodEnum =>
      PaymentMethod.fromString(paymentMethod);

  /// PaymentType enum
  PaymentType get paymentTypeEnum => PaymentType.fromString(paymentType);

  // ---------------------------------------------------------------------------
  // Booking status checks
  // ---------------------------------------------------------------------------

  int get numberOfNights {
    final effectiveEndDate = newEndDate ?? endDate;
    return effectiveEndDate.difference(startDate).inDays;
  }

  bool get isDraft => effectiveStatus == 'draft';

  bool get isPending => effectiveStatus == 'pending';

  bool get isApproved =>
      effectiveStatus == 'approved' || effectiveStatus == 'accepted';

  bool get isCheckedIn => effectiveStatus == 'checked_in';

  bool get isCheckedOut =>
      effectiveStatus == 'checked_out' || effectiveStatus == 'checkedOut';

  bool get isCompleted => effectiveStatus == 'completed';

  bool get isCancelled => effectiveStatus == 'cancelled';

  bool get isRejected => effectiveStatus == 'rejected';

  bool get isExpired => effectiveStatus == 'expired';

  // ---------------------------------------------------------------------------
  // Payment status checks
  // ---------------------------------------------------------------------------

  bool get isUnpaid => paymentStatus == null || paymentStatus == 'unpaid';

  bool get isPartiallyPaid => paymentStatus == 'partially_paid';

  bool get isPaid => paymentStatus == 'paid';

  bool get isRefunded => paymentStatus == 'refunded';

  // ---------------------------------------------------------------------------
  // Payment type checks
  // ---------------------------------------------------------------------------

  bool get isFullPayment => paymentType == 'full';

  bool get isDepositPayment => paymentType == 'deposit';

  bool get isCashPayment => paymentType == 'cash' || paymentMethod == 'cash';

  bool get hasDeposit =>
      paymentTypeEnum == PaymentType.deposit && (depositAmount ?? 0) > 0;

  // ---------------------------------------------------------------------------
  // Computed amount helpers
  // ---------------------------------------------------------------------------

  double get effectiveTotalPrice => finalTotalPrice ?? totalPrice;

  double get effectiveRemainingAmount =>
      remainingAmount ?? (totalPrice - (paidAmount ?? 0));

  bool get hasRemainingPayment =>
      isDepositPayment && effectiveRemainingAmount > 0;

  double get amountDue => remainingAmount ?? 0;

  // ---------------------------------------------------------------------------
  // Action availability checks
  // ---------------------------------------------------------------------------

  bool get canCheckout => isApproved && DateTime.now().isAfter(startDate);

  bool get canExtend => isApproved && !isCompleted && !isCheckedOut;

  bool get canCancel =>
      isPending || (isApproved && DateTime.now().isBefore(startDate));

  bool get canPayRemaining => isDepositPayment && isPartiallyPaid && !isPaid;

  bool get canReview => isCheckedOut && homeReview == null;

  // ---------------------------------------------------------------------------
  // Guest info helpers
  // ---------------------------------------------------------------------------

  String? get guestName {
    if (customer is Map) {
      final firstName = customer['firstName'] ?? '';
      final lastName = customer['lastName'] ?? '';
      return '$firstName $lastName'.trim();
    }
    return null;
  }

  String? get guestEmail {
    if (customer is Map) return customer['email'];
    return null;
  }

  String? get guestProfileImage {
    if (customer is Map) return customer['profileImagePath'];
    return null;
  }

  // ---------------------------------------------------------------------------
  // Listing info helpers
  // ---------------------------------------------------------------------------

  String? get listingTitle {
    if (listing is Map) return listing['title'];
    return null;
  }

  String? get listingCity {
    if (listing is Map) return listing['city'];
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

  /// Alias used by BookingModel consumers
  String? get listingPhoto => listingImage;

  // ---------------------------------------------------------------------------
  // Rejection reason
  // ---------------------------------------------------------------------------

  String? get rejectionReason {
    if (listing is Map && listing['rejectionReason'] != null) {
      return listing['rejectionReason'];
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Compatibility getters (used by BookingModel consumers)
  // ---------------------------------------------------------------------------

  String? get agreementId => null;
  String? get agreementUrl => null;
  String? get cancellationReason => null;
  String? get transactionId => null;
  DateTime? get paidAt => null;

  // ---------------------------------------------------------------------------
  // copyWith
  // ---------------------------------------------------------------------------

  Booking copyWith({
    String? id,
    String? customerId,
    String? hostId,
    String? listingId,
    DateTime? startDate,
    DateTime? endDate,
    double? totalPrice,
    String? bookingStatus,
    String? status,
    String? paymentMethod,
    String? paymentType,
    String? paymentStatus,
    double? depositAmount,
    int? depositPercentage,
    double? remainingAmount,
    double? paidAmount,
    double? finalTotalPrice,
    String? finalEndDate,
    DateTime? remainingDueDate,
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
    // Enum-typed overloads for BLoC layer compatibility
    BookingStatus? bookingStatusEnum,
    PaymentStatus? paymentStatusEnum,
    PaymentMethod? paymentMethodEnum,
    PaymentType? paymentTypeEnum,
  }) {
    return Booking(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      hostId: hostId ?? this.hostId,
      listingId: listingId ?? this.listingId,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      totalPrice: totalPrice ?? this.totalPrice,
      bookingStatus:
          bookingStatusEnum?.value ?? bookingStatus ?? this.bookingStatus,
      status: status ?? this.status,
      paymentMethod:
          paymentMethodEnum?.value ?? paymentMethod ?? this.paymentMethod,
      paymentType: paymentTypeEnum?.value ?? paymentType ?? this.paymentType,
      paymentStatus:
          paymentStatusEnum?.value ?? paymentStatus ?? this.paymentStatus,
      depositAmount: depositAmount ?? this.depositAmount,
      depositPercentage: depositPercentage ?? this.depositPercentage,
      remainingAmount: remainingAmount ?? this.remainingAmount,
      paidAmount: paidAmount ?? this.paidAmount,
      finalTotalPrice: finalTotalPrice ?? this.finalTotalPrice,
      finalEndDate: finalEndDate ?? this.finalEndDate,
      remainingDueDate: remainingDueDate ?? this.remainingDueDate,
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

  // ---------------------------------------------------------------------------
  // Equatable
  // ---------------------------------------------------------------------------

  @override
  List<Object?> get props => [
        id,
        customerId,
        hostId,
        listingId,
        startDate,
        endDate,
        totalPrice,
        bookingStatus,
        paymentStatus,
        paymentMethod,
        paymentType,
        depositAmount,
        depositPercentage,
        remainingAmount,
        paidAmount,
        finalTotalPrice,
        extensionDays,
        extensionCost,
        extensionStatus,
      ];
}

/// Backward-compatible alias so all existing `BookingModel` references
/// continue to work without any changes.
typedef BookingModel = Booking;
