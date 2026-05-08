import 'dart:convert';

import 'package:json_annotation/json_annotation.dart';

import '../config/api_config.dart';
import '../core/utils/json_converters.dart';

part 'listing.g.dart';

@JsonSerializable()
class Listing {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'creator')
  final String creator;

  @JsonKey(name: 'category', defaultValue: '')
  final String category;

  @JsonKey(name: 'type', defaultValue: '')
  final String type;

  @JsonKey(name: 'streetAddress', defaultValue: '')
  final String streetAddress;

  @JsonKey(name: 'aptSuite', defaultValue: '')
  final String aptSuite;

  @JsonKey(name: 'city', defaultValue: '')
  final String city;

  @JsonKey(name: 'province', defaultValue: '')
  final String province;

  @JsonKey(name: 'country', defaultValue: '')
  final String country;

  @JsonKey(name: 'guestCount')
  @SafeIntConverter()
  final int guestCount;

  @JsonKey(name: 'bedroomCount')
  @SafeIntConverter()
  final int bedroomCount;

  @JsonKey(name: 'bedCount')
  @SafeIntConverter()
  final int bedCount;

  @JsonKey(name: 'bathroomCount')
  @SafeIntConverter()
  final int bathroomCount;

  @JsonKey(name: 'amenities')
  @StringListConverter()
  final List<String> amenities;

  @JsonKey(name: 'listingPhotoPaths')
  @StringListConverter()
  final List<String> listingPhotoPaths;

  @JsonKey(name: 'title', defaultValue: '')
  final String title;

  @JsonKey(name: 'description', defaultValue: '')
  final String description;

  @JsonKey(name: 'highlight', defaultValue: '')
  final String highlight;

  @JsonKey(name: 'highlightDesc', defaultValue: '')
  final String highlightDesc;

  @JsonKey(name: 'price')
  @SafeDoubleConverter()
  final double price;

  @JsonKey(name: 'priceType')
  final String? priceType;

  @JsonKey(name: 'isAvailable', defaultValue: true)
  final bool isAvailable;

  @JsonKey(name: 'isHidden', defaultValue: false)
  final bool isHidden;

  @JsonKey(name: 'createdAt')
  @NullableDateTimeConverter()
  final DateTime? createdAt;

  @JsonKey(name: 'updatedAt')
  @NullableDateTimeConverter()
  final DateTime? updatedAt;

  @JsonKey(name: 'roomArea')
  @NullableSafeDoubleConverter()
  final double? roomArea;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final Map<String, dynamic>? creatorData;

  @JsonKey(includeFromJson: false, includeToJson: false)
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

  /// Custom fromJson that normalizes the raw JSON before passing to generated code.
  /// Handles: creator (String or populated Map), isActive→isHidden inversion,
  /// hostProfile (JSON string or Map).
  factory Listing.fromJson(Map<String, dynamic> json) {
    // Normalize creator field
    String creatorId = '';
    Map<String, dynamic>? creatorData;
    if (json['creator'] is String) {
      creatorId = json['creator'];
    } else if (json['creator'] is Map) {
      creatorData = Map<String, dynamic>.from(json['creator']);
      creatorId = creatorData['_id']?.toString() ?? '';
    }

    // Normalize isHidden from isActive
    final bool isHidden = !(json['isActive'] ?? true);

    // Normalize hostProfile
    Map<String, dynamic>? hostProfile;
    if (json['hostProfile'] is Map) {
      hostProfile = Map<String, dynamic>.from(json['hostProfile']);
    } else if (json['hostProfile'] is String) {
      try {
        hostProfile =
            Map<String, dynamic>.from(jsonDecode(json['hostProfile']));
      } catch (_) {}
    }

    final normalized = Map<String, dynamic>.from(json);
    normalized['creator'] = creatorId;
    normalized['isHidden'] = isHidden;

    final listing = _$ListingFromJson(normalized);
    return Listing(
      id: listing.id,
      creator: listing.creator,
      category: listing.category,
      type: listing.type,
      streetAddress: listing.streetAddress,
      aptSuite: listing.aptSuite,
      city: listing.city,
      province: listing.province,
      country: listing.country,
      guestCount: listing.guestCount,
      bedroomCount: listing.bedroomCount,
      bedCount: listing.bedCount,
      bathroomCount: listing.bathroomCount,
      amenities: listing.amenities,
      listingPhotoPaths: listing.listingPhotoPaths,
      title: listing.title,
      description: listing.description,
      highlight: listing.highlight,
      highlightDesc: listing.highlightDesc,
      price: listing.price,
      priceType: listing.priceType,
      isAvailable: listing.isAvailable,
      isHidden: isHidden,
      creatorData: creatorData,
      hostProfile: hostProfile,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      roomArea: listing.roomArea,
    );
  }

  Map<String, dynamic> toJson() => _$ListingToJson(this);

  // --- Computed properties ---

  String get fullAddress =>
      '$streetAddress, $aptSuite, $city, $province, $country';

  String get shortAddress => '$city, $province';

  String get hostId => creator;

  bool get isActive => isAvailable && !isHidden;

  List<String> get photoUrls {
    return listingPhotoPaths
        .where((path) => !path.startsWith('blob:'))
        .map((path) {
      if (path.startsWith('http')) return path;
      return '${ApiConfig.baseUrl}/$path';
    }).toList();
  }

  String? get mainPhoto {
    final validPhotos = photoUrls;
    if (validPhotos.isEmpty) return null;
    return validPhotos.first;
  }

  double get dailyPrice {
    if (priceType == 'monthly') return price / 30;
    return price;
  }

  double get monthlyPrice {
    if (priceType == 'daily') return price * 30;
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

  String? get hostProfileImage => creatorData?['profileImagePath'];

  String get hostInitial {
    if (creatorData != null) {
      final firstName = creatorData!['firstName'];
      if (firstName != null && firstName.isNotEmpty) {
        return firstName[0].toUpperCase();
      }
    }
    return 'H';
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

/// Type alias for backward compatibility with code expecting ListingModel
typedef ListingModel = Listing;
