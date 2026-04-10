import 'dart:convert';
import '../../domain/entities/listing_entity.dart';

class ListingModel extends ListingEntity {
  const ListingModel({
    required super.id,
    required super.creatorId,
    required super.category,
    required super.type,
    required super.streetAddress,
    required super.aptSuite,
    required super.city,
    required super.province,
    required super.country,
    required super.guestCount,
    required super.bedroomCount,
    required super.bedCount,
    required super.bathroomCount,
    required super.amenities,
    required super.listingPhotoPaths,
    required super.title,
    required super.description,
    required super.highlight,
    required super.highlightDesc,
    required super.price,
    super.priceType,
    super.isAvailable = true,
    super.isHidden = false,
    super.roomArea,
    super.creatorData,
    super.hostProfile,
    super.createdAt,
    super.updatedAt,
  });

  factory ListingModel.fromJson(Map<String, dynamic> json) {
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

    return ListingModel(
      id: json['_id'] ?? json['id'] ?? '',
      creatorId: creatorId,
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
      amenities:
          json['amenities'] != null ? List<String>.from(json['amenities']) : [],
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
      isHidden: isHidden,
      roomArea: json['roomArea'] != null ? (json['roomArea']).toDouble() : null,
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'creator': creatorId,
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
}
