import '../../domain/entities/roommate_entity.dart';

class RoommateModel extends RoommateEntity {
  const RoommateModel({
    required super.id,
    required super.userId,
    required super.postType,
    required super.title,
    required super.description,
    required super.city,
    required super.province,
    required super.country,
    required super.budgetMin,
    required super.budgetMax,
    required super.moveInDate,
    super.genderPreference = 'ANY',
    super.ageRangeMin,
    super.ageRangeMax,
    required super.lifestyle,
    super.preferredContact = 'CHAT',
    super.phoneNumber,
    super.emailAddress,
    super.photos = const [],
    required super.status,
    super.viewCount = 0,
    required super.createdAt,
    super.updatedAt,
    super.userData,
  });

  factory RoommateModel.fromJson(Map<String, dynamic> json) {
    return RoommateModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] is Map
          ? json['userId']['_id']
          : (json['userId'] ?? ''),
      postType: RoommatePostType.fromString(json['postType']),
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      city: json['city'] ?? '',
      province: json['province'] ?? '',
      country: json['country'] ?? 'Vietnam',
      budgetMin: (json['budgetMin'] ?? 0).toDouble(),
      budgetMax: (json['budgetMax'] ?? 0).toDouble(),
      moveInDate: json['moveInDate'] != null
          ? DateTime.parse(json['moveInDate'])
          : DateTime.now(),
      genderPreference: json['genderPreference'] ?? 'ANY',
      ageRangeMin: json['ageRangeMin'],
      ageRangeMax: json['ageRangeMax'],
      lifestyle: LifestylePreferences(
        sleepSchedule: json['lifestyle']?['sleepSchedule'] ?? 'FLEXIBLE',
        smoking: json['lifestyle']?['smoking'] ?? 'NO',
        pets: json['lifestyle']?['pets'] ?? 'NEGOTIABLE',
        cleanliness: json['lifestyle']?['cleanliness'] ?? 'MODERATE',
        occupation: json['lifestyle']?['occupation'],
      ),
      preferredContact: json['preferredContact'] ?? 'CHAT',
      phoneNumber: json['phoneNumber'],
      emailAddress: json['emailAddress'],
      photos: List<String>.from(json['images'] ?? json['photos'] ?? []),
      status: RoommatePostStatus.fromString(json['status']),
      viewCount: json['viewCount'] ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      userData: json['userId'] is Map ? json['userId'] : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'postType': postType.value,
      'title': title,
      'description': description,
      'city': city,
      'province': province,
      'country': country,
      'budgetMin': budgetMin,
      'budgetMax': budgetMax,
      'moveInDate': moveInDate.toIso8601String(),
      'genderPreference': genderPreference,
      'ageRangeMin': ageRangeMin,
      'ageRangeMax': ageRangeMax,
      'lifestyle': {
        'sleepSchedule': lifestyle.sleepSchedule,
        'smoking': lifestyle.smoking,
        'pets': lifestyle.pets,
        'cleanliness': lifestyle.cleanliness,
        'occupation': lifestyle.occupation,
      },
      'preferredContact': preferredContact,
      'phoneNumber': phoneNumber,
      'emailAddress': emailAddress,
      'photos': photos,
      'status': status.value,
    };
  }
}

class RoommateRequestModel extends RoommateRequestEntity {
  const RoommateRequestModel({
    required super.id,
    required super.postId,
    required super.senderId,
    required super.receiverId,
    required super.message,
    required super.status,
    required super.createdAt,
    super.postData,
    super.senderData,
    super.receiverData,
  });

  factory RoommateRequestModel.fromJson(Map<String, dynamic> json) {
    return RoommateRequestModel(
      id: json['_id'] ?? json['id'] ?? '',
      postId: json['postId'] is Map ? json['postId']['_id'] : (json['postId'] ?? ''),
      senderId: json['senderId'] is Map ? json['senderId']['_id'] : (json['senderId'] ?? ''),
      receiverId: json['receiverId'] is Map ? json['receiverId']['_id'] : (json['receiverId'] ?? ''),
      message: json['message'] ?? '',
      status: RoommateRequestStatus.fromString(json['status']),
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      postData: json['postId'] is Map ? json['postId'] : null,
      senderData: json['senderId'] is Map ? json['senderId'] : null,
      receiverData: json['receiverId'] is Map ? json['receiverId'] : null,
    );
  }
}

class RoommateMatchModel extends RoommateMatchEntity {
  const RoommateMatchModel({
    required super.id,
    required super.postId,
    required super.userAId,
    required super.userBId,
    required super.matchedAt,
    super.postData,
    super.userAData,
    super.userBData,
  });

  factory RoommateMatchModel.fromJson(Map<String, dynamic> json) {
    return RoommateMatchModel(
      id: json['_id'] ?? json['id'] ?? '',
      postId: json['postId'] is Map ? json['postId']['_id'] : (json['postId'] ?? ''),
      userAId: json['userAId'] is Map ? json['userAId']['_id'] : (json['userAId'] ?? ''),
      userBId: json['userBId'] is Map ? json['userBId']['_id'] : (json['userBId'] ?? ''),
      matchedAt: json['matchedAt'] != null ? DateTime.parse(json['matchedAt']) : DateTime.now(),
      postData: json['postId'] is Map ? json['postId'] : null,
      userAData: json['userAId'] is Map ? json['userAId'] : null,
      userBData: json['userBId'] is Map ? json['userBId'] : null,
    );
  }
}
