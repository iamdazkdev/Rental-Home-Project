import '../../domain/entities/booking_intent_entity.dart';

class BookingIntentModel extends BookingIntentEntity {
  const BookingIntentModel({
    required super.id,
    required super.intentId,
    super.tempOrderId,
    required super.customerId,
    required super.hostId,
    required super.listingId,
    super.bookingType,
    required super.startDate,
    required super.endDate,
    required super.totalPrice,
    required super.status,
    required super.paymentMethod,
    required super.paymentType,
    required super.paymentAmount,
    super.depositPercentage,
    super.depositAmount,
    super.remainingAmount,
    required super.lockedAt,
    required super.expiresAt,
    super.paidAt,
    super.cancelledAt,
    super.transactionId,
    super.vnpTransactionNo,
    super.bookingId,
  });

  factory BookingIntentModel.fromJson(Map<String, dynamic> json) {
    return BookingIntentModel(
      id: json['_id'] ?? json['id'] ?? '',
      intentId: json['intentId'] ?? '',
      tempOrderId: json['tempOrderId'],
      customerId: _extractId(json['customerId']),
      hostId: _extractId(json['hostId']),
      listingId: _extractId(json['listingId']),
      bookingType: json['bookingType'] ?? 'entire_place',
      startDate: _parseDate(json['startDate']),
      endDate: _parseDate(json['endDate']),
      totalPrice: (json['totalPrice'] ?? 0).toDouble(),
      status: json['status'] ?? 'locked',
      paymentMethod: json['paymentMethod'] ?? 'vnpay',
      paymentType: json['paymentType'] ?? 'full',
      paymentAmount: (json['paymentAmount'] ?? 0).toDouble(),
      depositPercentage: json['depositPercentage'] ?? 0,
      depositAmount: (json['depositAmount'] ?? 0).toDouble(),
      remainingAmount: (json['remainingAmount'] ?? 0).toDouble(),
      lockedAt: _parseDate(json['lockedAt']),
      expiresAt: _parseDate(json['expiresAt']),
      paidAt: json['paidAt'] != null ? DateTime.tryParse(json['paidAt']) : null,
      cancelledAt: json['cancelledAt'] != null ? DateTime.tryParse(json['cancelledAt']) : null,
      transactionId: json['transactionId'],
      vnpTransactionNo: json['vnpTransactionNo'],
      bookingId: json['bookingId'],
    );
  }

  static String _extractId(dynamic field) {
    if (field is Map) return field['_id'] ?? field['id'] ?? '';
    return field?.toString() ?? '';
  }

  static DateTime _parseDate(dynamic date) {
    if (date == null) return DateTime.now();
    if (date is DateTime) return date;
    try {
      return DateTime.parse(date.toString());
    } catch (e) {
      return DateTime.now();
    }
  }
}
