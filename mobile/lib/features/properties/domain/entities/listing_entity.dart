import 'package:equatable/equatable.dart';

class ListingEntity extends Equatable {
  final String id;
  final String creatorId;
  final String category;
  final String type;
  
  // Location
  final String streetAddress;
  final String aptSuite;
  final String city;
  final String province;
  final String country;
  
  // Property details
  final int guestCount;
  final int bedroomCount;
  final int bedCount;
  final int bathroomCount;
  final double? roomArea;
  final List<String> amenities;
  final List<String> listingPhotoPaths;
  
  // Content
  final String title;
  final String description;
  final String highlight;
  final String highlightDesc;
  
  // Pricing & Status
  final double price;
  final String? priceType;
  final bool isAvailable;
  final bool isHidden;
  
  // External Relations
  final Map<String, dynamic>? creatorData;
  final Map<String, dynamic>? hostProfile;

  final DateTime? createdAt;
  final DateTime? updatedAt;

  const ListingEntity({
    required this.id,
    required this.creatorId,
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
    this.roomArea,
    this.creatorData,
    this.hostProfile,
    this.createdAt,
    this.updatedAt,
  });

  // Convenience Getters
  String get fullAddress =>
      '$streetAddress, $aptSuite, $city, $province, $country';

  String get shortAddress => '$city, $province';

  bool get isActive => isAvailable && !isHidden;

  List<String> get photoUrls {
    return listingPhotoPaths
        .where((path) => !path.startsWith('blob:'))
        .map((path) =>
            path.startsWith('http') ? path : 'http://localhost:3001/$path')
        .toList();
  }

  String? get mainPhoto => photoUrls.isNotEmpty ? photoUrls.first : null;

  double get dailyPrice => priceType == 'monthly' ? price / 30 : price;
  double get monthlyPrice => priceType == 'daily' ? price * 30 : price;

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

  @override
  List<Object?> get props => [
        id,
        creatorId,
        category,
        type,
        streetAddress,
        aptSuite,
        city,
        province,
        country,
        guestCount,
        bedroomCount,
        bedCount,
        bathroomCount,
        roomArea,
        amenities,
        listingPhotoPaths,
        title,
        description,
        highlight,
        highlightDesc,
        price,
        priceType,
        isAvailable,
        isHidden,
        createdAt,
        updatedAt,
      ];
}
