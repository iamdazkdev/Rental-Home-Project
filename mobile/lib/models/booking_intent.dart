import 'package:flutter/foundation.dart';

/// BookingIntent Model (v3.0)
/// Implements temporary reservation/locking mechanism for concurrent booking handling
///
/// Purpose:
/// - Prevents overbooking when multiple users try to book the same listing
/// - Holds a temporary lock while user proceeds with payment
/// - Auto-expires to release lock if payment not completed
///
/// Status Flow:
/// LOCKED -> PAID (success) or EXPIRED (timeout) or CANCELLED (user cancelled)
class BookingIntent {
  final String id;
  final String intentId;
  final String? tempOrderId;
  final String customerId;
  final String hostId;
  final String listingId;
  final String bookingType; // entire_place, room_rental
  final DateTime startDate;
  final DateTime endDate;
  final double totalPrice;

  // Intent status for concurrency control
  final BookingIntentStatus status;

  // Payment details
  final String paymentMethod; // vnpay, cash
  final String paymentType; // full, deposit, cash
  final double paymentAmount;
  final int depositPercentage;
  final double depositAmount;
  final double remainingAmount;

  // Lock timing
  final DateTime lockedAt;
  final DateTime expiresAt;
  final DateTime? paidAt;
  final DateTime? cancelledAt;

  // Transaction info
  final String? transactionId;
  final String? vnpTransactionNo;

  // Created booking reference
  final String? bookingId;

  // Populated fields
  final dynamic customer;
  final dynamic host;
  final dynamic listing;

  BookingIntent({
    required this.id,
    required this.intentId,
    this.tempOrderId,
    required this.customerId,
    required this.hostId,
    required this.listingId,
    this.bookingType = 'entire_place',
    required this.startDate,
    required this.endDate,
    required this.totalPrice,
    this.status = BookingIntentStatus.locked,
    required this.paymentMethod,
    required this.paymentType,
    required this.paymentAmount,
    this.depositPercentage = 0,
    this.depositAmount = 0,
    this.remainingAmount = 0,
    required this.lockedAt,
    required this.expiresAt,
    this.paidAt,
    this.cancelledAt,
    this.transactionId,
    this.vnpTransactionNo,
    this.bookingId,
    this.customer,
    this.host,
    this.listing,
  });

  bool get isLocked => status == BookingIntentStatus.locked;

  bool get isPaid => status == BookingIntentStatus.paid;

  bool get isExpired => status == BookingIntentStatus.expired;

  bool get isCancelled => status == BookingIntentStatus.cancelled;

  bool get isFailed => status == BookingIntentStatus.failed;

  bool get isActive => isLocked && DateTime.now().isBefore(expiresAt);

  Duration get remainingTime => expiresAt.difference(DateTime.now());

  // Alias for compatibility
  Duration get timeRemaining => remainingTime;

  // Check if intent is still valid (not expired)
  bool get isValid => isActive && !isExpired;

  // Check if this is a full payment (not deposit)
  bool get isFullPayment => paymentType == 'full';

  double get effectivePaymentAmount {
    if (paymentType == 'deposit') {
      return depositAmount;
    }
    return totalPrice;
  }

  factory BookingIntent.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic value) {
      if (value == null) return null;
      try {
        return DateTime.parse(value.toString());
      } catch (e) {
        debugPrint('⚠️ Error parsing date: $value - $e');
        return null;
      }
    }

    return BookingIntent(
      id: json['_id'] ?? json['id'] ?? '',
      intentId: json['intentId'] ?? '',
      tempOrderId: json['tempOrderId'],
      customerId: json['customerId'] is String
          ? json['customerId']
          : json['customerId']?['_id'] ?? '',
      hostId: json['hostId'] is String
          ? json['hostId']
          : json['hostId']?['_id'] ?? '',
      listingId: json['listingId'] is String
          ? json['listingId']
          : json['listingId']?['_id'] ?? '',
      bookingType: json['bookingType'] ?? 'entire_place',
      startDate: parseDate(json['startDate']) ?? DateTime.now(),
      endDate: parseDate(json['endDate']) ??
          DateTime.now().add(const Duration(days: 1)),
      totalPrice: (json['totalPrice'] ?? 0).toDouble(),
      status: BookingIntentStatus.fromString(json['status'] ?? 'locked'),
      paymentMethod: json['paymentMethod'] ?? 'vnpay',
      paymentType: json['paymentType'] ?? 'full',
      paymentAmount: (json['paymentAmount'] ?? 0).toDouble(),
      depositPercentage: json['depositPercentage'] ?? 0,
      depositAmount: (json['depositAmount'] ?? 0).toDouble(),
      remainingAmount: (json['remainingAmount'] ?? 0).toDouble(),
      lockedAt: parseDate(json['lockedAt']) ?? DateTime.now(),
      expiresAt: parseDate(json['expiresAt']) ??
          DateTime.now().add(const Duration(minutes: 10)),
      paidAt: parseDate(json['paidAt']),
      cancelledAt: parseDate(json['cancelledAt']),
      transactionId: json['transactionId'],
      vnpTransactionNo: json['vnpTransactionNo'],
      bookingId: json['bookingId'],
      customer: json['customerId'] is Map ? json['customerId'] : null,
      host: json['hostId'] is Map ? json['hostId'] : null,
      listing: json['listingId'] is Map ? json['listingId'] : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'intentId': intentId,
      'tempOrderId': tempOrderId,
      'customerId': customerId,
      'hostId': hostId,
      'listingId': listingId,
      'bookingType': bookingType,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'totalPrice': totalPrice,
      'status': status.value,
      'paymentMethod': paymentMethod,
      'paymentType': paymentType,
      'paymentAmount': paymentAmount,
      'depositPercentage': depositPercentage,
      'depositAmount': depositAmount,
      'remainingAmount': remainingAmount,
    };
  }
}

enum BookingIntentStatus {
  locked('locked'),
  paid('paid'),
  expired('expired'),
  cancelled('cancelled'),
  failed('failed');

  final String value;

  const BookingIntentStatus(this.value);

  static BookingIntentStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'locked':
        return BookingIntentStatus.locked;
      case 'paid':
        return BookingIntentStatus.paid;
      case 'expired':
        return BookingIntentStatus.expired;
      case 'cancelled':
        return BookingIntentStatus.cancelled;
      case 'failed':
        return BookingIntentStatus.failed;
      default:
        return BookingIntentStatus.locked;
    }
  }
}

/// Type alias for backward compatibility with state management code
typedef BookingIntentModel = BookingIntent;
