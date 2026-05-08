import 'package:json_annotation/json_annotation.dart';

import '../config/api_config.dart';
import '../core/utils/json_converters.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'firstName')
  final String firstName;

  @JsonKey(name: 'lastName')
  final String lastName;

  @JsonKey(name: 'email')
  final String email;

  @JsonKey(name: 'profileImagePath')
  final String? profileImagePath;

  @JsonKey(name: 'wishList')
  @StringListConverter()
  final List<String> wishlist;

  @JsonKey(name: 'propertyList')
  @StringListConverter()
  final List<String> propertyList;

  @JsonKey(name: 'tripList')
  @StringListConverter()
  final List<String> tripList;

  @JsonKey(name: 'reservationList')
  @StringListConverter()
  final List<String> reservationList;

  @JsonKey(name: 'createdAt')
  @NullableDateTimeConverter()
  final DateTime? memberSince;

  @JsonKey(name: 'sleepSchedule')
  final String? sleepSchedule;

  @JsonKey(name: 'isSmoker')
  final String? isSmoker;

  @JsonKey(name: 'cleanliness')
  final String? cleanliness;

  @JsonKey(name: 'personality')
  final String? personality;

  @JsonKey(name: 'noiseLevel')
  final String? noiseLevel;

  @JsonKey(name: 'bio')
  final String? bio;

  User({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.profileImagePath,
    this.wishlist = const [],
    this.propertyList = const [],
    this.tripList = const [],
    this.reservationList = const [],
    this.memberSince,
    this.sleepSchedule,
    this.isSmoker,
    this.cleanliness,
    this.personality,
    this.noiseLevel,
    this.bio,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  Map<String, dynamic> toJson() => _$UserToJson(this);

  /// Full display name
  String get fullName => '$firstName $lastName';

  /// Profile image URL — resolves relative paths via ApiConfig.baseUrl
  String? get profileImage {
    if (profileImagePath == null || profileImagePath!.isEmpty) return null;
    if (profileImagePath!.startsWith('http')) return profileImagePath;
    return '${ApiConfig.baseUrl}/$profileImagePath';
  }

  User copyWith({
    String? id,
    String? firstName,
    String? lastName,
    String? email,
    String? profileImagePath,
    List<String>? wishlist,
    List<String>? propertyList,
    List<String>? tripList,
    List<String>? reservationList,
    DateTime? memberSince,
    String? sleepSchedule,
    String? isSmoker,
    String? cleanliness,
    String? personality,
    String? noiseLevel,
    String? bio,
  }) {
    return User(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      profileImagePath: profileImagePath ?? this.profileImagePath,
      wishlist: wishlist ?? this.wishlist,
      propertyList: propertyList ?? this.propertyList,
      tripList: tripList ?? this.tripList,
      reservationList: reservationList ?? this.reservationList,
      memberSince: memberSince ?? this.memberSince,
      sleepSchedule: sleepSchedule ?? this.sleepSchedule,
      isSmoker: isSmoker ?? this.isSmoker,
      cleanliness: cleanliness ?? this.cleanliness,
      personality: personality ?? this.personality,
      noiseLevel: noiseLevel ?? this.noiseLevel,
      bio: bio ?? this.bio,
    );
  }
}
