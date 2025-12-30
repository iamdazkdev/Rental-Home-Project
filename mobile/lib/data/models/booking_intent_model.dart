import 'package:equatable/equatable.dart';

class BookingIntentModel extends Equatable {
  final String id;
  final String tempOrderId;
  final String listingId;
  final String userId;
  final String hostId;
  final DateTime startDate;
  final DateTime endDate;
  final double totalPrice;
  final String paymentMethod;
  final String paymentType; // 'full' or 'deposit'
  final double paymentAmount;
  final double depositPercentage;
  final double depositAmount;
  final double remainingAmount;
  final DateTime expiresAt;
  final bool isExpired;
  final String status;

  const BookingIntentModel({
    required this.id,
    required this.tempOrderId,
    required this.listingId,
    required this.userId,
    required this.hostId,
    required this.startDate,
    required this.endDate,
    required this.totalPrice,
    required this.paymentMethod,
    required this.paymentType,
    required this.paymentAmount,
    required this.depositPercentage,
    required this.depositAmount,
    required this.remainingAmount,
    required this.expiresAt,
    required this.isExpired,
    required this.status,
  });

  factory BookingIntentModel.fromJson(Map<String, dynamic> json) {
    return BookingIntentModel(
      id: json['_id'] ?? json['id'] ?? '',
      tempOrderId: json['tempOrderId'] ?? '',
      listingId: json['listingId'] ?? '',
      userId: json['customerId'] ?? json['userId'] ?? '',
      hostId: json['hostId'] ?? '',
      startDate: DateTime.parse(json['startDate'] ?? DateTime.now().toIso8601String()),
      endDate: DateTime.parse(json['endDate'] ?? DateTime.now().toIso8601String()),
      totalPrice: (json['totalPrice'] ?? 0).toDouble(),
      paymentMethod: json['paymentMethod'] ?? 'vnpay',
      paymentType: json['paymentType'] ?? 'full',
      paymentAmount: (json['paymentAmount'] ?? 0).toDouble(),
      depositPercentage: (json['depositPercentage'] ?? 0).toDouble(),
      depositAmount: (json['depositAmount'] ?? 0).toDouble(),
      remainingAmount: (json['remainingAmount'] ?? 0).toDouble(),
      expiresAt: DateTime.parse(json['expiresAt'] ?? DateTime.now().toIso8601String()),
      isExpired: json['isExpired'] ?? false,
      status: json['status'] ?? 'LOCKED',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tempOrderId': tempOrderId,
      'listingId': listingId,
      'customerId': userId,
      'hostId': hostId,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'totalPrice': totalPrice,
      'paymentMethod': paymentMethod,
      'paymentType': paymentType,
      'paymentAmount': paymentAmount,
      'depositPercentage': depositPercentage,
      'depositAmount': depositAmount,
      'remainingAmount': remainingAmount,
      'expiresAt': expiresAt.toIso8601String(),
      'isExpired': isExpired,
      'status': status,
    };
  }

  Duration get timeRemaining {
    final now = DateTime.now();
    if (expiresAt.isBefore(now)) return Duration.zero;
    return expiresAt.difference(now);
  }

  bool get isValid => !isExpired && timeRemaining > Duration.zero && status == 'LOCKED';

  bool get isFullPayment => paymentType == 'full';
  bool get isDepositPayment => paymentType == 'deposit';

  @override
  List<Object?> get props => [
    id, tempOrderId, listingId, userId, hostId,
    startDate, endDate, totalPrice, paymentMethod, paymentType,
    paymentAmount, depositPercentage, depositAmount, remainingAmount,
    expiresAt, isExpired, status
  ];
}

