/// Roommate models for Flutter mobile app
/// Synced with backend RoommatePost.js, RoommateRequest.js, RoommateMatch.js
library;

/// Roommate Post Type enum
enum RoommatePostType {
  seeker('SEEKER'),
  provider('PROVIDER');

  final String value;

  const RoommatePostType(this.value);

  static RoommatePostType fromString(String? type) {
    switch (type?.toUpperCase()) {
      case 'SEEKER':
        return RoommatePostType.seeker;
      case 'PROVIDER':
        return RoommatePostType.provider;
      default:
        return RoommatePostType.seeker;
    }
  }

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
enum RoommatePostStatus {
  active('ACTIVE'),
  matched('MATCHED'),
  closed('CLOSED');

  final String value;

  const RoommatePostStatus(this.value);

  static RoommatePostStatus fromString(String? status) {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return RoommatePostStatus.active;
      case 'MATCHED':
        return RoommatePostStatus.matched;
      case 'CLOSED':
        return RoommatePostStatus.closed;
      default:
        return RoommatePostStatus.active;
    }
  }
}

/// Roommate Request Status enum
enum RoommateRequestStatus {
  pending('PENDING'),
  accepted('ACCEPTED'),
  rejected('REJECTED');

  final String value;

  const RoommateRequestStatus(this.value);

  static RoommateRequestStatus fromString(String? status) {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return RoommateRequestStatus.pending;
      case 'ACCEPTED':
        return RoommateRequestStatus.accepted;
      case 'REJECTED':
        return RoommateRequestStatus.rejected;
      default:
        return RoommateRequestStatus.pending;
    }
  }
}

/// Lifestyle preferences model
class LifestylePreferences {
  final String sleepSchedule; // EARLY_BIRD, NIGHT_OWL, FLEXIBLE
  final String smoking; // YES, NO, OUTSIDE_ONLY
  final String pets; // YES, NO, NEGOTIABLE
  final String cleanliness; // VERY_CLEAN, MODERATE, RELAXED
  final String? occupation; // STUDENT, PROFESSIONAL, FREELANCER, OTHER

  LifestylePreferences({
    this.sleepSchedule = 'FLEXIBLE',
    this.smoking = 'NO',
    this.pets = 'NEGOTIABLE',
    this.cleanliness = 'MODERATE',
    this.occupation,
  });

  factory LifestylePreferences.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return LifestylePreferences();
    }
    return LifestylePreferences(
      sleepSchedule: json['sleepSchedule'] ?? 'FLEXIBLE',
      smoking: json['smoking'] ?? 'NO',
      pets: json['pets'] ?? 'NEGOTIABLE',
      cleanliness: json['cleanliness'] ?? 'MODERATE',
      occupation: json['occupation'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'sleepSchedule': sleepSchedule,
      'smoking': smoking,
      'pets': pets,
      'cleanliness': cleanliness,
      'occupation': occupation,
    };
  }

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
class RoommatePost {
  final String id;
  final String userId;
  final RoommatePostType postType;
  final String title;
  final String description;

  // Location
  final String city;
  final String province;
  final String country;

  // Budget
  final double budgetMin;
  final double budgetMax;

  // Move-in date
  final DateTime moveInDate;

  // Preferences
  final String genderPreference; // MALE, FEMALE, ANY
  final int? ageRangeMin;
  final int? ageRangeMax;

  // Lifestyle
  final LifestylePreferences lifestyle;

  // Contact
  final String preferredContact; // CHAT, PHONE, EMAIL
  final String? phoneNumber;
  final String? emailAddress;

  // Media
  final List<String> photos;

  // Status
  final RoommatePostStatus status;
  final int viewCount;
  final DateTime createdAt;
  final DateTime? updatedAt;

  // Populated user
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
    return RoommatePost(
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
      lifestyle: LifestylePreferences.fromJson(json['lifestyle']),
      preferredContact: json['preferredContact'] ?? 'CHAT',
      phoneNumber: json['phoneNumber'],
      emailAddress: json['emailAddress'],
      photos: List<String>.from(json['images'] ?? json['photos'] ?? []),
      // Backend uses 'images'
      status: RoommatePostStatus.fromString(json['status']),
      viewCount: json['viewCount'] ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      user: json['userId'] is Map ? json['userId'] : null,
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
      'lifestyle': lifestyle.toJson(),
      'preferredContact': preferredContact,
      'phoneNumber': phoneNumber,
      'emailAddress': emailAddress,
      'photos': photos,
    };
  }

  String get locationString => '$city, $province';

  String get budgetRangeString =>
      '${budgetMin.toStringAsFixed(0)} - ${budgetMax.toStringAsFixed(0)}';

  bool get isActive => status == RoommatePostStatus.active;

  bool get isSeeker => postType == RoommatePostType.seeker;

  bool get isProvider => postType == RoommatePostType.provider;

  // Get user name from populated user field
  String? get userName {
    if (user is Map) {
      final userMap = user as Map<String, dynamic>;
      final firstName = userMap['firstName'] ?? '';
      final lastName = userMap['lastName'] ?? '';
      return '$firstName $lastName'.trim();
    }
    return null;
  }

  String get formattedDate {
    return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  }

  String get formattedMoveInDate {
    return '${moveInDate.day}/${moveInDate.month}/${moveInDate.year}';
  }
}

/// Roommate Request model
class RoommateRequest {
  final String id;
  final String postId;
  final String senderId;
  final String receiverId;
  final String message;
  final RoommateRequestStatus status;
  final DateTime createdAt;

  // Populated fields
  final dynamic post;
  final dynamic sender;
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
    return RoommateRequest(
      id: json['_id'] ?? json['id'] ?? '',
      postId: json['postId'] is Map
          ? json['postId']['_id']
          : (json['postId'] ?? ''),
      senderId: json['senderId'] is Map
          ? json['senderId']['_id']
          : (json['senderId'] ?? ''),
      receiverId: json['receiverId'] is Map
          ? json['receiverId']['_id']
          : (json['receiverId'] ?? ''),
      message: json['message'] ?? '',
      status: RoommateRequestStatus.fromString(json['status']),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      post: json['postId'] is Map ? json['postId'] : null,
      sender: json['senderId'] is Map ? json['senderId'] : null,
      receiver: json['receiverId'] is Map ? json['receiverId'] : null,
    );
  }

  bool get isPending => status == RoommateRequestStatus.pending;

  bool get isAccepted => status == RoommateRequestStatus.accepted;

  bool get isRejected => status == RoommateRequestStatus.rejected;

  // Get sender name from populated sender field
  String? get senderName {
    if (sender is Map) {
      final senderMap = sender as Map<String, dynamic>;
      final firstName = senderMap['firstName'] ?? '';
      final lastName = senderMap['lastName'] ?? '';
      return '$firstName $lastName'.trim();
    }
    return null;
  }

  // Get receiver name from populated receiver field
  String? get receiverName {
    if (receiver is Map) {
      final receiverMap = receiver as Map<String, dynamic>;
      final firstName = receiverMap['firstName'] ?? '';
      final lastName = receiverMap['lastName'] ?? '';
      return '$firstName $lastName'.trim();
    }
    return null;
  }

  // Get post title from populated post field
  String? get postTitle {
    if (post is Map) {
      final postMap = post as Map<String, dynamic>;
      return postMap['title'];
    }
    return null;
  }

  // Get formatted date
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
class RoommateMatch {
  final String id;
  final String postId;
  final String userAId;
  final String userBId;
  final DateTime matchedAt;

  // Populated fields
  final dynamic post;
  final dynamic userA;
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
    return RoommateMatch(
      id: json['_id'] ?? json['id'] ?? '',
      postId: json['postId'] is Map
          ? json['postId']['_id']
          : (json['postId'] ?? ''),
      userAId: json['userAId'] is Map
          ? json['userAId']['_id']
          : (json['userAId'] ?? ''),
      userBId: json['userBId'] is Map
          ? json['userBId']['_id']
          : (json['userBId'] ?? ''),
      matchedAt: json['matchedAt'] != null
          ? DateTime.parse(json['matchedAt'])
          : DateTime.now(),
      post: json['postId'] is Map ? json['postId'] : null,
      userA: json['userAId'] is Map ? json['userAId'] : null,
      userB: json['userBId'] is Map ? json['userBId'] : null,
    );
  }
}
