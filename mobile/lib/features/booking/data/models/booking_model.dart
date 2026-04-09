import '../../domain/entities/booking_entity.dart';

class BookingModel extends BookingEntity {
  const BookingModel({
    required super.id,
    required super.customerId,
    required super.hostId,
    required super.listingId,
    required super.startDate,
    required super.endDate,
    required super.totalPrice,
    required super.bookingStatus,
    required super.paymentStatus,
    required super.paymentMethod,
    required super.paymentType,
    super.depositAmount,
    super.depositPercentage,
    super.remainingAmount,
    super.paidAmount,
    super.finalTotalPrice,
    super.createdAt,
    super.updatedAt,
    super.extensionDays,
    super.newEndDate,
    super.extensionCost,
    super.extensionStatus,
    super.listing,
    super.host,
    super.customer,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    return BookingModel(
      id: json['_id'] ?? json['id'] ?? '',
      customerId: _extractId(json['customerId']),
      hostId: _extractId(json['hostId']),
      listingId: _extractId(json['listingId']),
      startDate: _parseDate(json['startDate']),
      endDate: _parseDate(json['endDate']),
      totalPrice: (json['totalPrice'] ?? 0).toDouble(),
      bookingStatus: json['bookingStatus'] ?? json['status'] ?? 'pending',
      paymentStatus: json['paymentStatus'] ?? 'unpaid',
      paymentMethod: json['paymentMethod'] ?? 'cash',
      paymentType: json['paymentType'] ?? 'cash',
      depositAmount: (json['depositAmount'] ?? 0).toDouble(),
      depositPercentage: json['depositPercentage'] ?? 0,
      remainingAmount: (json['remainingAmount'] ?? 0).toDouble(),
      paidAmount: (json['paidAmount'] ?? 0).toDouble(),
      finalTotalPrice: (json['finalTotalPrice'] ?? json['totalPrice'] ?? 0).toDouble(),
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt']) : null,
      extensionDays: json['extensionDays'] ?? 0,
      newEndDate: json['newEndDate'] != null ? _parseDate(json['newEndDate']) : null,
      extensionCost: (json['extensionCost'] ?? 0).toDouble(),
      extensionStatus: json['extensionStatus'],
      listing: json['listingId'] is Map ? json['listingId'] : null,
      host: json['hostId'] is Map ? json['hostId'] : null,
      customer: json['customerId'] is Map ? json['customerId'] : null,
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
