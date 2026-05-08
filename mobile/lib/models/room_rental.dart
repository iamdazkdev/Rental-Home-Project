/// Room Rental models for Flutter mobile app
/// Synced with backend RoomRental.js model
library;

import 'package:json_annotation/json_annotation.dart';

import '../core/utils/json_converters.dart';

part 'room_rental.g.dart';

/// Rental Request Status enum
@JsonEnum(valueField: 'value')
enum RentalRequestStatus {
  @JsonValue('REQUESTED')
  requested('REQUESTED'),
  @JsonValue('APPROVED')
  approved('APPROVED'),
  @JsonValue('REJECTED')
  rejected('REJECTED'),
  @JsonValue('CANCELLED')
  cancelled('CANCELLED');

  final String value;

  const RentalRequestStatus(this.value);
}

/// Rental Agreement Status enum
@JsonEnum(valueField: 'value')
enum RentalAgreementStatus {
  @JsonValue('DRAFT')
  draft('DRAFT'),
  @JsonValue('ACTIVE')
  active('ACTIVE'),
  @JsonValue('TERMINATED')
  terminated('TERMINATED');

  final String value;

  const RentalAgreementStatus(this.value);
}

/// Rental Status enum
@JsonEnum(valueField: 'value')
enum RentalStatus {
  @JsonValue('PENDING_MOVE_IN')
  pendingMoveIn('PENDING_MOVE_IN'),
  @JsonValue('ACTIVE')
  active('ACTIVE'),
  @JsonValue('TERMINATING')
  terminating('TERMINATING'),
  @JsonValue('COMPLETED')
  completed('COMPLETED');

  final String value;

  const RentalStatus(this.value);
}

/// Rental Payment Status enum
@JsonEnum(valueField: 'value')
enum RentalPaymentStatus {
  @JsonValue('UNPAID')
  unpaid('UNPAID'),
  @JsonValue('PARTIALLY_PAID')
  partiallyPaid('PARTIALLY_PAID'),
  @JsonValue('PAID')
  paid('PAID');

  final String value;

  const RentalPaymentStatus(this.value);
}

/// Helper to parse houseRules — can be String or List
List<String> _parseHouseRules(dynamic rules) {
  if (rules == null) return [];
  if (rules is String) {
    if (rules.isEmpty) return [];
    return rules.split('\n').where((r) => r.trim().isNotEmpty).toList();
  }
  if (rules is List) return rules.map((r) => r.toString()).toList();
  return [];
}

/// Rental Request model
@JsonSerializable()
class RentalRequest {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'roomId')
  @MongoIdConverter()
  final String roomId;

  @JsonKey(name: 'tenantId')
  @MongoIdConverter()
  final String tenantId;

  @JsonKey(name: 'hostId')
  @MongoIdConverter()
  final String hostId;

  @JsonKey(name: 'message', defaultValue: '')
  final String message;

  @JsonKey(name: 'moveInDate')
  @SafeDateTimeConverter()
  final DateTime moveInDate;

  @JsonKey(name: 'intendedStayDuration', defaultValue: 1)
  final int intendedStayDuration;

  @JsonKey(name: 'status', unknownEnumValue: RentalRequestStatus.requested)
  final RentalRequestStatus status;

  @JsonKey(name: 'rejectionReason')
  final String? rejectionReason;

  @JsonKey(name: 'reviewedAt')
  @NullableDateTimeConverter()
  final DateTime? reviewedAt;

  @JsonKey(name: 'createdAt')
  @SafeDateTimeConverter()
  final DateTime createdAt;

  @JsonKey(name: 'updatedAt')
  @NullableDateTimeConverter()
  final DateTime? updatedAt;

  // Populated fields
  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic room;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic tenant;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic host;

  RentalRequest({
    required this.id,
    required this.roomId,
    required this.tenantId,
    required this.hostId,
    required this.message,
    required this.moveInDate,
    required this.intendedStayDuration,
    required this.status,
    this.rejectionReason,
    this.reviewedAt,
    required this.createdAt,
    this.updatedAt,
    this.room,
    this.tenant,
    this.host,
  });

  factory RentalRequest.fromJson(Map<String, dynamic> json) {
    final dynamic room = json['roomId'] is Map ? json['roomId'] : null;
    final dynamic tenant = json['tenantId'] is Map ? json['tenantId'] : null;
    final dynamic host = json['hostId'] is Map ? json['hostId'] : null;

    final request = _$RentalRequestFromJson(json);
    return RentalRequest(
      id: request.id,
      roomId: request.roomId,
      tenantId: request.tenantId,
      hostId: request.hostId,
      message: request.message,
      moveInDate: request.moveInDate,
      intendedStayDuration: request.intendedStayDuration,
      status: request.status,
      rejectionReason: request.rejectionReason,
      reviewedAt: request.reviewedAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      room: room,
      tenant: tenant,
      host: host,
    );
  }

  Map<String, dynamic> toJson() => _$RentalRequestToJson(this);

  // Computed display fields
  String? get roomTitle => room is Map ? (room['title'] ?? 'Room') : null;

  String? get tenantName {
    if (tenant is Map) {
      return '${tenant['firstName'] ?? ''} ${tenant['lastName'] ?? ''}'.trim();
    }
    return null;
  }

  String? get hostName {
    if (host is Map) {
      return '${host['firstName'] ?? ''} ${host['lastName'] ?? ''}'.trim();
    }
    return null;
  }

  bool get isPending => status == RentalRequestStatus.requested;
  bool get isApproved => status == RentalRequestStatus.approved;
  bool get isRejected => status == RentalRequestStatus.rejected;
  bool get isCancelled => status == RentalRequestStatus.cancelled;
}

/// Rental Agreement model
@JsonSerializable()
class RentalAgreement {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'roomId')
  @MongoIdConverter()
  final String roomId;

  @JsonKey(name: 'tenantId')
  @MongoIdConverter()
  final String tenantId;

  @JsonKey(name: 'hostId')
  @MongoIdConverter()
  final String hostId;

  @JsonKey(name: 'rentalRequestId', defaultValue: '')
  final String rentalRequestId;

  @JsonKey(name: 'rentAmount')
  @SafeDoubleConverter()
  final double rentAmount;

  @JsonKey(name: 'depositAmount')
  @SafeDoubleConverter()
  final double depositAmount;

  @JsonKey(name: 'paymentMethod', defaultValue: 'CASH')
  final String paymentMethod;

  @JsonKey(name: 'noticePeriod', defaultValue: 30)
  final int noticePeriod;

  @JsonKey(name: 'houseRules', fromJson: _parseHouseRules)
  final List<String> houseRules;

  @JsonKey(name: 'status', unknownEnumValue: RentalAgreementStatus.draft)
  final RentalAgreementStatus status;

  @JsonKey(name: 'agreedByTenantAt')
  @NullableDateTimeConverter()
  final DateTime? agreedByTenantAt;

  @JsonKey(name: 'agreedByHostAt')
  @NullableDateTimeConverter()
  final DateTime? agreedByHostAt;

  @JsonKey(name: 'createdAt')
  @SafeDateTimeConverter()
  final DateTime createdAt;

  @JsonKey(name: 'updatedAt')
  @NullableDateTimeConverter()
  final DateTime? updatedAt;

  // Populated fields
  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic room;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic tenant;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic host;

  RentalAgreement({
    required this.id,
    required this.roomId,
    required this.tenantId,
    required this.hostId,
    required this.rentalRequestId,
    required this.rentAmount,
    required this.depositAmount,
    this.paymentMethod = 'CASH',
    this.noticePeriod = 30,
    this.houseRules = const [],
    required this.status,
    this.agreedByTenantAt,
    this.agreedByHostAt,
    required this.createdAt,
    this.updatedAt,
    this.room,
    this.tenant,
    this.host,
  });

  factory RentalAgreement.fromJson(Map<String, dynamic> json) {
    final dynamic room = json['roomId'] is Map ? json['roomId'] : null;
    final dynamic tenant = json['tenantId'] is Map ? json['tenantId'] : null;
    final dynamic host = json['hostId'] is Map ? json['hostId'] : null;

    final agreement = _$RentalAgreementFromJson(json);
    return RentalAgreement(
      id: agreement.id,
      roomId: agreement.roomId,
      tenantId: agreement.tenantId,
      hostId: agreement.hostId,
      rentalRequestId: agreement.rentalRequestId,
      rentAmount: agreement.rentAmount,
      depositAmount: agreement.depositAmount,
      paymentMethod: agreement.paymentMethod,
      noticePeriod: agreement.noticePeriod,
      houseRules: agreement.houseRules,
      status: agreement.status,
      agreedByTenantAt: agreement.agreedByTenantAt,
      agreedByHostAt: agreement.agreedByHostAt,
      createdAt: agreement.createdAt,
      updatedAt: agreement.updatedAt,
      room: room,
      tenant: tenant,
      host: host,
    );
  }

  Map<String, dynamic> toJson() => _$RentalAgreementToJson(this);

  // Computed display fields
  String? get roomTitle => room is Map ? (room['title'] ?? 'Room') : null;

  String? get tenantName {
    if (tenant is Map) {
      return '${tenant['firstName'] ?? ''} ${tenant['lastName'] ?? ''}'.trim();
    }
    return null;
  }

  String? get hostName {
    if (host is Map) {
      return '${host['firstName'] ?? ''} ${host['lastName'] ?? ''}'.trim();
    }
    return null;
  }

  String get houseRulesText => houseRules.join('\n');

  bool get isDraft => status == RentalAgreementStatus.draft;
  bool get isActive => status == RentalAgreementStatus.active;
  bool get isTerminated => status == RentalAgreementStatus.terminated;
  bool get isFullyAgreed => agreedByTenantAt != null && agreedByHostAt != null;
}

/// Rental Payment model
@JsonSerializable()
class RentalPayment {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'agreementId', defaultValue: '')
  final String agreementId;

  @JsonKey(name: 'amount')
  @SafeDoubleConverter()
  final double amount;

  @JsonKey(name: 'paymentType', defaultValue: 'MONTHLY')
  final String paymentType;

  @JsonKey(name: 'method', defaultValue: 'CASH')
  final String method;

  @JsonKey(name: 'status', unknownEnumValue: RentalPaymentStatus.unpaid)
  final RentalPaymentStatus status;

  @JsonKey(name: 'paidAt')
  @NullableDateTimeConverter()
  final DateTime? paidAt;

  @JsonKey(name: 'dueDate')
  @NullableDateTimeConverter()
  final DateTime? dueDate;

  @JsonKey(name: 'notes')
  final String? notes;

  @JsonKey(name: 'createdAt')
  @SafeDateTimeConverter()
  final DateTime createdAt;

  RentalPayment({
    required this.id,
    required this.agreementId,
    required this.amount,
    required this.paymentType,
    this.method = 'CASH',
    required this.status,
    this.paidAt,
    this.dueDate,
    this.notes,
    required this.createdAt,
  });

  factory RentalPayment.fromJson(Map<String, dynamic> json) =>
      _$RentalPaymentFromJson(json);

  Map<String, dynamic> toJson() => _$RentalPaymentToJson(this);

  bool get isPaid => status == RentalPaymentStatus.paid;
  bool get isUnpaid => status == RentalPaymentStatus.unpaid;
  bool get isOverdue =>
      dueDate != null && dueDate!.isBefore(DateTime.now()) && !isPaid;
}

/// Active Rental model for tracking current rentals
@JsonSerializable()
class ActiveRental {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'agreementId', defaultValue: '')
  final String agreementId;

  @JsonKey(name: 'roomId')
  @MongoIdConverter()
  final String roomId;

  @JsonKey(name: 'tenantId')
  @MongoIdConverter()
  final String tenantId;

  @JsonKey(name: 'hostId')
  @MongoIdConverter()
  final String hostId;

  @JsonKey(name: 'monthlyRent')
  @SafeDoubleConverter()
  final double monthlyRent;

  @JsonKey(name: 'nextPaymentDate')
  @NullableDateTimeConverter()
  final DateTime? nextPaymentDate;

  @JsonKey(name: 'status', defaultValue: 'ACTIVE')
  final String status;

  @JsonKey(name: 'createdAt')
  @SafeDateTimeConverter()
  final DateTime createdAt;

  // Populated fields
  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic room;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic tenant;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic host;

  ActiveRental({
    required this.id,
    required this.agreementId,
    required this.roomId,
    required this.tenantId,
    required this.hostId,
    required this.monthlyRent,
    this.nextPaymentDate,
    required this.status,
    required this.createdAt,
    this.room,
    this.tenant,
    this.host,
  });

  factory ActiveRental.fromJson(Map<String, dynamic> json) {
    final dynamic room = json['roomId'] is Map ? json['roomId'] : null;
    final dynamic tenant = json['tenantId'] is Map ? json['tenantId'] : null;
    final dynamic host = json['hostId'] is Map ? json['hostId'] : null;

    final rental = _$ActiveRentalFromJson(json);
    return ActiveRental(
      id: rental.id,
      roomId: rental.roomId,
      tenantId: rental.tenantId,
      hostId: rental.hostId,
      agreementId: rental.agreementId,
      monthlyRent: rental.monthlyRent,
      nextPaymentDate: rental.nextPaymentDate,
      status: rental.status,
      createdAt: rental.createdAt,
      room: room,
      tenant: tenant,
      host: host,
    );
  }

  Map<String, dynamic> toJson() => _$ActiveRentalToJson(this);

  // Computed display fields
  String? get roomTitle => room is Map ? (room['title'] ?? 'Room') : null;

  String? get tenantName {
    if (tenant is Map) {
      return '${tenant['firstName'] ?? ''} ${tenant['lastName'] ?? ''}'.trim();
    }
    return null;
  }

  String? get hostName {
    if (host is Map) {
      return '${host['firstName'] ?? ''} ${host['lastName'] ?? ''}'.trim();
    }
    return null;
  }
}
