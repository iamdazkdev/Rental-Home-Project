import 'package:equatable/equatable.dart';

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

class LifestylePreferences extends Equatable {
  final String sleepSchedule; // EARLY_BIRD, NIGHT_OWL, FLEXIBLE
  final String smoking; // YES, NO, OUTSIDE_ONLY
  final String pets; // YES, NO, NEGOTIABLE
  final String cleanliness; // VERY_CLEAN, MODERATE, RELAXED
  final String? occupation;

  const LifestylePreferences({
    this.sleepSchedule = 'FLEXIBLE',
    this.smoking = 'NO',
    this.pets = 'NEGOTIABLE',
    this.cleanliness = 'MODERATE',
    this.occupation,
  });

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

  List<String> get displayList {
    final list = <String>[];
    if (sleepSchedule.isNotEmpty) list.add(sleepScheduleDisplay);
    if (smoking.isNotEmpty) list.add(smokingDisplay);
    if (pets.isNotEmpty) list.add(petsDisplay);
    if (cleanliness.isNotEmpty) list.add(cleanlinessDisplay);
    if (occupation != null && occupation!.isNotEmpty) list.add(occupation!);
    return list;
  }

  @override
  List<Object?> get props => [
        sleepSchedule,
        smoking,
        pets,
        cleanliness,
        occupation,
      ];
}

class RoommateEntity extends Equatable {
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
  final String genderPreference;
  final int? ageRangeMin;
  final int? ageRangeMax;

  // Lifestyle
  final LifestylePreferences lifestyle;

  // Contact
  final String preferredContact;
  final String? phoneNumber;
  final String? emailAddress;

  // Media
  final List<String> photos;

  // Status
  final RoommatePostStatus status;
  final int viewCount;
  final DateTime createdAt;
  final DateTime? updatedAt;

  // User populated details
  final Map<String, dynamic>? userData;

  const RoommateEntity({
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
    required this.lifestyle,
    this.preferredContact = 'CHAT',
    this.phoneNumber,
    this.emailAddress,
    this.photos = const [],
    required this.status,
    this.viewCount = 0,
    required this.createdAt,
    this.updatedAt,
    this.userData,
  });

  String get locationString => '$city, $province';

  String get budgetRangeString =>
      '${budgetMin.toStringAsFixed(0)} - ${budgetMax.toStringAsFixed(0)}';

  bool get isActive => status == RoommatePostStatus.active;
  bool get isSeeker => postType == RoommatePostType.seeker;
  bool get isProvider => postType == RoommatePostType.provider;

  String? get userName {
    if (userData != null) {
      final firstName = userData!['firstName'] ?? '';
      final lastName = userData!['lastName'] ?? '';
      final fullName = '$firstName $lastName'.trim();
      return fullName.isNotEmpty ? fullName : null;
    }
    return null;
  }

  String? get userProfileImage {
    return userData?['profileImagePath'];
  }

  String get userInitial {
    final name = userName;
    if (name != null && name.isNotEmpty) {
      return name[0].toUpperCase();
    }
    return '?';
  }

  String get formattedDate {
    return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  }

  String get formattedMoveInDate {
    return '${moveInDate.day}/${moveInDate.month}/${moveInDate.year}';
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        postType,
        title,
        description,
        city,
        province,
        country,
        budgetMin,
        budgetMax,
        moveInDate,
        genderPreference,
        ageRangeMin,
        ageRangeMax,
        lifestyle,
        preferredContact,
        phoneNumber,
        emailAddress,
        photos,
        status,
        viewCount,
        createdAt,
        updatedAt,
        userData,
      ];
}

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

class RoommateRequestEntity extends Equatable {
  final String id;
  final String postId;
  final String senderId;
  final String receiverId;
  final String message;
  final RoommateRequestStatus status;
  final DateTime createdAt;

  final Map<String, dynamic>? postData;
  final Map<String, dynamic>? senderData;
  final Map<String, dynamic>? receiverData;

  const RoommateRequestEntity({
    required this.id,
    required this.postId,
    required this.senderId,
    required this.receiverId,
    required this.message,
    required this.status,
    required this.createdAt,
    this.postData,
    this.senderData,
    this.receiverData,
  });

  bool get isPending => status == RoommateRequestStatus.pending;
  bool get isAccepted => status == RoommateRequestStatus.accepted;
  bool get isRejected => status == RoommateRequestStatus.rejected;

  String? get senderName {
    if (senderData != null) {
      final firstName = senderData!['firstName'] ?? '';
      final lastName = senderData!['lastName'] ?? '';
      final full = '$firstName $lastName'.trim();
      return full.isNotEmpty ? full : null;
    }
    return null;
  }

  String? get receiverName {
    if (receiverData != null) {
      final firstName = receiverData!['firstName'] ?? '';
      final lastName = receiverData!['lastName'] ?? '';
      final full = '$firstName $lastName'.trim();
      return full.isNotEmpty ? full : null;
    }
    return null;
  }

  String? get postTitle => postData?['title'];

  String get formattedDate {
    final now = DateTime.now();
    final diff = now.difference(createdAt);
    if (diff.inDays > 7) {
      return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
    } else if (diff.inDays > 0) {
      return '${diff.inDays}d ago';
    } else if (diff.inHours > 0) {
      return '${diff.inHours}h ago';
    } else if (diff.inMinutes > 0) {
      return '${diff.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  @override
  List<Object?> get props => [
        id, postId, senderId, receiverId, message, status, createdAt,
        postData, senderData, receiverData
      ];
}

class RoommateMatchEntity extends Equatable {
  final String id;
  final String postId;
  final String userAId;
  final String userBId;
  final DateTime matchedAt;

  final Map<String, dynamic>? postData;
  final Map<String, dynamic>? userAData;
  final Map<String, dynamic>? userBData;

  const RoommateMatchEntity({
    required this.id,
    required this.postId,
    required this.userAId,
    required this.userBId,
    required this.matchedAt,
    this.postData,
    this.userAData,
    this.userBData,
  });

  @override
  List<Object?> get props => [
        id, postId, userAId, userBId, matchedAt,
        postData, userAData, userBData
      ];
}
