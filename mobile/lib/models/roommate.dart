/// Roommate models for Flutter mobile app
/// Synced with backend RoommatePost.js, RoommateRequest.js, RoommateMatch.js
library;

import 'package:json_annotation/json_annotation.dart';

import '../core/utils/json_converters.dart';

part 'roommate.g.dart';

/// Roommate Post Type enum
@JsonEnum(valueField: 'value')
enum RoommatePostType {
  @JsonValue('SEEKER')
  seeker('SEEKER'),
  @JsonValue('PROVIDER')
  provider('PROVIDER');

  final String value;

  const RoommatePostType(this.value);

  String get displayName {
    switch (this) {
      case RoommatePostType.seeker:
        return 'Looking for Room';
      case RoommatePostType.provider:
        return 'Has Room Available';
    }
  }
}

/// Roommate Post Status enum
@JsonEnum(valueField: 'value')
enum RoommatePostStatus {
  @JsonValue('ACTIVE')
  active('ACTIVE'),
  @JsonValue('MATCHED')
  matched('MATCHED'),
  @JsonValue('CLOSED')
  closed('CLOSED');

  final String value;

  const RoommatePostStatus(this.value);
}

/// Roommate Request Status enum
@JsonEnum(valueField: 'value')
enum RoommateRequestStatus {
  @JsonValue('PENDING')
  pending('PENDING'),
  @JsonValue('ACCEPTED')
  accepted('ACCEPTED'),
  @JsonValue('REJECTED')
  rejected('REJECTED');

  final String value;

  const RoommateRequestStatus(this.value);
}

/// Lifestyle preferences model
@JsonSerializable()
class LifestylePreferences {
  @JsonKey(name: 'sleepSchedule', defaultValue: 'FLEXIBLE')
  final String sleepSchedule;

  @JsonKey(name: 'smoking', defaultValue: 'NO')
  final String smoking;

  @JsonKey(name: 'pets', defaultValue: 'NEGOTIABLE')
  final String pets;

  @JsonKey(name: 'cleanliness', defaultValue: 'MODERATE')
  final String cleanliness;

  @JsonKey(name: 'occupation')
  final String? occupation;

  LifestylePreferences({
    this.sleepSchedule = 'FLEXIBLE',
    this.smoking = 'NO',
    this.pets = 'NEGOTIABLE',
    this.cleanliness = 'MODERATE',
    this.occupation,
  });

  factory LifestylePreferences.fromJson(Map<String, dynamic>? json) {
    if (json == null) return LifestylePreferences();
    return _$LifestylePreferencesFromJson(json);
  }

  Map<String, dynamic> toJson() => _$LifestylePreferencesToJson(this);

  String get sleepScheduleDisplay {
    switch (sleepSchedule) {
      case 'EARLY_BIRD':
        return 'Early Bird';
      case 'NIGHT_OWL':
        return 'Night Owl';
      default:
        return 'Flexible';
    }
  }

  String get smokingDisplay {
    switch (smoking) {
      case 'YES':
        return 'Smoker';
      case 'OUTSIDE_ONLY':
        return 'Outside Only';
      default:
        return 'Non-smoker';
    }
  }

  String get petsDisplay {
    switch (pets) {
      case 'YES':
        return 'Has Pets';
      case 'NO':
        return 'No Pets';
      default:
        return 'Negotiable';
    }
  }

  String get cleanlinessDisplay {
    switch (cleanliness) {
      case 'VERY_CLEAN':
        return 'Very Clean';
      case 'RELAXED':
        return 'Relaxed';
      default:
        return 'Moderate';
    }
  }

  bool get isNotEmpty =>
      sleepSchedule.isNotEmpty ||
      smoking.isNotEmpty ||
      pets.isNotEmpty ||
      cleanliness.isNotEmpty;

  List<MapEntry<String, String>> get entries => [
        MapEntry('sleep', sleepScheduleDisplay),
        MapEntry('smoking', smokingDisplay),
        MapEntry('pets', petsDisplay),
        MapEntry('cleanliness', cleanlinessDisplay),
      ];

  Map<String, String> get entriesMap => {
        'sleep': sleepScheduleDisplay,
        'smoking': smokingDisplay,
        'pets': petsDisplay,
        'cleanliness': cleanlinessDisplay,
      };

  List<String> get displayList => [
        sleepScheduleDisplay,
        smokingDisplay,
        petsDisplay,
        cleanlinessDisplay,
      ];
}

/// Roommate Post model
@JsonSerializable()
class RoommatePost {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'userId')
  @MongoIdConverter()
  final String userId;

  @JsonKey(name: 'postType', unknownEnumValue: RoommatePostType.seeker)
  final RoommatePostType postType;

  @JsonKey(name: 'title', defaultValue: '')
  final String title;

  @JsonKey(name: 'description', defaultValue: '')
  final String description;

  @JsonKey(name: 'city', defaultValue: '')
  final String city;

  @JsonKey(name: 'province', defaultValue: '')
  final String province;

  @JsonKey(name: 'country', defaultValue: 'Vietnam')
  final String country;

  @JsonKey(name: 'budgetMin')
  @SafeDoubleConverter()
  final double budgetMin;

  @JsonKey(name: 'budgetMax')
  @SafeDoubleConverter()
  final double budgetMax;

  @JsonKey(name: 'moveInDate')
  @SafeDateTimeConverter()
  final DateTime moveInDate;

  @JsonKey(name: 'genderPreference', defaultValue: 'ANY')
  final String genderPreference;

  @JsonKey(name: 'ageRangeMin')
  final int? ageRangeMin;

  @JsonKey(name: 'ageRangeMax')
  final int? ageRangeMax;

  @JsonKey(name: 'lifestyle')
  final LifestylePreferences lifestyle;

  @JsonKey(name: 'preferredContact', defaultValue: 'CHAT')
  final String preferredContact;

  @JsonKey(name: 'phoneNumber')
  final String? phoneNumber;

  @JsonKey(name: 'emailAddress')
  final String? emailAddress;

  @JsonKey(name: 'photos')
  @StringListConverter()
  final List<String> photos;

  @JsonKey(name: 'status', unknownEnumValue: RoommatePostStatus.active)
  final RoommatePostStatus status;

  @JsonKey(name: 'viewCount', defaultValue: 0)
  final int viewCount;

  @JsonKey(name: 'createdAt')
  @SafeDateTimeConverter()
  final DateTime createdAt;

  @JsonKey(name: 'updatedAt')
  @NullableDateTimeConverter()
  final DateTime? updatedAt;

  // Populated field
  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic user;

  RoommatePost({
    required this.id,
    required this.userId,
    required this.postType,
    required this.title,
    required this.description,
    required this.city,
    required this.province,
    required this.country,
    required this.budgetMin,
    required this.budgetMax,
    required this.moveInDate,
    this.genderPreference = 'ANY',
    this.ageRangeMin,
    this.ageRangeMax,
    LifestylePreferences? lifestyle,
    this.preferredContact = 'CHAT',
    this.phoneNumber,
    this.emailAddress,
    this.photos = const [],
    required this.status,
    this.viewCount = 0,
    required this.createdAt,
    this.updatedAt,
    this.user,
  }) : lifestyle = lifestyle ?? LifestylePreferences();

  factory RoommatePost.fromJson(Map<String, dynamic> json) {
    final dynamic user = json['userId'] is Map ? json['userId'] : null;

    // Handle photos/images alias
    final normalized = Map<String, dynamic>.from(json);
    normalized['photos'] = json['images'] ?? json['photos'] ?? [];

    final post = _$RoommatePostFromJson(normalized);
    return RoommatePost(
      id: post.id,
      userId: post.userId,
      postType: post.postType,
      title: post.title,
      description: post.description,
      city: post.city,
      province: post.province,
      country: post.country,
      budgetMin: post.budgetMin,
      budgetMax: post.budgetMax,
      moveInDate: post.moveInDate,
      genderPreference: post.genderPreference,
      ageRangeMin: post.ageRangeMin,
      ageRangeMax: post.ageRangeMax,
      lifestyle: post.lifestyle,
      preferredContact: post.preferredContact,
      phoneNumber: post.phoneNumber,
      emailAddress: post.emailAddress,
      photos: post.photos,
      status: post.status,
      viewCount: post.viewCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: user,
    );
  }

  Map<String, dynamic> toJson() => _$RoommatePostToJson(this);

  String get locationString => '$city, $province';

  String get budgetRangeString =>
      '${budgetMin.toStringAsFixed(0)} - ${budgetMax.toStringAsFixed(0)}';

  bool get isActive => status == RoommatePostStatus.active;
  bool get isSeeker => postType == RoommatePostType.seeker;
  bool get isProvider => postType == RoommatePostType.provider;

  String? get userName {
    if (user is Map) {
      final userMap = user as Map<String, dynamic>;
      return '${userMap['firstName'] ?? ''} ${userMap['lastName'] ?? ''}'
          .trim();
    }
    return null;
  }

  String get formattedDate =>
      '${createdAt.day}/${createdAt.month}/${createdAt.year}';

  String get formattedMoveInDate =>
      '${moveInDate.day}/${moveInDate.month}/${moveInDate.year}';
}

/// Roommate Request model
@JsonSerializable()
class RoommateRequest {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'postId')
  @MongoIdConverter()
  final String postId;

  @JsonKey(name: 'senderId')
  @MongoIdConverter()
  final String senderId;

  @JsonKey(name: 'receiverId')
  @MongoIdConverter()
  final String receiverId;

  @JsonKey(name: 'message', defaultValue: '')
  final String message;

  @JsonKey(name: 'status', unknownEnumValue: RoommateRequestStatus.pending)
  final RoommateRequestStatus status;

  @JsonKey(name: 'createdAt')
  @SafeDateTimeConverter()
  final DateTime createdAt;

  // Populated fields
  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic post;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic sender;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic receiver;

  RoommateRequest({
    required this.id,
    required this.postId,
    required this.senderId,
    required this.receiverId,
    required this.message,
    required this.status,
    required this.createdAt,
    this.post,
    this.sender,
    this.receiver,
  });

  factory RoommateRequest.fromJson(Map<String, dynamic> json) {
    final dynamic post = json['postId'] is Map ? json['postId'] : null;
    final dynamic sender = json['senderId'] is Map ? json['senderId'] : null;
    final dynamic receiver =
        json['receiverId'] is Map ? json['receiverId'] : null;

    final request = _$RoommateRequestFromJson(json);
    return RoommateRequest(
      id: request.id,
      postId: request.postId,
      senderId: request.senderId,
      receiverId: request.receiverId,
      message: request.message,
      status: request.status,
      createdAt: request.createdAt,
      post: post,
      sender: sender,
      receiver: receiver,
    );
  }

  Map<String, dynamic> toJson() => _$RoommateRequestToJson(this);

  bool get isPending => status == RoommateRequestStatus.pending;
  bool get isAccepted => status == RoommateRequestStatus.accepted;
  bool get isRejected => status == RoommateRequestStatus.rejected;

  String? get senderName {
    if (sender is Map) {
      final senderMap = sender as Map<String, dynamic>;
      return '${senderMap['firstName'] ?? ''} ${senderMap['lastName'] ?? ''}'
          .trim();
    }
    return null;
  }

  String? get receiverName {
    if (receiver is Map) {
      final receiverMap = receiver as Map<String, dynamic>;
      return '${receiverMap['firstName'] ?? ''} ${receiverMap['lastName'] ?? ''}'
          .trim();
    }
    return null;
  }

  String? get postTitle {
    if (post is Map) {
      final postMap = post as Map<String, dynamic>;
      return postMap['title'];
    }
    return null;
  }

  String get formattedDate {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays > 7) {
      return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}

/// Roommate Match model
@JsonSerializable()
class RoommateMatch {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'postId')
  @MongoIdConverter()
  final String postId;

  @JsonKey(name: 'userAId')
  @MongoIdConverter()
  final String userAId;

  @JsonKey(name: 'userBId')
  @MongoIdConverter()
  final String userBId;

  @JsonKey(name: 'matchedAt')
  @SafeDateTimeConverter()
  final DateTime matchedAt;

  // Populated fields
  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic post;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic userA;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final dynamic userB;

  RoommateMatch({
    required this.id,
    required this.postId,
    required this.userAId,
    required this.userBId,
    required this.matchedAt,
    this.post,
    this.userA,
    this.userB,
  });

  factory RoommateMatch.fromJson(Map<String, dynamic> json) {
    final dynamic post = json['postId'] is Map ? json['postId'] : null;
    final dynamic userA = json['userAId'] is Map ? json['userAId'] : null;
    final dynamic userB = json['userBId'] is Map ? json['userBId'] : null;

    final match = _$RoommateMatchFromJson(json);
    return RoommateMatch(
      id: match.id,
      postId: match.postId,
      userAId: match.userAId,
      userBId: match.userBId,
      matchedAt: match.matchedAt,
      post: post,
      userA: userA,
      userB: userB,
    );
  }

  Map<String, dynamic> toJson() => _$RoommateMatchToJson(this);
}
