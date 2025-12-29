import 'package:equatable/equatable.dart';

class BookingIntentModel extends Equatable {
  final String id;
  final String listingId;
  final String userId;
  final DateTime expiresAt;
  final bool isExpired;
  final String status;

  const BookingIntentModel({
    required this.id,
    required this.listingId,
    required this.userId,
    required this.expiresAt,
    required this.isExpired,
    required this.status,
  });

  factory BookingIntentModel.fromJson(Map<String, dynamic> json) {
    return BookingIntentModel(
      id: json['id'] ?? '',
      listingId: json['listingId'] ?? '',
      userId: json['userId'] ?? '',
      expiresAt: DateTime.parse(json['expiresAt'] ?? DateTime.now().toIso8601String()),
      isExpired: json['isExpired'] ?? false,
      status: json['status'] ?? 'PENDING',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'listingId': listingId,
      'userId': userId,
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

  bool get isValid => !isExpired && timeRemaining > Duration.zero;

  @override
  List<Object?> get props => [id, listingId, userId, expiresAt, isExpired, status];
}

