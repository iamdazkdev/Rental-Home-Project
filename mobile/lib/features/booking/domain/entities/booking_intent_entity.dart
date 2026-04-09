import 'package:equatable/equatable.dart';

class BookingIntentEntity extends Equatable {
  final String id;
  final String intentId;
  final String? tempOrderId;
  final String customerId;
  final String hostId;
  final String listingId;
  final String bookingType;
  final DateTime startDate;
  final DateTime endDate;
  final double totalPrice;

  final String status;

  final String paymentMethod;
  final String paymentType;
  final double paymentAmount;
  final int depositPercentage;
  final double depositAmount;
  final double remainingAmount;

  final DateTime lockedAt;
  final DateTime expiresAt;
  final DateTime? paidAt;
  final DateTime? cancelledAt;

  final String? transactionId;
  final String? vnpTransactionNo;
  final String? bookingId;

  const BookingIntentEntity({
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
    required this.status,
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
  });

  bool get isActive => status == 'locked' && DateTime.now().isBefore(expiresAt);
  bool get isExpired => status == 'expired';
  bool get isValid => isActive && !isExpired;
  bool get isFullPayment => paymentType == 'full';
  Duration get timeRemaining => expiresAt.difference(DateTime.now());

  @override
  List<Object?> get props => [
        id,
        intentId,
        tempOrderId,
        customerId,
        hostId,
        listingId,
        bookingType,
        startDate,
        endDate,
        totalPrice,
        status,
        paymentMethod,
        paymentType,
        paymentAmount,
        depositPercentage,
        depositAmount,
        remainingAmount,
        lockedAt,
        expiresAt,
        paidAt,
        cancelledAt,
        transactionId,
        vnpTransactionNo,
        bookingId,
      ];
}
