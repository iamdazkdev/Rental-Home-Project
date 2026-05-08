import 'package:json_annotation/json_annotation.dart';

import '../core/utils/json_converters.dart';

part 'booking_intent.g.dart';

@JsonEnum(valueField: 'value')
enum BookingIntentStatus {
  @JsonValue('locked')
  locked('locked'),
  @JsonValue('paid')
  paid('paid'),
  @JsonValue('expired')
  expired('expired'),
  @JsonValue('cancelled')
  cancelled('cancelled'),
  @JsonValue('failed')
  failed('failed');

  final String value;

  const BookingIntentStatus(this.value);
}

@JsonSerializable()
class BookingIntent {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'intentId', defaultValue: '')
  final String intentId;

  @JsonKey(name: 'tempOrderId')
  final String? tempOrderId;

  @JsonKey(name: 'customerId')
  @MongoIdConverter()
  final String customerId;

  @JsonKey(name: 'hostId')
  @MongoIdConverter()
  final String hostId;

  @JsonKey(name: 'listingId')
  @MongoIdConverter()
  final String listingId;

  @JsonKey(name: 'bookingType', defaultValue: 'entire_place')
  final String bookingType;

  @JsonKey(name: 'startDate')
  @SafeDateTimeConverter()
  final DateTime startDate;

  @JsonKey(name: 'endDate')
  @SafeDateTimeConverter()
  final DateTime endDate;

  @JsonKey(name: 'totalPrice')
  @SafeDoubleConverter()
  final double totalPrice;

  @JsonKey(name: 'status', unknownEnumValue: BookingIntentStatus.locked)
  final BookingIntentStatus status;

  @JsonKey(name: 'paymentMethod', defaultValue: 'vnpay')
  final String paymentMethod;

  @JsonKey(name: 'paymentType', defaultValue: 'full')
  final String paymentType;

  @JsonKey(name: 'paymentAmount')
  @SafeDoubleConverter()
  final double paymentAmount;

  @JsonKey(name: 'depositPercentage')
  @SafeIntConverter()
  final int depositPercentage;

  @JsonKey(name: 'depositAmount')
  @SafeDoubleConverter()
  final double depositAmount;

  @JsonKey(name: 'remainingAmount')
  @SafeDoubleConverter()
  final double remainingAmount;

  @JsonKey(name: 'lockedAt')
  @SafeDateTimeConverter()
  final DateTime lockedAt;

  @JsonKey(name: 'expiresAt')
  @SafeDateTimeConverter()
  final DateTime expiresAt;

  @JsonKey(name: 'paidAt')
  @NullableDateTimeConverter()
  final DateTime? paidAt;

  @JsonKey(name: 'cancelledAt')
  @NullableDateTimeConverter()
  final DateTime? cancelledAt;

  @JsonKey(name: 'transactionId')
  final String? transactionId;

  @JsonKey(name: 'vnpTransactionNo')
  final String? vnpTransactionNo;

  @JsonKey(name: 'bookingId')
  final String? bookingId;

  /// Populated fields from API joins (excluded from code gen)
  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic customer;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic host;

  @JsonKey(includeFromJson: false, includeToJson: false)
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

  factory BookingIntent.fromJson(Map<String, dynamic> json) {
    // Extract populated data
    final dynamic customer =
        json['customerId'] is Map ? json['customerId'] : null;
    final dynamic host = json['hostId'] is Map ? json['hostId'] : null;
    final dynamic listing = json['listingId'] is Map ? json['listingId'] : null;

    final intent = _$BookingIntentFromJson(json);
    return BookingIntent(
      id: intent.id,
      intentId: intent.intentId,
      tempOrderId: intent.tempOrderId,
      customerId: intent.customerId,
      hostId: intent.hostId,
      listingId: intent.listingId,
      bookingType: intent.bookingType,
      startDate: intent.startDate,
      endDate: intent.endDate,
      totalPrice: intent.totalPrice,
      status: intent.status,
      paymentMethod: intent.paymentMethod,
      paymentType: intent.paymentType,
      paymentAmount: intent.paymentAmount,
      depositPercentage: intent.depositPercentage,
      depositAmount: intent.depositAmount,
      remainingAmount: intent.remainingAmount,
      lockedAt: intent.lockedAt,
      expiresAt: intent.expiresAt,
      paidAt: intent.paidAt,
      cancelledAt: intent.cancelledAt,
      transactionId: intent.transactionId,
      vnpTransactionNo: intent.vnpTransactionNo,
      bookingId: intent.bookingId,
      customer: customer,
      host: host,
      listing: listing,
    );
  }

  Map<String, dynamic> toJson() => _$BookingIntentToJson(this);

  // --- Computed properties ---

  bool get isLocked => status == BookingIntentStatus.locked;
  bool get isPaid => status == BookingIntentStatus.paid;
  bool get isExpired => status == BookingIntentStatus.expired;
  bool get isCancelled => status == BookingIntentStatus.cancelled;
  bool get isFailed => status == BookingIntentStatus.failed;
  bool get isActive => isLocked && DateTime.now().isBefore(expiresAt);

  Duration get remainingTime => expiresAt.difference(DateTime.now());
  Duration get timeRemaining => remainingTime;

  bool get isValid => isActive && !isExpired;
  bool get isFullPayment => paymentType == 'full';

  double get effectivePaymentAmount {
    if (paymentType == 'deposit') return depositAmount;
    return totalPrice;
  }
}

/// Type alias for backward compatibility
typedef BookingIntentModel = BookingIntent;
