class User {
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

  // Host Profile Info (for shared rooms)
  final String? sleepSchedule;
  final bool? isSmoker;
  final String? cleanliness;
  final String? personality;
  final String? noiseLevel;
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

  String get fullName => '$firstName $lastName';

  String? get profileImage {
    if (profileImagePath == null || profileImagePath!.isEmpty) {
      return null;
    }
    // If already a full URL (Cloudinary), return as is
    if (profileImagePath!.startsWith('http')) {
      return profileImagePath;
    }
    // Otherwise, construct URL
    return 'http://localhost:3001/$profileImagePath';
  }

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
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
    bool? isSmoker,
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

