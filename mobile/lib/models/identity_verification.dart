import 'package:json_annotation/json_annotation.dart';

import '../core/utils/json_converters.dart';

part 'identity_verification.g.dart';

@JsonEnum(valueField: 'value')
enum VerificationStatus {
  @JsonValue('pending')
  pending('pending'),
  @JsonValue('approved')
  approved('approved'),
  @JsonValue('rejected')
  rejected('rejected');

  final String value;

  const VerificationStatus(this.value);
}

@JsonSerializable()
class IdentityVerificationModel {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'userId')
  final String userId;

  @JsonKey(name: 'fullName')
  final String fullName;

  @JsonKey(name: 'phoneNumber')
  final String phoneNumber;

  @JsonKey(name: 'dateOfBirth')
  @SafeDateTimeConverter()
  final DateTime dateOfBirth;

  @JsonKey(name: 'idCardFrontUrl')
  final String? idCardFrontUrl;

  @JsonKey(name: 'idCardBackUrl')
  final String? idCardBackUrl;

  @JsonKey(name: 'status', unknownEnumValue: VerificationStatus.pending)
  final VerificationStatus status;

  @JsonKey(name: 'rejectionReason')
  final String? rejectionReason;

  @JsonKey(name: 'createdAt')
  @SafeDateTimeConverter()
  final DateTime createdAt;

  @JsonKey(name: 'updatedAt')
  @SafeDateTimeConverter()
  final DateTime updatedAt;

  IdentityVerificationModel({
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

  factory IdentityVerificationModel.fromJson(Map<String, dynamic> json) =>
      _$IdentityVerificationModelFromJson(json);

  Map<String, dynamic> toJson() => _$IdentityVerificationModelToJson(this);

  bool get isApproved => status == VerificationStatus.approved;
  bool get isPending => status == VerificationStatus.pending;
  bool get isRejected => status == VerificationStatus.rejected;
}
