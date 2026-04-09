import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String? profileImagePath;
  final List<String> wishlist;
  final List<String> propertyList;
  final List<String> tripList;
  final List<String> reservationList;
  final DateTime? memberSince;
  final String? sleepSchedule;
  final bool? isSmoker;
  final String? cleanliness;
  final String? personality;
  final String? noiseLevel;
  final String? bio;

  const UserEntity({
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

  String get fullName => '$firstName $lastName';

  String? get profileImage {
    if (profileImagePath == null || profileImagePath!.isEmpty) {
      return null;
    }
    if (profileImagePath!.startsWith('http')) {
      return profileImagePath;
    }
    return 'http://localhost:3001/$profileImagePath';
  }

  @override
  List<Object?> get props => [
        id,
        firstName,
        lastName,
        email,
        profileImagePath,
        wishlist,
        propertyList,
        tripList,
        reservationList,
        memberSince,
        sleepSchedule,
        isSmoker,
        cleanliness,
        personality,
        noiseLevel,
        bio,
      ];
}
