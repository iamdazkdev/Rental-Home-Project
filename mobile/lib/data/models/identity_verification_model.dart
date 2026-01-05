enum VerificationStatus {
  pending('pending'),
  approved('approved'),
  rejected('rejected');

  final String value;
  const VerificationStatus(this.value);

  static VerificationStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'pending':
        return VerificationStatus.pending;
      case 'approved':
        return VerificationStatus.approved;
      case 'rejected':
        return VerificationStatus.rejected;
      default:
        return VerificationStatus.pending;
    }
  }
}

class IdentityVerification {
  final String id;
  final String userId;
  final String fullName;
  final String phoneNumber;
  final DateTime dateOfBirth;
  final String? idCardFrontUrl;
  final String? idCardBackUrl;
  final VerificationStatus status;
  final String? rejectionReason;
  final DateTime createdAt;
  final DateTime updatedAt;

  IdentityVerification({
    required this.id,
    required this.userId,
    required this.fullName,
    required this.phoneNumber,
    required this.dateOfBirth,
    this.idCardFrontUrl,
    this.idCardBackUrl,
    required this.status,
    this.rejectionReason,
    required this.createdAt,
    required this.updatedAt,
  });

  factory IdentityVerification.fromJson(Map<String, dynamic> json) {
    return IdentityVerification(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      fullName: json['fullName'] ?? '',
      phoneNumber: json['phoneNumber'] ?? '',
      dateOfBirth: DateTime.parse(json['dateOfBirth']),
      idCardFrontUrl: json['idCardFrontUrl'],
      idCardBackUrl: json['idCardBackUrl'],
      status: VerificationStatus.fromString(json['status'] ?? 'pending'),
      rejectionReason: json['rejectionReason'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'dateOfBirth': dateOfBirth.toIso8601String(),
      'idCardFrontUrl': idCardFrontUrl,
      'idCardBackUrl': idCardBackUrl,
      'status': status.value,
      'rejectionReason': rejectionReason,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isApproved => status == VerificationStatus.approved;
  bool get isPending => status == VerificationStatus.pending;
  bool get isRejected => status == VerificationStatus.rejected;
}

