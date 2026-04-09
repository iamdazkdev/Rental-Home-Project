import '../../domain/entities/user.dart';

class UserModel extends UserEntity {
  const UserModel({
    required super.id,
    required super.firstName,
    required super.lastName,
    required super.email,
    super.profileImagePath,
    super.wishlist,
    super.propertyList,
    super.tripList,
    super.reservationList,
    super.memberSince,
    super.sleepSchedule,
    super.isSmoker,
    super.cleanliness,
    super.personality,
    super.noiseLevel,
    super.bio,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      email: json['email'] ?? '',
      profileImagePath: json['profileImagePath'],
      wishlist: json['wishList'] != null
          ? List<String>.from(json['wishList'].map((x) => x.toString()))
          : [],
      propertyList: json['propertyList'] != null
          ? List<String>.from(json['propertyList'].map((x) => x.toString()))
          : [],
      tripList: json['tripList'] != null
          ? List<String>.from(json['tripList'].map((x) => x.toString()))
          : [],
      reservationList: json['reservationList'] != null
          ? List<String>.from(json['reservationList'].map((x) => x.toString()))
          : [],
      memberSince: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      sleepSchedule: json['hostProfile']?['sleepSchedule'],
      isSmoker: json['hostProfile']?['isSmoker'],
      cleanliness: json['hostProfile']?['cleanliness'],
      personality: json['hostProfile']?['personality'],
      noiseLevel: json['hostProfile']?['noiseLevel'],
      bio: json['hostProfile']?['bio'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'profileImagePath': profileImagePath,
      'wishList': wishlist,
      'propertyList': propertyList,
      'tripList': tripList,
      'reservationList': reservationList,
      'createdAt': memberSince?.toIso8601String(),
      'hostProfile': {
        'sleepSchedule': sleepSchedule,
        'isSmoker': isSmoker,
        'cleanliness': cleanliness,
        'personality': personality,
        'noiseLevel': noiseLevel,
        'bio': bio,
      },
    };
  }

  // To map from legacy User to UserModel if needed
  factory UserModel.fromEntity(UserEntity entity) {
    return UserModel(
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      profileImagePath: entity.profileImagePath,
      wishlist: entity.wishlist,
      propertyList: entity.propertyList,
      tripList: entity.tripList,
      reservationList: entity.reservationList,
      memberSince: entity.memberSince,
      sleepSchedule: entity.sleepSchedule,
      isSmoker: entity.isSmoker,
      cleanliness: entity.cleanliness,
      personality: entity.personality,
      noiseLevel: entity.noiseLevel,
      bio: entity.bio,
    );
  }
}
