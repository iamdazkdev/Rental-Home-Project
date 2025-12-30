/// Room Rental models for Flutter mobile app
/// Synced with backend RoomRental.js model

/// Rental Request Status enum
enum RentalRequestStatus {
  requested('REQUESTED'),
  approved('APPROVED'),
  rejected('REJECTED'),
  cancelled('CANCELLED');

  final String value;
  const RentalRequestStatus(this.value);

  static RentalRequestStatus fromString(String? status) {
    switch (status?.toUpperCase()) {
      case 'REQUESTED':
        return RentalRequestStatus.requested;
      case 'APPROVED':
        return RentalRequestStatus.approved;
      case 'REJECTED':
        return RentalRequestStatus.rejected;
      case 'CANCELLED':
        return RentalRequestStatus.cancelled;
      default:
        return RentalRequestStatus.requested;
    }
  }
}

/// Rental Agreement Status enum
enum RentalAgreementStatus {
  draft('DRAFT'),
  active('ACTIVE'),
  terminated('TERMINATED');

  final String value;
  const RentalAgreementStatus(this.value);

  static RentalAgreementStatus fromString(String? status) {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return RentalAgreementStatus.draft;
      case 'ACTIVE':
        return RentalAgreementStatus.active;
      case 'TERMINATED':
        return RentalAgreementStatus.terminated;
      default:
        return RentalAgreementStatus.draft;
    }
  }
}

/// Rental Status enum
enum RentalStatus {
  pendingMoveIn('PENDING_MOVE_IN'),
  active('ACTIVE'),
  terminating('TERMINATING'),
  completed('COMPLETED');

  final String value;
  const RentalStatus(this.value);

  static RentalStatus fromString(String? status) {
    switch (status?.toUpperCase()) {
      case 'PENDING_MOVE_IN':
        return RentalStatus.pendingMoveIn;
      case 'ACTIVE':
        return RentalStatus.active;
      case 'TERMINATING':
        return RentalStatus.terminating;
      case 'COMPLETED':
        return RentalStatus.completed;
      default:
        return RentalStatus.pendingMoveIn;
    }
  }
}

/// Rental Payment Status enum
enum RentalPaymentStatus {
  unpaid('UNPAID'),
  partiallyPaid('PARTIALLY_PAID'),
  paid('PAID');

  final String value;
  const RentalPaymentStatus(this.value);

  static RentalPaymentStatus fromString(String? status) {
    switch (status?.toUpperCase()) {
      case 'UNPAID':
        return RentalPaymentStatus.unpaid;
      case 'PARTIALLY_PAID':
        return RentalPaymentStatus.partiallyPaid;
      case 'PAID':
        return RentalPaymentStatus.paid;
      default:
        return RentalPaymentStatus.unpaid;
    }
  }
}

/// Rental Request model
class RentalRequest {
  final String id;
  final String roomId;
  final String tenantId;
  final String hostId;
  final String message;
  final DateTime moveInDate;
  final int intendedStayDuration; // in months
  final RentalRequestStatus status;
  final String? rejectionReason;
  final DateTime? reviewedAt;
  final DateTime createdAt;
  final DateTime? updatedAt;

  // Populated fields
  final dynamic room;
  final dynamic tenant;
  final dynamic host;

  // Computed display fields
  String? get roomTitle {
    if (room is Map) {
      return room['title'] ?? 'Room';
    }
    return null;
  }

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
    return RentalRequest(
      id: json['_id'] ?? json['id'] ?? '',
      roomId: json['roomId'] is Map ? json['roomId']['_id'] : (json['roomId'] ?? ''),
      tenantId: json['tenantId'] is Map ? json['tenantId']['_id'] : (json['tenantId'] ?? ''),
      hostId: json['hostId'] is Map ? json['hostId']['_id'] : (json['hostId'] ?? ''),
      message: json['message'] ?? '',
      moveInDate: json['moveInDate'] != null
        ? DateTime.parse(json['moveInDate'])
        : DateTime.now(),
      intendedStayDuration: json['intendedStayDuration'] ?? 1,
      status: RentalRequestStatus.fromString(json['status']),
      rejectionReason: json['rejectionReason'],
      reviewedAt: json['reviewedAt'] != null
        ? DateTime.parse(json['reviewedAt'])
        : null,
      createdAt: json['createdAt'] != null
        ? DateTime.parse(json['createdAt'])
        : DateTime.now(),
      updatedAt: json['updatedAt'] != null
        ? DateTime.parse(json['updatedAt'])
        : null,
      room: json['roomId'] is Map ? json['roomId'] : null,
      tenant: json['tenantId'] is Map ? json['tenantId'] : null,
      host: json['hostId'] is Map ? json['hostId'] : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'roomId': roomId,
      'tenantId': tenantId,
      'hostId': hostId,
      'message': message,
      'moveInDate': moveInDate.toIso8601String(),
      'intendedStayDuration': intendedStayDuration,
      'status': status.value,
    };
  }

  bool get isPending => status == RentalRequestStatus.requested;
  bool get isApproved => status == RentalRequestStatus.approved;
  bool get isRejected => status == RentalRequestStatus.rejected;
  bool get isCancelled => status == RentalRequestStatus.cancelled;
}

/// Rental Agreement model
class RentalAgreement {
  final String id;
  final String roomId;
  final String tenantId;
  final String hostId;
  final String rentalRequestId;
  final double rentAmount;
  final double depositAmount;
  final String paymentMethod;
  final int noticePeriod; // in days
  final List<String> houseRules;
  final RentalAgreementStatus status;
  final DateTime? agreedByTenantAt;
  final DateTime? agreedByHostAt;
  final DateTime createdAt;
  final DateTime? updatedAt;

  // Populated fields
  final dynamic room;
  final dynamic tenant;
  final dynamic host;

  // Computed display fields
  String? get roomTitle {
    if (room is Map) {
      return room['title'] ?? 'Room';
    }
    return null;
  }

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
    return RentalAgreement(
      id: json['_id'] ?? json['id'] ?? '',
      roomId: json['roomId'] is Map ? json['roomId']['_id'] : (json['roomId'] ?? ''),
      tenantId: json['tenantId'] is Map ? json['tenantId']['_id'] : (json['tenantId'] ?? ''),
      hostId: json['hostId'] is Map ? json['hostId']['_id'] : (json['hostId'] ?? ''),
      rentalRequestId: json['rentalRequestId'] ?? '',
      rentAmount: (json['rentAmount'] ?? 0).toDouble(),
      depositAmount: (json['depositAmount'] ?? 0).toDouble(),
      paymentMethod: json['paymentMethod'] ?? 'CASH',
      noticePeriod: json['noticePeriod'] ?? 30,
      houseRules: List<String>.from(json['houseRules'] ?? []),
      status: RentalAgreementStatus.fromString(json['status']),
      agreedByTenantAt: json['agreedByTenantAt'] != null
        ? DateTime.parse(json['agreedByTenantAt'])
        : null,
      agreedByHostAt: json['agreedByHostAt'] != null
        ? DateTime.parse(json['agreedByHostAt'])
        : null,
      createdAt: json['createdAt'] != null
        ? DateTime.parse(json['createdAt'])
        : DateTime.now(),
      updatedAt: json['updatedAt'] != null
        ? DateTime.parse(json['updatedAt'])
        : null,
      room: json['roomId'] is Map ? json['roomId'] : null,
      tenant: json['tenantId'] is Map ? json['tenantId'] : null,
      host: json['hostId'] is Map ? json['hostId'] : null,
    );
  }

  bool get isDraft => status == RentalAgreementStatus.draft;
  bool get isActive => status == RentalAgreementStatus.active;
  bool get isTerminated => status == RentalAgreementStatus.terminated;
  bool get isFullyAgreed => agreedByTenantAt != null && agreedByHostAt != null;
}

/// Rental Payment model
class RentalPayment {
  final String id;
  final String agreementId;
  final double amount;
  final String paymentType; // DEPOSIT, MONTHLY
  final String method; // ONLINE, CASH
  final RentalPaymentStatus status;
  final DateTime? paidAt;
  final DateTime? dueDate;
  final String? notes;
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

  factory RentalPayment.fromJson(Map<String, dynamic> json) {
    return RentalPayment(
      id: json['_id'] ?? json['id'] ?? '',
      agreementId: json['agreementId'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      paymentType: json['paymentType'] ?? 'MONTHLY',
      method: json['method'] ?? 'CASH',
      status: RentalPaymentStatus.fromString(json['status']),
      paidAt: json['paidAt'] != null
        ? DateTime.parse(json['paidAt'])
        : null,
      dueDate: json['dueDate'] != null
        ? DateTime.parse(json['dueDate'])
        : null,
      notes: json['notes'],
      createdAt: json['createdAt'] != null
        ? DateTime.parse(json['createdAt'])
        : DateTime.now(),
    );
  }

  bool get isPaid => status == RentalPaymentStatus.paid;
  bool get isUnpaid => status == RentalPaymentStatus.unpaid;
  bool get isOverdue => dueDate != null && dueDate!.isBefore(DateTime.now()) && !isPaid;
}

