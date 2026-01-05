import 'package:equatable/equatable.dart';
import '../../core/enums/booking_enums.dart';

/// BookingModel for Cubit/BLoC state management
class BookingModel extends Equatable {
  final String id;
  final String customerId;
  final String hostId;
  final String listingId;
  final DateTime startDate;
  final DateTime endDate;
  final double totalPrice;

  // Status fields
  final BookingStatus bookingStatus;
  final PaymentStatus paymentStatus;
  final PaymentMethod paymentMethod;
  final PaymentType paymentType;

  // Payment fields
  final double depositAmount;
  final int depositPercentage;
  final double remainingAmount;
  final double paidAmount;
  final double finalTotalPrice;
  final DateTime? remainingDueDate;

  final DateTime? createdAt;
  final DateTime? updatedAt;

  // Extension
  final int extensionDays;
  final DateTime? newEndDate;
  final double extensionCost;
  final String? extensionStatus;

  // Listing data (populated)
  final Map<String, dynamic>? listing;
  final Map<String, dynamic>? host;
  final Map<String, dynamic>? customer;

  const BookingModel({
    required this.id,
    required this.customerId,
    required this.hostId,
    required this.listingId,
    required this.startDate,
    required this.endDate,
    required this.totalPrice,
    this.bookingStatus = BookingStatus.pending,
    this.paymentStatus = PaymentStatus.unpaid,
    this.paymentMethod = PaymentMethod.cash,
    this.paymentType = PaymentType.cash,
    this.depositAmount = 0,
    this.depositPercentage = 0,
    this.remainingAmount = 0,
    this.paidAmount = 0,
    this.finalTotalPrice = 0,
    this.remainingDueDate,
    this.createdAt,
    this.updatedAt,
    this.extensionDays = 0,
    this.newEndDate,
    this.extensionCost = 0,
    this.extensionStatus,
    this.listing,
    this.host,
    this.customer,
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
      bookingStatus: BookingStatus.fromString(json['bookingStatus'] ?? json['status'] ?? 'pending'),
      paymentStatus: PaymentStatus.fromString(json['paymentStatus']),
      paymentMethod: PaymentMethod.fromString(json['paymentMethod']),
      paymentType: PaymentType.fromString(json['paymentType']),
      depositAmount: (json['depositAmount'] ?? 0).toDouble(),
      depositPercentage: json['depositPercentage'] ?? 0,
      remainingAmount: (json['remainingAmount'] ?? 0).toDouble(),
      paidAmount: (json['paidAmount'] ?? 0).toDouble(),
      finalTotalPrice: (json['finalTotalPrice'] ?? json['totalPrice'] ?? 0).toDouble(),
      remainingDueDate: json['remainingDueDate'] != null ? _parseDate(json['remainingDueDate']) : null,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
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

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customerId': customerId,
      'hostId': hostId,
      'listingId': listingId,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'totalPrice': totalPrice,
      'bookingStatus': bookingStatus.value,
      'paymentStatus': paymentStatus.value,
      'paymentMethod': paymentMethod.value,
      'paymentType': paymentType.value,
      'depositAmount': depositAmount,
      'depositPercentage': depositPercentage,
      'remainingAmount': remainingAmount,
      'paidAmount': paidAmount,
      'finalTotalPrice': finalTotalPrice,
      'extensionDays': extensionDays,
      'extensionCost': extensionCost,
      'extensionStatus': extensionStatus,
    };
  }

  int get numberOfNights {
    final effectiveEndDate = newEndDate ?? endDate;
    return effectiveEndDate.difference(startDate).inDays;
  }

  bool get isPending => bookingStatus == BookingStatus.pending;
  bool get isApproved => bookingStatus == BookingStatus.approved;
  bool get isCompleted => bookingStatus == BookingStatus.completed;
  bool get isCancelled => bookingStatus == BookingStatus.cancelled;
  bool get isRejected => bookingStatus == BookingStatus.rejected;
  bool get isPaid => paymentStatus == PaymentStatus.paid;
  bool get isPartiallyPaid => paymentStatus == PaymentStatus.partiallyPaid;
  bool get hasDeposit => paymentType == PaymentType.deposit && depositAmount > 0;
  bool get hasRemainingPayment => remainingAmount > 0;

  String get listingTitle => listing?['title'] ?? 'Property';
  String get listingCity => listing?['city'] ?? '';
  String? get listingPhoto {
    final photos = listing?['listingPhotoPaths'] as List?;
    return photos?.isNotEmpty == true ? photos!.first.toString() : null;
  }

  BookingModel copyWith({
    String? id,
    String? customerId,
    String? hostId,
    String? listingId,
    DateTime? startDate,
    DateTime? endDate,
    double? totalPrice,
    BookingStatus? bookingStatus,
    PaymentStatus? paymentStatus,
    PaymentMethod? paymentMethod,
    PaymentType? paymentType,
    double? depositAmount,
    int? depositPercentage,
    double? remainingAmount,
    double? paidAmount,
    double? finalTotalPrice,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? extensionDays,
    DateTime? newEndDate,
    double? extensionCost,
    String? extensionStatus,
    Map<String, dynamic>? listing,
    Map<String, dynamic>? host,
    Map<String, dynamic>? customer,
  }) {
    return BookingModel(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      hostId: hostId ?? this.hostId,
      listingId: listingId ?? this.listingId,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      totalPrice: totalPrice ?? this.totalPrice,
      bookingStatus: bookingStatus ?? this.bookingStatus,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      paymentType: paymentType ?? this.paymentType,
      depositAmount: depositAmount ?? this.depositAmount,
      depositPercentage: depositPercentage ?? this.depositPercentage,
      remainingAmount: remainingAmount ?? this.remainingAmount,
      paidAmount: paidAmount ?? this.paidAmount,
      finalTotalPrice: finalTotalPrice ?? this.finalTotalPrice,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      extensionDays: extensionDays ?? this.extensionDays,
      newEndDate: newEndDate ?? this.newEndDate,
      extensionCost: extensionCost ?? this.extensionCost,
      extensionStatus: extensionStatus ?? this.extensionStatus,
      listing: listing ?? this.listing,
      host: host ?? this.host,
      customer: customer ?? this.customer,
    );
  }

  // Add empty factory method for initial state
  factory BookingModel.empty() {
    return BookingModel(
      id: '',
      customerId: '',
      hostId: '',
      listingId: '',
      startDate: DateTime.now(),
      endDate: DateTime.now(),
      totalPrice: 0,
    );
  }

  // Additional getters that were missing
  BookingStatus get status => bookingStatus;
  String? get agreementId => null; // TODO: Add if needed
  String? get agreementUrl => null; // TODO: Add if needed
  double get amountDue => remainingAmount;
  String? get cancellationReason => null; // TODO: Add if room rental needs it
  String? get transactionId => null; // TODO: Add from payment history if needed
  DateTime? get paidAt => null; // TODO: Add from payment history if needed

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
      ];
}

