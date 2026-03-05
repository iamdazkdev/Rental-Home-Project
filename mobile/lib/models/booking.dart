import 'package:flutter/foundation.dart';
import 'package:json_annotation/json_annotation.dart';

import '../core/enums/booking_enums.dart';
import '../core/utils/json_converters.dart';

part 'booking.g.dart';

/// Robust date parser – handles ISO 8601 and legacy JS Date.toDateString()
DateTime _parseBookingDate(dynamic value) {
  if (value == null) return DateTime.now();
  if (value is DateTime) return value;
  try {
    final dateStr = value.toString();
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

DateTime? _parseBookingDateOrNull(dynamic value) {
  if (value == null) return null;
  return _parseBookingDate(value);
}

@JsonSerializable()
class Booking {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'customerId')
  @MongoIdConverter()
  final String customerId;

  @JsonKey(name: 'hostId')
  @MongoIdConverter()
  final String hostId;

  @JsonKey(name: 'listingId')
  @MongoIdConverter()
  final String listingId;

  @JsonKey(name: 'startDate', fromJson: _parseBookingDate)
  final DateTime startDate;

  @JsonKey(name: 'endDate', fromJson: _parseBookingDate)
  final DateTime endDate;

  @JsonKey(name: 'totalPrice')
  @SafeDoubleConverter()
  final double totalPrice;

  @JsonKey(name: 'bookingStatus', defaultValue: 'pending')
  final String bookingStatus;

  @JsonKey(name: 'status', defaultValue: 'pending')
  final String status;

  @JsonKey(name: 'paymentMethod')
  final String? paymentMethod;

  @JsonKey(name: 'paymentType')
  final String? paymentType;

  @JsonKey(name: 'paymentStatus')
  final String? paymentStatus;

  @JsonKey(name: 'depositAmount')
  @NullableSafeDoubleConverter()
  final double? depositAmount;

  @JsonKey(name: 'depositPercentage')
  @NullableSafeIntConverter()
  final int? depositPercentage;

  @JsonKey(name: 'remainingAmount')
  @NullableSafeDoubleConverter()
  final double? remainingAmount;

  @JsonKey(name: 'paidAmount')
  @NullableSafeDoubleConverter()
  final double? paidAmount;

  @JsonKey(name: 'finalTotalPrice')
  @NullableSafeDoubleConverter()
  final double? finalTotalPrice;

  @JsonKey(name: 'finalEndDate')
  final String? finalEndDate;

  @JsonKey(name: 'remainingDueDate', fromJson: _parseBookingDateOrNull)
  final DateTime? remainingDueDate;

  @JsonKey(name: 'createdAt', fromJson: _parseBookingDateOrNull)
  final DateTime? createdAt;

  @JsonKey(name: 'updatedAt', fromJson: _parseBookingDateOrNull)
  final DateTime? updatedAt;

  @JsonKey(name: 'extensionDays')
  final int? extensionDays;

  @JsonKey(name: 'newEndDate', fromJson: _parseBookingDateOrNull)
  final DateTime? newEndDate;

  @JsonKey(name: 'extensionCost')
  @NullableSafeDoubleConverter()
  final double? extensionCost;

  @JsonKey(name: 'extensionStatus')
  final String? extensionStatus;

  @JsonKey(name: 'homeReview')
  final String? homeReview;

  @JsonKey(name: 'homeRating')
  @NullableSafeDoubleConverter()
  final double? homeRating;

  @JsonKey(name: 'hostReview')
  final String? hostReview;

  @JsonKey(name: 'hostRating')
  @NullableSafeDoubleConverter()
  final double? hostRating;

  /// Populated fields from API joins (excluded from generated code)
  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic customer;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic host;

  @JsonKey(includeFromJson: false, includeToJson: false)
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

  /// Custom fromJson that normalizes populated fields and status aliases
  /// before delegating to generated code.
  factory Booking.fromJson(Map<String, dynamic> json) {
    final normalized = Map<String, dynamic>.from(json);

    // Normalize status fields
    normalized['bookingStatus'] =
        json['bookingStatus'] ?? json['status'] ?? 'pending';
    normalized['status'] = json['status'] ?? json['bookingStatus'] ?? 'pending';

    // Normalize finalTotalPrice
    normalized['finalTotalPrice'] =
        json['finalTotalPrice'] ?? json['totalPrice'];

    // Extract populated data before MongoIdConverter processes the IDs
    final dynamic customer =
        json['customerId'] is Map ? json['customerId'] : null;
    final dynamic host = json['hostId'] is Map ? json['hostId'] : null;
    final dynamic listing = json['listingId'] is Map ? json['listingId'] : null;

    final booking = _$BookingFromJson(normalized);
    return Booking(
      id: booking.id,
      customerId: booking.customerId,
      hostId: booking.hostId,
      listingId: booking.listingId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.totalPrice,
      bookingStatus: booking.bookingStatus,
      status: booking.status,
      paymentMethod: booking.paymentMethod,
      paymentType: booking.paymentType,
      paymentStatus: booking.paymentStatus,
      depositAmount: booking.depositAmount,
      depositPercentage: booking.depositPercentage,
      remainingAmount: booking.remainingAmount,
      paidAmount: booking.paidAmount,
      finalTotalPrice: booking.finalTotalPrice,
      finalEndDate: booking.finalEndDate,
      remainingDueDate: booking.remainingDueDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      extensionDays: booking.extensionDays,
      newEndDate: booking.newEndDate,
      extensionCost: booking.extensionCost,
      extensionStatus: booking.extensionStatus,
      homeReview: booking.homeReview,
      homeRating: booking.homeRating,
      hostReview: booking.hostReview,
      hostRating: booking.hostRating,
      customer: customer,
      host: host,
      listing: listing,
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

  Map<String, dynamic> toJson() => _$BookingToJson(this);

  // ---------------------------------------------------------------------------
  // Enum getters
  // ---------------------------------------------------------------------------

  String get effectiveStatus =>
      bookingStatus.isNotEmpty ? bookingStatus : status;

  BookingStatus get statusEnum => BookingStatus.fromString(effectiveStatus);

  PaymentStatus get paymentStatusEnum =>
      PaymentStatus.fromString(paymentStatus);

  PaymentMethod get paymentMethodEnum =>
      PaymentMethod.fromString(paymentMethod);

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
  // Computed amounts
  // ---------------------------------------------------------------------------

  double get effectiveTotalPrice => finalTotalPrice ?? totalPrice;
  double get effectiveRemainingAmount =>
      remainingAmount ?? (totalPrice - (paidAmount ?? 0));
  bool get hasRemainingPayment =>
      isDepositPayment && effectiveRemainingAmount > 0;
  double get amountDue => remainingAmount ?? 0;

  // ---------------------------------------------------------------------------
  // Action availability
  // ---------------------------------------------------------------------------

  bool get canCheckout => isApproved && DateTime.now().isAfter(startDate);
  bool get canExtend => isApproved && !isCompleted && !isCheckedOut;
  bool get canCancel =>
      isPending || (isApproved && DateTime.now().isBefore(startDate));
  bool get canPayRemaining => isDepositPayment && isPartiallyPaid && !isPaid;
  bool get canReview => isCheckedOut && homeReview == null;

  // ---------------------------------------------------------------------------
  // Guest/Listing info helpers
  // ---------------------------------------------------------------------------

  String? get guestName {
    if (customer is Map) {
      return '${customer['firstName'] ?? ''} ${customer['lastName'] ?? ''}'
          .trim();
    }
    return null;
  }

  String? get guestEmail => customer is Map ? customer['email'] : null;
  String? get guestProfileImage =>
      customer is Map ? customer['profileImagePath'] : null;

  String? get listingTitle => listing is Map ? listing['title'] : null;
  String? get listingCity => listing is Map ? listing['city'] : null;

  String? get listingImage {
    if (listing is Map) {
      final photos = listing['listingPhotoPaths'] as List?;
      if (photos != null && photos.isNotEmpty) return photos.first.toString();
    }
    return null;
  }

  String? get listingPhoto => listingImage;

  String? get rejectionReason {
    if (listing is Map && listing['rejectionReason'] != null) {
      return listing['rejectionReason'];
    }
    return null;
  }

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
}

/// Backward-compatible alias
typedef BookingModel = Booking;
