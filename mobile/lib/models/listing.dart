import 'dart:convert';

class Listing {
  final String id;
  final String creator;
  final String category;
  final String type;
  final String streetAddress;
  final String aptSuite;
  final String city;
  final String province;
  final String country;
  final int guestCount;
  final int bedroomCount;
  final int bedCount;
  final int bathroomCount;
  final List<String> amenities;
  final List<String> listingPhotoPaths;
  final String title;
  final String description;
  final String highlight;
  final String highlightDesc;
  final double price;
  final String? priceType;
  final bool isAvailable;
  final bool isHidden;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final double? roomArea;

  final Map<String, dynamic>? creatorData;
  final Map<String, dynamic>? hostProfile;

  Listing({
    required this.id,
    required this.creator,
    required this.category,
    required this.type,
    required this.streetAddress,
    required this.aptSuite,
    required this.city,
    required this.province,
    required this.country,
    required this.guestCount,
    required this.bedroomCount,
    required this.bedCount,
    required this.bathroomCount,
    required this.amenities,
    required this.listingPhotoPaths,
    required this.title,
    required this.description,
    required this.highlight,
    required this.highlightDesc,
    required this.price,
    this.priceType,
    this.isAvailable = true,
    this.isHidden = false,
    this.creatorData,
    this.hostProfile,
    this.createdAt,
    this.updatedAt,
    this.roomArea,
  });

  String get fullAddress => '$streetAddress, $aptSuite, $city, $province, $country';

  String get shortAddress => '$city, $province';

  List<String> get photoUrls {
    return listingPhotoPaths
        .where((path) => !path.startsWith('blob:')) // Filter out blob URLs
        .map((path) {
      // If already a full URL (Cloudinary), return as is
      if (path.startsWith('http')) {
        return path;
      }
      // Otherwise, construct URL
      return 'http://localhost:3001/$path';
    }).toList();
  }

  String? get mainPhoto {
    final validPhotos = photoUrls;
    if (validPhotos.isEmpty) return null;
    return validPhotos.first;
  }

  double get dailyPrice {
    if (priceType == 'monthly') {
      return price / 30;
    }
    return price;
  }

  double get monthlyPrice {
    if (priceType == 'daily') {
      return price * 30;
    }
    return price;
  }

  String get hostName {
    if (creatorData != null) {
      final firstName = creatorData!['firstName'] ?? '';
      final lastName = creatorData!['lastName'] ?? '';
      if (firstName.isNotEmpty || lastName.isNotEmpty) {
        return '$firstName $lastName'.trim();
      }
    }
    return 'Host';
  }

  String? get hostProfileImage {
    return creatorData?['profileImagePath'];
  }

  String get hostInitial {
    if (creatorData != null) {
      final firstName = creatorData!['firstName'];
      if (firstName != null && firstName.isNotEmpty) {
        return firstName[0].toUpperCase();
      }
    }
    return 'H';
  }

  factory Listing.fromJson(Map<String, dynamic> json) {
    // Extract creator ID and data
    String creatorId;
    Map<String, dynamic>? creatorData;

    if (json['creator'] is String) {
      creatorId = json['creator'];
      creatorData = null;
    } else if (json['creator'] is Map) {
      creatorData = Map<String, dynamic>.from(json['creator']);
      creatorId = creatorData['_id'] ?? creatorData['id'] ?? '';
    } else {
      creatorId = '';
      creatorData = null;
    }

    // Backend uses isActive (true = visible, false = hidden)
    // Mobile uses isHidden (true = hidden, false = visible)
    // So we need to invert: isHidden = !isActive
    bool isActive = json['isActive'] ?? true;
    bool isHidden = !isActive;

    // Parse hostProfile
    Map<String, dynamic>? hostProfile;
    if (json['hostProfile'] != null) {
      if (json['hostProfile'] is String) {
        // If it's a JSON string, decode it
        try {
          final decoded = jsonDecode(json['hostProfile']);
          hostProfile = Map<String, dynamic>.from(decoded);
        } catch (e) {
          hostProfile = null;
        }
      } else if (json['hostProfile'] is Map) {
        hostProfile = Map<String, dynamic>.from(json['hostProfile']);
      }
    }

    return Listing(
      id: json['_id'] ?? json['id'] ?? '',
      creator: creatorId,
      creatorData: creatorData,
      hostProfile: hostProfile,
      category: json['category'] ?? '',
      type: json['type'] ?? '',
      streetAddress: json['streetAddress'] ?? '',
      aptSuite: json['aptSuite'] ?? '',
      city: json['city'] ?? '',
      province: json['province'] ?? '',
      country: json['country'] ?? '',
      guestCount: json['guestCount'] ?? 0,
      bedroomCount: json['bedroomCount'] ?? 0,
      bedCount: json['bedCount'] ?? 0,
      bathroomCount: json['bathroomCount'] ?? 0,
      amenities: json['amenities'] != null
          ? List<String>.from(json['amenities'])
          : [],
      listingPhotoPaths: json['listingPhotoPaths'] != null
          ? List<String>.from(json['listingPhotoPaths'])
          : [],
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      highlight: json['highlight'] ?? '',
      highlightDesc: json['highlightDesc'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      priceType: json['priceType'],
      isAvailable: json['isAvailable'] ?? true,
      isHidden: isHidden, // Use the inverted isActive value
      roomArea: json['roomArea'] != null ? (json['roomArea']).toDouble() : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'creator': creator,
      'category': category,
      'type': type,
      'streetAddress': streetAddress,
      'aptSuite': aptSuite,
      'city': city,
      'province': province,
      'country': country,
      'guestCount': guestCount,
      'bedroomCount': bedroomCount,
      'bedCount': bedCount,
      'bathroomCount': bathroomCount,
      'amenities': amenities,
      'listingPhotoPaths': listingPhotoPaths,
      'title': title,
      'description': description,
      'highlight': highlight,
      'highlightDesc': highlightDesc,
      'price': price,
      'priceType': priceType,
      'isAvailable': isAvailable,
      'isHidden': isHidden,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  Listing copyWith({
    String? id,
    String? creator,
    String? category,
    String? type,
    String? streetAddress,
    String? aptSuite,
    String? city,
    String? province,
    String? country,
    int? guestCount,
    int? bedroomCount,
    int? bedCount,
    int? bathroomCount,
    List<String>? amenities,
    List<String>? listingPhotoPaths,
    String? title,
    String? description,
    String? highlight,
    String? highlightDesc,
    double? price,
    String? priceType,
    bool? isAvailable,
    bool? isHidden,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Listing(
      id: id ?? this.id,
      creator: creator ?? this.creator,
      category: category ?? this.category,
      type: type ?? this.type,
      streetAddress: streetAddress ?? this.streetAddress,
      aptSuite: aptSuite ?? this.aptSuite,
      city: city ?? this.city,
      province: province ?? this.province,
      country: country ?? this.country,
      guestCount: guestCount ?? this.guestCount,
      bedroomCount: bedroomCount ?? this.bedroomCount,
      bedCount: bedCount ?? this.bedCount,
      bathroomCount: bathroomCount ?? this.bathroomCount,
      amenities: amenities ?? this.amenities,
      listingPhotoPaths: listingPhotoPaths ?? this.listingPhotoPaths,
      title: title ?? this.title,
      description: description ?? this.description,
      highlight: highlight ?? this.highlight,
      highlightDesc: highlightDesc ?? this.highlightDesc,
      price: price ?? this.price,
      priceType: priceType ?? this.priceType,
      isAvailable: isAvailable ?? this.isAvailable,
      isHidden: isHidden ?? this.isHidden,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

