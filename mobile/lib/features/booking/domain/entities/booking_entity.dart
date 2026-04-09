import 'package:equatable/equatable.dart';

class BookingEntity extends Equatable {
  final String id;
  final String customerId;
  final String hostId;
  final String listingId;
  final DateTime startDate;
  final DateTime endDate;
  final double totalPrice;
  
  final String bookingStatus;
  final String paymentStatus;
  final String paymentMethod;
  final String paymentType;

  final double depositAmount;
  final int depositPercentage;
  final double remainingAmount;
  final double paidAmount;
  final double finalTotalPrice;

  final DateTime? createdAt;
  final DateTime? updatedAt;

  // Extension Details
  final int extensionDays;
  final DateTime? newEndDate;
  final double extensionCost;
  final String? extensionStatus;

  // UI populated reference details
  final Map<String, dynamic>? listing;
  final Map<String, dynamic>? host;
  final Map<String, dynamic>? customer;

  const BookingEntity({
    required this.id,
    required this.customerId,
    required this.hostId,
    required this.listingId,
    required this.startDate,
    required this.endDate,
    required this.totalPrice,
    required this.bookingStatus,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.paymentType,
    this.depositAmount = 0,
    this.depositPercentage = 0,
    this.remainingAmount = 0,
    this.paidAmount = 0,
    this.finalTotalPrice = 0,
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

  // ============ CONVENIENCE GETTERS ============

  int get numberOfNights => endDate.difference(startDate).inDays;

  bool get isPending =>
      bookingStatus == 'pending' || bookingStatus == 'pending_approval';
  bool get isApproved =>
      bookingStatus == 'approved' || bookingStatus == 'accepted';
  bool get isCheckedIn => bookingStatus == 'checked_in';
  bool get isCheckedOut => bookingStatus == 'checked_out';
  bool get isCompleted => bookingStatus == 'completed';
  bool get isCancelled => bookingStatus == 'cancelled';
  bool get isRejected => bookingStatus == 'rejected';
  bool get isExpired => bookingStatus == 'expired';

  bool get isCashPayment => paymentMethod == 'cash';
  bool get isDepositPayment => paymentType == 'deposit';
  bool get isPartiallyPaid => paymentStatus == 'partially_paid';

  String get effectiveStatus => bookingStatus;

  double get effectiveRemainingAmount =>
      remainingAmount > 0 ? remainingAmount : totalPrice - depositAmount;

  bool get canCheckout => isApproved || isCheckedIn;
  bool get canExtend => isApproved || isCheckedIn;

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
